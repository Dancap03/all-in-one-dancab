import { Plus } from 'lucide-react';

export const IncomeList = ({ transactions }: { transactions: any[] }) => {
  const incomes = transactions.filter(t => t.type === 'income');

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 flex flex-col">
      <h2 className="font-bold mb-4">Ingresos</h2>
      <div className="flex-1 space-y-4">
        {incomes.map((inc, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-[#2d2d2d]">
            <div>
              <p className="text-sm font-semibold">{inc.label}</p>
              <p className="text-[11px] text-gray-500">9 may</p>
            </div>
            <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-gray-400">
        <Plus size={16} /> Añadir ingreso
      </button>
    </div>
  );
};
