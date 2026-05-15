import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

interface InvestmentSummaryProps {
  balance: {
    total: string;
    rendimiento: string;
    beneficio: string;
    positivo: boolean;
  };
  chartData: any[];
  activeTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export const InvestmentSummary = ({ balance, chartData, activeTimeframe, onTimeframeChange }: InvestmentSummaryProps) => {
  const timeframes = ['1D', '1W', '1M', 'YTD', '1Y', 'Max'];

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 mb-6 shadow-sm">
      {/* Cabecera del Balance */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">{balance.total}</h2>
          <div className={`flex items-center gap-2 text-sm font-medium ${balance.positivo ? 'text-[#10b981]' : 'text-red-500'}`}>
            <span>{balance.positivo ? '↑' : '↓'} {balance.rendimiento}</span>
            <span>({balance.beneficio})</span>
          </div>
        </div>
        <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm px-4 py-2 rounded-lg border border-[#2d2d2d] transition-colors">
          + Agregar cuenta (2)
        </button>
      </div>

      {/* Selectores de Tiempo */}
      <div className="flex gap-2 text-xs font-medium text-gray-400 mb-6 border-b border-[#2d2d2d] pb-4">
        {timeframes.map((period) => (
          <button 
            key={period} 
            onClick={() => onTimeframeChange(period)}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTimeframe === period ? 'bg-[#252525] text-white' : 'hover:text-white hover:bg-[#1a1a1a]'}`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Gráfica */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Tooltip 
              contentStyle={{ backgroundColor: '#151515', borderColor: '#2d2d2d', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#151515', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
