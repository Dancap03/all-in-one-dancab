interface SummaryCardsProps {
  transactions: any[];
}

export const SummaryCards = ({ transactions }: SummaryCardsProps) => {
  // Entradas de dinero
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const returnedSavings = transactions.filter(t => t.type === 'savings_return').reduce((acc, t) => acc + t.amount, 0);
  const totalIncomes = incomes + returnedSavings;

  // Salidas de dinero (Gastos operativos + Dinero enviado a ahorro/inversión)
  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'other_expense').reduce((acc, t) => acc + t.amount, 0);
  const transfersOut = transactions.filter(t => t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0);
  const totalOutflows = expenses + transfersOut;

  // Balance final real
  const balance = totalIncomes - totalOutflows;

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
          +{totalIncomes.toFixed(2)}€
        </p>
      </div>

      {/* Gastos Totales (Incluye ahorro) */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
        <p className="text-gray-400 text-sm font-medium mb-2">Salidas (Gastos + Ahorro)</p>
        <p className="text-3xl font-bold text-[#ef4444]">
          -{totalOutflows.toFixed(2)}€
        </p>
      </div>
    </div>
  );
};
