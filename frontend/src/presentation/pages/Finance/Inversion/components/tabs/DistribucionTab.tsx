import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight, Info } from 'lucide-react';

interface DistribucionTabProps {
  currentPositions: any[];
}

// Paleta de azules elegantes estilo "getquin"
const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#818cf8', '#6366f1', '#93c5fd'];

export const DistribucionTab = ({ currentPositions }: DistribucionTabProps) => {
  const totalValue = currentPositions.reduce((sum, p) => sum + p.actual, 0);

  // Mapeamos las posiciones para calcular su porcentaje y asignarles un color
  const data = currentPositions
    .map((pos, index) => ({
      name: pos.name,
      value: pos.actual,
      percent: totalValue > 0 ? (pos.actual / totalValue) * 100 : 0,
      plPerc: pos.plPerc,
      pos: pos.pos,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value); // Ordenamos de mayor a menor

  // 1. Añadidas todas las pestañas exactas
  const subTabs = ['Tipo', 'Posiciones', 'DeepDive', 'Regiones', 'Sectores', 'Industrias', 'Activos', 'Países', 'Divisas'];

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col">
      
      {/* Estilo inyectado para ocultar la scrollbar nativa pero permitir el scroll horizontal fluido */}
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* 2. Menú arreglado: Sin "Asset classes", con scroll horizontal fluido y sin aplastarse */}
      <div className="flex items-center gap-6 border-b border-[#2d2d2d] pb-3 mb-8 overflow-x-auto hide-scrollbar w-full">
        {subTabs.map((tab, i) => (
          <button 
            key={tab} 
            className={`whitespace-nowrap transition-colors text-sm ${i === 0 ? 'text-white font-bold border-b-2 border-white pb-3 -mb-[14px]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
          
          {/* COLUMNA IZQUIERDA: Gráfico de Donut */}
          <div className="relative flex flex-col items-center justify-center min-h-[300px]">
            <button className="absolute top-0 right-0 text-gray-500 hover:text-white transition-colors">
              <Info size={16} />
            </button>
            
            <div className="w-full h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data} 
                    innerRadius={95} 
                    outerRadius={140} 
                    dataKey="value" 
                    stroke="none"
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#2d2d2d', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(val: number) => `${val.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Texto Central del Gráfico */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-gray-400 text-xs mb-1">Tipo</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  {totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                <span className="text-[9px] text-gray-500 font-bold tracking-widest mt-2 uppercase">
                  Gráfico por AllInOne
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Lista de barras de progreso */}
          <div className="flex flex-col border-l border-[#2d2d2d] pl-8">
            <h3 className="text-center font-bold text-white mb-8">Tipo</h3>
            
            <div className="flex flex-col gap-6">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-end leading-none">
                      <span className="text-white font-bold text-sm">{item.name}</span>
                      <span className="text-white font-bold text-sm">{item.percent.toFixed(2)} %</span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-4">
                      {/* Barra de progreso */}
                      <div className="h-1.5 flex-1 bg-[#2d2d2d] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.percent}%`, backgroundColor: item.color }}></div>
                      </div>
                      {/* Porcentaje P/L */}
                      <span className={`text-xs font-bold shrink-0 ${item.pos ? 'text-[#10b981]' : 'text-red-500'}`}>
                        {item.pos ? '↗' : '↘'} {item.plPerc.replace('+', '').replace('-', '')}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 italic text-sm">
          <div className="w-12 h-12 rounded-full border border-[#2d2d2d] flex items-center justify-center text-xl mb-3">📊</div>
          No hay posiciones para calcular la distribución.
        </div>
      )}
    </div>
  );
};
