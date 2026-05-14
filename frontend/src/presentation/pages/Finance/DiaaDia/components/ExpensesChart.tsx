import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpensesChartProps {
  transactions: any[];
}

export const ExpensesChart = ({ transactions }: ExpensesChartProps) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const hasExpenses = expenses.length > 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px] flex flex-col">
      <h2 className="font-bold text-gray-200 mb-4">Distribución de gastos</h2>
      {hasExpenses ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={expenses} 
              innerRadius={0} 
              outerRadius={80} 
              fill="#f59e0b" 
              dataKey="amount"
              nameKey="label"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
          No hay gastos registrados
        </div>
      )}
    </div>
  );
};
