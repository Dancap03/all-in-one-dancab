import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { db, auth } from '../../../../infrastructure/firebase/config';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { BudgetCard } from './components/BudgetCard';
import { ExpensesChart } from './components/ExpensesChart';
import { IncomeList } from './components/IncomeList';
import { TransfersList } from './components/TransfersList';
import { SummaryCards } from './components/SummaryCards';
import { TransactionModal } from './components/modals/TransactionModal';

export const DiaaDia = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Junio 2026
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Formateadores para filtrar por el mes seleccionado
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`; // "2026-06"

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 🚀 LÓGICA DE RECOLECCIÓN EN VIVO (Detecta los 1,69 € instantáneamente)
    const txRef = collection(db, `users/${user.uid}/transactions`);
    
    // Escuchamos la colección completa de transacciones del usuario
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const allTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 1. Filtrar los Ingresos del mes actual (incluyendo los retornos de inversión)
      const filteredIncomes = allTxs.filter((tx: any) => {
        const isIncome = tx.type === 'income' || tx.tipo === 'ingreso';
        const matchesMonth = tx.date && tx.date.startsWith(monthKey);
        return isIncome && matchesMonth;
      });

      // 2. Filtrar los Gastos del mes actual
      const filteredExpenses = allTxs.filter((tx: any) => {
        const isExpense = tx.type === 'expense' || tx.tipo === 'gasto';
        const matchesMonth = tx.date && tx.date.startsWith(monthKey);
        return isExpense && matchesMonth;
      });

      // 3. Filtrar las Transferencias/Movimientos internos del mes
      const filteredTransfers = allTxs.filter((tx: any) => {
        const isTransfer = tx.type === 'transfer' || tx.category?.toLowerCase() === 'inversión' || tx.category?.toLowerCase() === 'ahorro';
        const matchesMonth = tx.date && tx.date.startsWith(monthKey);
        return isTransfer && matchesMonth;
      });

      // Actualizamos los estados locales de la pantalla
      setIncomes(filteredIncomes);
      setExpenses(filteredExpenses);
      setTransfers(filteredTransfers);

      // Sincronizamos las cachés locales por si otros componentes las consumen
      localStorage.setItem('transactions', JSON.stringify(allTxs));
    }, (error) => {
      console.error("Error en el escuchador de Día a Día:", error);
    });

    return () => unsubscribe();
  }, [monthKey]);

  // Cambiar de mes hacia atrás o adelante
  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-16 animate-in fade-in duration-300">
      
      {/* Selector de Mes */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer"><ChevronLeft size={20}/></button>
          <h2 className="text-xl font-black text-white px-2">{monthNames[currentDate.getMonth()]} De {year}</h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-white bg-[#141416] border border-[#2d2d2d] rounded-xl transition-colors cursor-pointer"><ChevronRight size={20}/></button>
        </div>
        <button onClick={() => setIsTxModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
          <Plus size={16} strokeWidth={3}/> Añadir movimiento
        </button>
      </div>

      {/* Tarjetas de Balance Superior */}
      <SummaryCards incomes={incomes} expenses={expenses} />

      {/* Grid Principal de Datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Columna Izquierda: Presupuesto y Gráficos */}
        <div className="space-y-6">
          <BudgetCard expenses={expenses} monthKey={monthKey} />
          <ExpensesChart expenses={expenses} />
        </div>

        {/* Columna Derecha: Listas de Movimientos */}
        <div className="space-y-6">
          <IncomeList items={incomes} />
          <TransfersList items={transfers} />
        </div>

      </div>

      {isTxModalOpen && (
        <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} defaultDate={monthKey + "-01"} />
      )}

    </div>
  );
};
