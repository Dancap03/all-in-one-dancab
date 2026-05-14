import { useState } from 'react';
import { Edit2, Plus } from 'lucide-react';
import { BudgetModal } from './modals/BudgetModal';
import { TransactionModal } from './modals/TransactionModal';

interface BudgetCardProps {
  budget: number;
  transactions: any[];
  monthId: string;
}

export const BudgetCard = ({ budget, transactions, monthId }: BudgetCardProps) => {
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const remaining = budget - expenses;
  const percent = budget > 0 ? (expenses / budget) * 100 : 0;

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-200">Presupuesto mensual</h2>
          <button onClick={() => setIsBudgetOpen(true)} className="bg-[#2d2d2d] p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
            <Edit2 size={14} />
          </button>
        </div>

        <div className="flex justify-between text-sm mb-3">
          <p className="text-gray-400">Presupuesto: <b className="text-white">{budget}€</b></p>
          <p className={`${remaining >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
            Restante: {remaining.toFixed(2)}€
          </p>
        </div>

        <div className="relative h-16 w-full bg-[#0c0c0c] rounded-lg overflow-hidden border border-[#2d2d2d]">
          <div className="absolute inset-0 bg-[#10b981] opacity-25"></div>
          <div 
            className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-700 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
            style={{ width: `${Math.min(percent, 100)}%` }}
          ></div>
        </div>

        <button onClick={() => setIsExpenseOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
          <Plus size={16} /> Añadir gasto
        </button>
      </div>

      {/* Modales ocultos hasta que se pulsan los botones */}
      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} monthId={monthId} currentBudget={budget} />
      <TransactionModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} monthId={monthId} type="expense" />
    </>
  );
};
