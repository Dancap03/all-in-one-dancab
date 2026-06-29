import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { db, auth } from '../../../../infrastructure/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// Componentes del módulo
import { SummaryCards } from './components/SummaryCards';
import { ExpensesChart } from './components/ExpensesChart';
import { ComparisonChart } from './components/ComparisonChart';
import { BudgetCard } from './components/BudgetCard';
import { OtherExpensesList } from './components/OtherExpensesList';
import { IncomeList } from './components/IncomeList';
import { TransfersList } from './components/TransfersList';
import { TransactionModal } from './components/modals/TransactionModal';

export const DiaaDia = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Junio 2026
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  
  // Estado para controlar el tipo de transacción al abrir el modal
  const [modalType, setModalType] = useState<'income' | 'expense' | 'transfer'>('expense');

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`; // "2026-06"

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthLabel = `${monthNames[currentDate.getMonth()]} De ${year}`; // "Junio De 2026"

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const txRef = collection(db, `users/${user.uid}/transactions`);
    
    // Escuchador en tiempo real para capturar cualquier cambio externo (como el 1,69 €)
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const allTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtramos las transacciones del mes activo
      const currentMonthTxs = allTxs.filter((tx: any) => tx.date && tx.date.startsWith(monthKey));

      setTransactions(currentMonthTxs);
      localStorage.setItem('transactions', JSON.stringify(allTxs));
    }, (error) => {
      console.error("Error cargando transacciones en tiempo real:", error);
    });

    return () => unsubscribe();
  }, [monthKey]);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // Función rápida para abrir el modal con un tipo específico
  const openModalWithProps = (type: 'income' | 'expense' | 'transfer') => {
    setModalType(type);
    setIsTxModalOpen(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-16 animate-in fade-in duration-300">
      
      {/* Selector de Mes */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <ChevronLeft size={20}/>
          </button>
          <h2 className="text-xl font-black text-white px-2">{monthLabel}</h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <ChevronRight size={20}/>
          </button>
        </div>
        <button onClick={() => openModalWithProps('expense')} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
          <Plus size={16} strokeWidth={3}/> Añadir movimiento
        </button>
      </div>

      {/* Tarjetas de Balance resumido */}
      <SummaryCards transactions={transactions} />

      {/* Gráficas mensuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ExpensesChart transactions={transactions} />
        <ComparisonChart transactions={transactions} />
      </div>

      {/* Bloques de contenido y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          <BudgetCard transactions={transactions} />
          <OtherExpensesList transactions={transactions} monthId={monthKey} monthLabel={monthLabel} />
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          <IncomeList transactions={transactions} monthId={monthKey} monthLabel={monthLabel} />
          <TransfersList transactions={transactions} monthId={monthKey} monthLabel={monthLabel} />
        </div>

      </div>

      {/* Modal de Transacciones con todas sus propiedades estrictas */}
      {isTxModalOpen && (
        <TransactionModal 
          isOpen={isTxModalOpen} 
          onClose={() => setIsTxModalOpen(false)} 
          monthId={monthKey}
          type={modalType}
        />
      )}

    </div>
  );
};
