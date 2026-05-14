import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ComparisonChartProps {
  transactions: any[];
}

export const ComparisonChart = ({ transactions }: ComparisonChartProps) => {
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = incomes - expenses;
  
  const hasData = transactions.length > 0;
  
  const dataDonut = [
    { name: 'Ingresos', value: incomes },
    { name: 'Gastos', value: expenses }
  ];

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px] flex flex-col">
      <h2 className="font-bold text-gray-200 mb-4">Ingresos vs Gastos</h2>
      {hasData ? (
        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dataDonut} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                <Cell fill="#3b82f6" />
                <Cell fill="#ef4444" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>
              {balance >= 0 ? `+${balance.toFixed(0)}€` : `${balance.toFixed(0)}€`}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">balance</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
          Esperando transacciones...
        </div>
      )}
    </div>
  );
};
