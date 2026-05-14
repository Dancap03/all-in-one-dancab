import { Edit2, Plus } from 'lucide-react';

export const BudgetCard = ({ budget, transactions }: { budget: number, transactions: any[] }) => {
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const percent = budget > 0 ? (expenses / budget) * 100 : 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold">Presupuesto mensual</h2>
        <button className="bg-[#2d2d2d] p-1.5 rounded-md"><Edit2 size={14} /></button>
      </div>
      <div className="flex justify-between text-sm mb-3">
        <p>Presupuesto: <b>{budget}€</b></p>
        <p className="text-green-500">Restante: {(budget - expenses).toFixed(2)}€</p>
      </div>
      <div className="relative h-16 w-full bg-[#0c0c0c] rounded-lg overflow-hidden border border-[#2d2d2d]">
        <div className="absolute inset-0 bg-[#10b981] opacity-30"></div>
        <div 
          className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-700" 
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
      <button className="w-full mt-6 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-gray-400">
        <Plus size={16} /> Añadir gasto
      </button>
    </div>
  );
};
