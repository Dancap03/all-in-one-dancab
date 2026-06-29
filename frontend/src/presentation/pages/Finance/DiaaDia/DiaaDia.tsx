import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db, auth } from '../../../../infrastructure/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// 🚀 IMPORTAMOS TODOS LOS COMPONENTES EN BASE A TUS CAPTURAS
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

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`; // "2026-06"

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const txRef = collection(db, `users/${user.uid}/transactions`);
    
    // 🚀 ESCUCHADOR EN VIVO: Trae todo y filtra por mes para alimentar los componentes
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const allTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtramos únicamente las transacciones que pertenezcan al mes activo
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

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-16 animate-in fade-in duration-300">
      
      {/* Selector de Mes Superior */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <ChevronLeft size={20}/>
          </button>
          <h2 className="text-xl font-black text-white px-2">{monthNames[currentDate.getMonth()]} De {year}</h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>

      {/* 💳 TARJETAS DE BALANCE (Balance, Ingresos, Salidas) */}
      <SummaryCards transactions={transactions} />

      {/* 📊 SECCIÓN DE GRÁFICOS (Distribución e Ingresos vs Salidas side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ExpensesChart transactions={transactions} />
        <ComparisonChart transactions={transactions} />
      </div>

      {/* 📑 REPARTO EN DOS COLUMNAS IGUAL QUE EN TUS CAPTURAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* COLUMNA IZQUIERDA: Presupuesto Mensual + Otros Gastos */}
        <div className="space-y-6">
          <BudgetCard transactions={transactions} monthKey={monthKey} />
          <OtherExpensesList transactions={transactions} />
        </div>

        {/* COLUMNA DERECHA: Lista de Ingresos + Lista de Transacciones */}
        <div className="space-y-6">
          <IncomeList transactions={transactions} />
          <TransfersList transactions={transactions} />
        </div>

      </div>

      {/* MODAL DE TRANSACCIONES */}
      {isTxModalOpen && (
        <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} />
      )}

    </div>
  );
};
