import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { EyeOff, Settings, Share } from 'lucide-react';

interface Portfolio {
  id: string;
  nombre: string;
}

interface InvestmentSummaryProps {
  balance: { total: string; rendimiento: string; beneficio: string; positivo: boolean; };
  chartData: any[];
  activeTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  portfolios: Portfolio[];
  activePortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onAddPortfolio: () => void;
  hasPortfolios: boolean;
}

export const InvestmentSummary = ({ 
  balance, chartData, activeTimeframe, onTimeframeChange, 
  portfolios, activePortfolioId, onSelectPortfolio, onAddPortfolio, hasPortfolios
}: InvestmentSummaryProps) => {
  const timeframes = ['1D', '1W', '1M', 'YTD', '1Y', 'Max'];

  const showAggregated = portfolios.length > 1;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
      
      {/* Navegación Superior Estilo getquin */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold text-white text-lg mr-2">Carteras</span>
          
          {/* Si no hay carteras, no mostramos el menú de navegación interno */}
          {hasPortfolios && (
            <div className="flex gap-4">
              {showAggregated && (
                <button 
                  onClick={() => onSelectPortfolio('aggregated')}
                  className={`pb-1 transition-colors ${activePortfolioId === 'aggregated' ? 'text-white border-b-2 border-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Aggregated
                </button>
              )}
              
              {portfolios.map(p => (
                <button 
                  key={p.id}
                  onClick={() => onSelectPortfolio(p.id)}
                  className={`pb-1 transition-colors ${activePortfolioId === p.id ? 'text-white border-b-2 border-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onAddPortfolio} className="bg-transparent hover:bg-[#2d2d2d] text-white text-sm font-medium px-4 py-1.5 rounded-lg border border-[#2d2d2d] transition-colors flex items-center gap-2">
            <span>+ Agregar cuenta</span>
          </button>
          <button className="text-gray-400 hover:text-white"><Settings size={18} /></button>
          <button className="text-gray-400 hover:text-white"><Share size={18} /></button>
        </div>
      </div>

      {/* Cabecera del Balance y Controles del Gráfico */}
      <div className="flex justify-between items-start mb-8 mt-2">
        <div>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <EyeOff size={16} /> Ocultar
          </button>
          <h2 className="text-4xl font-bold text-white mb-2">{balance.total}</h2>
          <div className={`flex items-center gap-2 text-sm font-bold ${balance.positivo ? 'text-[#10b981]' : (hasPortfolios ? 'text-red-500' : 'text-[#10b981]')}`}>
            <span>{balance.positivo ? '↑' : (hasPortfolios && balance.total !== '0,00 €' ? '↓' : '↑')} {balance.rendimiento}</span>
            <span>({balance.beneficio})</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <button className="text-gray-400 hover:text-white text-sm flex items-center gap-2 font-medium">
            + Agregar punto de referencia
          </button>
          <div className="flex gap-2 text-xs font-medium text-gray-400">
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
        </div>
      </div>

      {/* Gráfica */}
      <div className="h-64 w-full border-b border-[#2d2d2d] border-dashed pb-2 relative">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', borderColor: '#2d2d2d', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: balance.positivo ? '#10b981' : '#ef4444' }}
                labelStyle={{ display: 'none' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={balance.positivo ? '#10b981' : '#ef4444'} 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6, fill: balance.positivo ? '#10b981' : '#ef4444', stroke: '#151515', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Línea recta si no hay datos */
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-full h-0.5 bg-[#10b981]"></div>
          </div>
        )}
      </div>
      <div className="pt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
        Gráfico por <span className="text-gray-400">AllInOne</span>
      </div>
    </div>
  );
};
