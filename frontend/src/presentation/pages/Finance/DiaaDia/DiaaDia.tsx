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
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(date.getFullYear());

  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const realNow = new Date();
  const currentYear = realNow.getFullYear();
  const currentMonth = realNow.getMonth();
  const isCurrentMonth = date.getFullYear() === currentYear && date.getMonth() === currentMonth;

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
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={handlePrevMonth} className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1a1a1a]">
          <ChevronLeft size={24} />
        </button>
        
        <div className="relative flex items-center justify-center group">
          <h1 
            onClick={() => { setPickerYear(date.getFullYear()); setIsDatePickerOpen(true); }}
            className="text-xl font-bold capitalize cursor-pointer hover:text-blue-500 transition-colors"
          >
            {monthLabel}
          </h1>
          
          {isDatePickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>
              <div className="absolute top-full mt-2 left-0 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl z-50 p-4 w-72">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setPickerYear(prev => prev - 1)} className="p-1 hover:bg-[#252525] rounded transition-colors text-gray-400 hover:text-white">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-bold text-lg text-white">{pickerYear}</span>
                  <button 
                    onClick={() => setPickerYear(prev => prev + 1)} 
                    disabled={pickerYear >= currentYear}
                    className={`p-1 rounded transition-colors ${pickerYear >= currentYear ? 'text-[#2d2d2d] cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-[#252525]'}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {monthNamesShort.map((m, i) => {
                    const isDisabled = pickerYear === currentYear && i > currentMonth;
                    const isSelected = date.getFullYear() === pickerYear && date.getMonth() === i;
                    return (
                      <button
                        key={m}
                        disabled={isDisabled}
                        onClick={() => { setDate(new Date(pickerYear, i)); setIsDatePickerOpen(false); }}
                        className={`py-2 text-sm rounded-lg transition-all ${
                          isDisabled ? 'opacity-20 cursor-not-allowed' : 
                          isSelected ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20' : 
                          'bg-[#151515] border border-[#2d2d2d] hover:border-gray-500 text-gray-300 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
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

      {/* Primer bloque de listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BudgetCard budget={monthData.budget} transactions={monthData.transactions} monthId={monthId} />
        <IncomeList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
      </div>

      {/* Segundo bloque de listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OtherExpensesList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
        <TransfersList transactions={monthData.transactions} monthId={monthId} monthLabel={monthLabel.split(' ')[0]} />
      </div>
      
    </div>
  );
};
