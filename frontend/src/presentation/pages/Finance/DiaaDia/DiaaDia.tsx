import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FinanceService } from '../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../infrastructure/firebase/config'; 

// Sub-componentes importados según tu estructura en image_956520.png
import { SummaryCards } from './components/SummaryCards';
import { ExpensesChart } from './components/ExpensesChart';
import { ComparisonChart } from './components/ComparisonChart';
import { BudgetCard } from './components/BudgetCard';

export const DiaaDia = () => {
  // Estado para gestionar la fecha actual (referencia Mayo 2026)
  const [date, setDate] = useState(new Date(2026, 4)); // Mayo es el índice 4
  const [loading, setLoading] = useState(true);

  // El "ArrayList" (Caché) para guardar datos de meses ya consultados
  const [history, setHistory] = useState<Record<string, any>>({});

  // Identificadores para la base de datos (ej: "2026-05") y visualización
  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Si el mes ya está en nuestro historial (caché), no hacemos fetch a Firebase
    if (history[monthId]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Suscripción en tiempo real a los datos del mes
    const unsubscribe = FinanceService.subscribeToMonthData(
      user.uid,
      monthId,
      (newData) => {
        // Guardamos los datos en nuestro historial antes de mostrar
        setHistory(prev => ({ ...prev, [monthId]: newData }));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [monthId]);

  // Lógica de navegación (ArrayList de meses)
  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1));
  };

  // Datos del mes actual obtenidos del historial
  const monthData = history[monthId] || { budget: 0, transactions: [] };

  if (loading && !history[monthId]) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-current"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* Cabecera con Navegación de Meses */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handlePrevMonth} 
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold capitalize">{monthLabel}</h1>
        <button 
          onClick={handleNextMonth} 
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 1. Tarjetas de Resumen (Balance, Ingresos, Gastos) */}
      <SummaryCards transactions={monthData.transactions} />

      {/* 2. Fila de Gráficas: Distribución y Comparativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExpensesChart transactions={monthData.transactions} />
        <ComparisonChart transactions={monthData.transactions} />
      </div>

      {/* 3. Control de Presupuesto y Listado de Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetCard 
          budget={monthData.budget} 
          transactions={monthData.transactions} 
          monthId={monthId}
        />
        
        {/* Sección de Ingresos (Se puede modularizar luego si crece mucho) */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-200 mb-6">Ingresos Recientes</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {monthData.transactions.filter((t: any) => t.type === 'income').length > 0 ? (
              monthData.transactions
                .filter((t: any) => t.type === 'income')
                .map((inc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-[#262626] last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{inc.label}</p>
                      <p className="text-[11px] text-gray-500 uppercase tracking-tighter">Recibido</p>
                    </div>
                    <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
                  </div>
                ))
            ) : (
              <p className="text-gray-600 italic text-sm text-center py-8">
                No hay ingresos registrados en {monthLabel.split(' ')[0]}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
