import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TransactionModal } from './modals/TransactionModal';

interface IncomeListProps {
  transactions: any[];
  monthId: string;
  monthLabel: string; // Para mostrar "en mayo", "en junio", etc.
}

export const IncomeList = ({ transactions, monthId, monthLabel }: IncomeListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filtramos solo los ingresos
  const incomes = transactions.filter(t => t.type === 'income');

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-fit shadow-sm">
        <h2 className="font-bold text-gray-200 mb-6">Ingresos</h2>
        
        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
          {incomes.length > 0 ? (
            incomes.map((inc, i) => {
              // Formatear la fecha (ej. "9 may")
              const dateStr = inc.dateString 
                ? new Date(inc.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
                : 'Recibido';
              
              return (
                <div key={i} className="flex justify-between items-center p-4 border border-[#2d2d2d] rounded-xl bg-[#151515]">
                  <div>
                    {/* Si no hay descripción (label), mostramos la categoría o un guion */}
                    <p className="text-sm font-semibold text-white">{inc.label || inc.category || '—'}</p>
                    <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                  </div>
                  <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
                </div>
              );
            })
          ) : (
            <div className="py-8 flex items-center justify-center">
              <p className="text-gray-500 italic text-sm">
                No hay ingresos registrados en {monthLabel.toLowerCase()}.
              </p>
            </div>
          )}
        </div>

        {/* Botón de añadir con diseño dashed */}
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-full flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all"
        >
          <Plus size={16} /> Añadir ingreso
        </button>
      </div>

      {/* El modal que creamos antes, configurado en modo 'income' */}
      <TransactionModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        monthId={monthId} 
        type="income" 
      />
    </>
  );
};
