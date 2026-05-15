import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FinanceService } from '../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../infrastructure/firebase/config';

import { SummaryCards } from './components/SummaryCards';
import { ExpensesChart } from './components/ExpensesChart';
import { ComparisonChart } from './components/ComparisonChart';
import { BudgetCard } from './components/BudgetCard';
import { IncomeList } from './components/IncomeList';
import { OtherExpensesList } from './components/OtherExpensesList';
import { TransfersList } from './components/TransfersList';

export const DiaaDia = () => {
  const [date, setDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Record<string, any>>({});

  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Variables para controlar el límite del futuro
  const realNow = new Date();
  const currentYear = realNow.getFullYear();
  const currentMonth = realNow.getMonth();
  const isCurrentMonth = date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  const maxMonthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthInputString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    if (history[monthId]) { setLoading(false); return; }

    setLoading(true);
    const unsubscribe = FinanceService.subscribeToMonthData(
      user.uid, monthId, (newData: any) => {
        setHistory(prev => ({ ...prev, [monthId]: newData }));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [monthId]);

  const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1));
  const handleNextMonth = () => { if (!isCurrentMonth) setDate(new Date(date.getFullYear(), date.getMonth() + 1)); };

  const monthData = history[monthId] || { budget: 0, transactions: [] };

  if (loading && !history[monthId]) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* Cabecera con Navegación de Meses y Selector Oculto */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={handlePrevMonth} className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1a1a1a]">
          <ChevronLeft size={24} />
        </button>
        
        <div className="relative flex items-center justify-center group cursor-pointer">
          <h1 className="text-xl font-bold capitalize group-hover:text-blue-500 transition-colors">
            {monthLabel}
          </h1>
          {/* Selector nativo de mes oculto sobre el texto */}
          <input 
            type="month"
            max={maxMonthString}
            value={currentMonthInputString}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setDate(new Date(parseInt(y), parseInt(m) - 1));
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <button 
          onClick={handleNextMonth} 
          disabled={isCurrentMonth}
          className={`p-1 rounded-md transition-colors ${isCurrentMonth ? 'text-[#2d2d2d] cursor-not-allowed' : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <SummaryCards transactions={monthData.transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExpensesChart transactions={monthData.transactions} />
        <ComparisonChart transactions={monthData.transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BudgetCard budget={monthData.budget} transactions={monthData.transactions} monthId={monthId} />
        <IncomeList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OtherExpensesList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
        <TransfersList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
      </div>
      
    </div>
  );
};
