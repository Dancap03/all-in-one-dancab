interface SummaryCardsProps {
  transactions: any[];
}

export const SummaryCards = ({ transactions }: SummaryCardsProps) => {
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'other_expense').reduce((acc, t) => acc + t.amount, 0);
  
  // AÑADE savings_return AL BALANCE GENERAL
  const returnedSavings = transactions.filter(t => t.type === 'savings_return').reduce((acc, t) => acc + t.amount, 0);
  const balance = incomes - expenses + returnedSavings;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
        <p className="text-gray-400 text-sm font-medium mb-2">Balance</p>
        <p className={`text-3xl font-bold ${balance >= 0 ? 'text-[#60a5fa]' : 'text-[#f87171]'}`}>
          {balance > 0 ? '+' : ''}{balance.toFixed(2)}€
        </p>
      </div>

      {/* Ingresos */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
        <p className="text-gray-400 text-sm font-medium mb-2">Ingresos</p>
        <p className="text-3xl font-bold text-[#10b981]">
          +{incomes.toFixed(2)}€
        </p>
      </div>

      {/* Gastos */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
        <p className="text-gray-400 text-sm font-medium mb-2">Gastos</p>
        <p className="text-3xl font-bold text-[#ef4444]">
          -{expenses.toFixed(2)}€
        </p>
      </div>
    </div>
  );
};
