export const SummaryCards = ({ transactions }: { transactions: any[] }) => {
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = incomes - expenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
        <p className="text-gray-400 text-sm mb-1">Balance</p>
        <p className="text-2xl font-bold text-blue-500">{balance.toFixed(2)}€</p>
      </div>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
        <p className="text-gray-400 text-sm mb-1">Ingresos</p>
        <p className="text-2xl font-bold text-green-500">+{incomes.toFixed(2)}€</p>
      </div>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
        <p className="text-gray-400 text-sm mb-1">Gastos</p>
        <p className="text-2xl font-bold text-red-500">-{expenses.toFixed(2)}€</p>
      </div>
    </div>
  );
};
