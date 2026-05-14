import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpensesChartProps {
  transactions: any[];
}

export const ExpensesChart = ({ transactions }: ExpensesChartProps) => {
  // Calculamos los 4 grandes bloques de salidas de dinero
  const budgetExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const otherExpenses = transactions.filter(t => t.type === 'other_expense').reduce((acc, t) => acc + t.amount, 0);
  const investments = transactions.filter(t => t.type === 'transfer' && t.category === 'Inversión').reduce((acc, t) => acc + t.amount, 0);
  const savings = transactions.filter(t => t.type === 'transfer' && t.category === 'Ahorro').reduce((acc, t) => acc + t.amount, 0);

  // Asignamos colores a cada categoría
  const rawData = [
    { name: 'Presupuesto gastado', value: budgetExpenses, color: '#34d399' }, // Verde esmeralda
    { name: 'Otros gastos', value: otherExpenses, color: '#fb923c' },        // Naranja
    { name: 'Inversión', value: investments, color: '#fbbf24' },             // Amarillo
    { name: 'Ahorro', value: savings, color: '#818cf8' }                     // Índigo
  ];

  const total = rawData.reduce((sum, item) => sum + item.value, 0);
  
  // Filtramos los que están a 0 para que no salgan en la gráfica ni en la leyenda
  const data = rawData.filter(item => item.value > 0).map(item => ({
    ...item,
    percent: ((item.value / total) * 100).toFixed(1)
  }));

  // Tooltip personalizado al pasar el ratón
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
      <h2 className="font-bold text-gray-200 mb-4">Distribución de gastos</h2>
      
      {data.length > 0 ? (
        <>
          <div className="flex-1 relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data} 
                  innerRadius={0} 
                  outerRadius={90} 
                  dataKey="value" 
                  stroke="#1a1a1a" // Borde oscuro para separar los trozos
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda dinámica con cuadrados */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
          No hay salidas de dinero registradas
        </div>
      )}
    </div>
  );
};
