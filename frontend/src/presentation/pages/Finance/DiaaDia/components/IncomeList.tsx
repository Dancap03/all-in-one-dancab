import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TransactionModal } from './modals/TransactionModal';

interface IncomeListProps {
  transactions: any[];
  monthId: string; // <-- OJO: Asegúrate de pasar el monthId desde DiaaDia.tsx
}

export const IncomeList = ({ transactions, monthId }: IncomeListProps) => {
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const incomes = transactions.filter(t => t.type === 'income');

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 flex flex-col shadow-sm">
        <h2 className="font-bold text-gray-200 mb-6">Ingresos</h2>
        
        <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {incomes.length > 0 ? incomes.map((inc, i) => {
            // Formatear fecha si existe (ej. 2026-05-14 -> 14 may)
            const dateStr = inc.dateString ? new Date(inc.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Recibido';
            
            return (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#262626] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{inc.label}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-tighter">{dateStr}</p>
                </div>
                <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
              </div>
            );
          }) : (
            <p className="text-gray-600 italic text-sm text-center py-4">No hay ingresos registrados.</p>
          )}
        </div>

        <button onClick={() => setIsIncomeOpen(true)} className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
          <Plus size={16} /> Añadir ingreso
        </button>
      </div>

      <TransactionModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} monthId={monthId} type="income" />
    </>
  );
};
