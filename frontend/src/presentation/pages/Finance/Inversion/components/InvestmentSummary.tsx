import { useState } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
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
  onOpenSettings: () => void;
  hasPortfolios: boolean; 
}

export const InvestmentSummary = ({ 
  balance, chartData, activeTimeframe, onTimeframeChange, 
  portfolios, activePortfolioId, onSelectPortfolio, onAddPortfolio, onOpenSettings, hasPortfolios
}: InvestmentSummaryProps) => {
  const timeframes = ['1D', '1W', '1M', 'YTD', '1Y', 'Max'];
  const showAggregated = portfolios.length > 1;

  // Estado para capturar el punto exacto por donde pasa el ratón
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Lógica para mostrar el balance dinámico (Si hay hover, recalcula. Si no, muestra el general)
  let displayTotal = balance.total;
  let displayRendimiento = balance.rendimiento;
  let displayBeneficio = balance.beneficio;
  let isPositivo = balance.positivo;

  if (hoveredPoint && chartData.length > 0) {
    const baseline = chartData[0].value; // El valor base es el primer punto de la gráfica
    const currentVal = hoveredPoint.value;
    const diff = currentVal - baseline;
    const perc = baseline !== 0 ? (diff / baseline) * 100 : 0;
    
    isPositivo = diff >= 0;
    
    // Formateo estilo getquin
    displayTotal = `${currentVal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    displayRendimiento = `${isPositivo ? '↗' : '↘'} ${Math.abs(perc).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
    displayBeneficio = `${isPositivo ? '+' : ''}${diff.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  } else if (hasPortfolios && balance.total !== '0,00 €') {
    // Ajuste de flechas para el estado por defecto
    displayRendimiento = displayRendimiento.replace('↑', '↗').replace('↓', '↘');
  }

  // Tooltip personalizado para recrear la fecha flotante
  const CustomTooltip = ({ active, label }: any) => {
    if (active && label) {
      return (
        <div className="relative -top-8 text-[#a3a3a3] text-xs font-medium whitespace-nowrap bg-transparent text-center">
          {label}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm">
      
      {/* Navegación Superior Estilo getquin */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold text-white text-lg mr-2">Carteras</span>
          
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
          <button onClick={onOpenSettings} disabled={activePortfolioId === 'aggregated' || !hasPortfolios} className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Settings size={18} />
          </button>
          <button className="text-gray-400 hover:text-white"><Share size={18} /></button>
        </div>
      </div>

      {/* Cabecera del Balance (Ahora 100% Dinámica) */}
      <div className="flex justify-between items-start mb-8 mt-2">
        <div>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <EyeOff size={16} /> Ocultar
          </button>
          <h2 className="text-4xl font-bold text-white mb-2 transition-all">{displayTotal}</h2>
          <div className={`flex items-center gap-2 text-sm font-bold transition-colors ${isPositivo ? 'text-[#10b981]' : (hasPortfolios && balance.total !== '0,00 €' ? 'text-red-500' : 'text-[#10b981]')}`}>
            <span>{displayRendimiento}</span>
            <span>({displayBeneficio})</span>
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

      {/* Gráfica Avanzada e Interactiva */}
      <div className="h-64 w-full border-b border-[#2d2d2d] border-dashed pb-2 relative">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 30, right: 0, left: 0, bottom: 0 }}
              onMouseMove={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* XAxis oculto pero necesario para mapear la fecha (date) al Tooltip */}
              <XAxis dataKey="date" hide />
              <YAxis domain={['dataMin', 'dataMax']} hide />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '0' }}
                position={{ y: 0 }} // Fija el tooltip en la parte superior del chart
                isAnimationActive={false}
              />
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositivo ? '#10b981' : '#ef4444'} 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 5, fill: isPositivo ? '#10b981' : '#ef4444', stroke: '#151515', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
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
