import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const ComparisonChart = ({ transactions }: { transactions: any[] }) => {
  const inc = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const exp = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const data = [{ value: inc }, { value: exp }];

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px]">
      <h2 className="font-bold mb-4">Ingresos vs Gastos</h2>
      <div className="h-full relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              <Cell fill="#3b82f6" /><Cell fill="#ef4444" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-10">
          <p className="text-xl font-bold">+{inc - exp}€</p>
          <p className="text-[10px] text-gray-500">BALANCE</p>
        </div>
      </div>
    </div>
  );
};
