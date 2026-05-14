import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ComparisonChartProps {
  transactions: any[];
}

export const ComparisonChart = ({ transactions }: ComparisonChartProps) => {
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  
  // Para el balance operativo, consideramos gastos tanto los del presupuesto como los imprevistos
  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'other_expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = incomes - expenses;
  
  const total = incomes + expenses;
  
  const rawData = [
    { name: 'Ingresos', value: incomes, color: '#60a5fa' }, // Azul claro
    { name: 'Gastos', value: expenses, color: '#f87171' }   // Rojo claro
  ];

  const data = rawData.map(item => ({
    ...item,
    percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));

  const hasData = total > 0;

  // Tooltip personalizado igual que el de gastos
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, percent } = payload[0].payload;
      return (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-white text-sm font-medium">
            {name}: {value.toFixed(2)}€ ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px] flex flex-col shadow-sm">
      <h2 className="font-bold text-gray-200 mb-4">Ingresos vs Gastos</h2>
      
      {hasData ? (
        <>
          <div className="flex-1 relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.filter(d => d.value > 0)} 
                  innerRadius={70} 
                  outerRadius={90} 
                  dataKey="value" 
                  stroke="#1a1a1a" 
                  strokeWidth={3}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto central del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-[#60a5fa]' : 'text-[#f87171]'}`}>
                {balance >= 0 ? `+${balance.toFixed(0)}€` : `${balance.toFixed(0)}€`}
              </p>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">balance</p>
            </div>
          </div>

          {/* Leyenda inferior con círculos y cantidades exactas */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"></div>
              <span className="text-xs text-gray-400">Ingresos: {incomes.toFixed(2)}€</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]"></div>
              <span className="text-xs text-gray-400">Gastos: {expenses.toFixed(2)}€</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
          Esperando transacciones...
        </div>
      )}
    </div>
  );
};
