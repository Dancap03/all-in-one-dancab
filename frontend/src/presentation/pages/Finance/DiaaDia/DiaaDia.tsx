import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FinanceService } from '../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../infrastructure/firebase/config';

// Importación de todos los sub-componentes modulares
import { SummaryCards } from './components/SummaryCards';
import { ExpensesChart } from './components/ExpensesChart';
import { ComparisonChart } from './components/ComparisonChart';
import { BudgetCard } from './components/BudgetCard';
import { IncomeList } from './components/IncomeList';
import { OtherExpensesList } from './components/OtherExpensesList';
import { TransfersList } from './components/TransfersList';

export const DiaaDia = () => {
  // Estado inicial fijado en Mayo 2026
  const [date, setDate] = useState(new Date(2026, 4)); 
  const [loading, setLoading] = useState(true);

  // Caché para guardar datos de meses ya consultados
  const [history, setHistory] = useState<Record<string, any>>({});

  // Identificadores de fecha
  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    if (history[monthId]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = FinanceService.subscribeToMonthData(
      user.uid,
      monthId,
      (newData) => {
        setHistory(prev => ({ ...prev, [monthId]: newData }));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [monthId]);

  // Navegación entre meses
  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1));
  };

  const monthData = history[monthId] || { budget: 0, transactions: [] };

  // Pantalla de carga
  if (loading && !history[monthId]) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* Cabecera con Navegación de Meses */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handlePrevMonth} 
          className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1a1a1a]"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold capitalize">{monthLabel}</h1>
        <button 
          onClick={handleNextMonth} 
          className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1a1a1a]"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 1. Tarjetas Superiores */}
      <SummaryCards transactions={monthData.transactions} />

      {/* 2. Fila de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExpensesChart transactions={monthData.transactions} />
        <ComparisonChart transactions={monthData.transactions} />
      </div>

      {/* 3. Fila de Control Financiero (Presupuesto e Ingresos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BudgetCard 
          budget={monthData.budget} 
          transactions={monthData.transactions} 
          monthId={monthId}
        />
        
        <IncomeList 
          transactions={monthData.transactions} 
          monthId={monthId} 
          monthLabel={monthLabel.split(' ')[0]} 
        />
      </div>

      {/* 4. Fila de Imprevistos e Inversiones (NUEVA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OtherExpensesList 
          transactions={monthData.transactions} 
          monthId={monthId} 
          monthLabel={monthLabel.split(' ')[0]} 
        />
        
        <TransfersList 
          transactions={monthData.transactions} 
          monthId={monthId} 
          monthLabel={monthLabel.split(' ')[0]} 
        />
      </div>
      
    </div>
  );
};
