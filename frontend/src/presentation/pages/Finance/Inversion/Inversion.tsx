import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');

  // Datos de balance global simulados
  const balance = {
    total: '120.31 €',
    rendimiento: '+9.56%',
    beneficio: '+10.50 €',
    positivo: true
  };

  // Datos simulados para la gráfica
  const chartData = [
    { date: '1 ene', value: 100 }, { date: '15 ene', value: 101 },
    { date: '1 feb', value: 100.5 }, { date: '15 feb', value: 102 },
    { date: '1 mar', value: 101 }, { date: '15 mar', value: 103 },
    { date: '1 abr', value: 102.5 }, { date: '15 abr', value: 104 },
    { date: '1 may', value: 105 }, { date: '7 may', value: 106 },
    { date: '15 may', value: 120.31 }
  ];

  // Posiciones adaptadas a ETFs y Criptoactivos
  const posiciones = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b' },
    { id: 'ETH', name: 'Ethereum', ticker: 'ETH-EUR', compra: 2900.50, actual: 15.40, total: 3105.20, plPerc: '+4.50%', plVal: '+0.69', pos: true, color: '#6366f1' },
    { id: 'SOL', name: 'Solana', ticker: 'SOL-EUR', compra: 120.30, actual: 25.00, total: 145.80, plPerc: '+21.19%', plVal: '+5.30', pos: true, color: '#a855f7' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444' },
    { id: 'WD', name: 'iShares Core MSCI World', ticker: 'IWDA.AS', compra: 85.20, actual: 86.10, total: 86.10, plPerc: '+1.05%', plVal: '+0.90', pos: true, color: '#3b82f6' },
    { id: 'NDX', name: 'Invesco EQQQ Nasdaq-100', ticker: 'EQQQ.MI', compra: 340.10, actual: 325.40, total: 325.40, plPerc: '-4.32%', plVal: '-14.70', pos: false, color: '#10b981' }
  ];

  return (
    <div className="w-full">
      {/* Cabecera general */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Cartera de inversiones</h1>
        <p className="text-gray-400 text-sm">Mis inversiones · Yahoo Finance en tiempo real</p>
      </div>

      {/* Sección Superior: Balance y Gráfica */}
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
          {['1D', '1W', '1M', 'YTD', '1Y', 'Max'].map((period) => (
            <button 
              key={period} 
              onClick={() => setActiveTimeframe(period)}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTimeframe === period ? 'bg-[#252525] text-white' : 'hover:text-white hover:bg-[#1a1a1a]'}`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Gráfica con Recharts */}
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

      {/* Navegación Interna (Pestañas) */}
      <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mb-6 px-2">
        {['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition-colors ${activeTab === tab ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
        <button 
          onClick={() => setActiveTab('IA')}
          className={`pb-3 transition-colors flex items-center gap-2 ${activeTab === 'IA' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span>AllInOne IA</span>
          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Beta</span>
        </button>
      </div>

      {/* Tabla de Posiciones */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl overflow-hidden shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-[#2d2d2d]">
          <h3 className="font-bold text-white">Posiciones</h3>
          <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm px-4 py-2 rounded-lg border border-[#2d2d2d] transition-colors">
            + Agregar transacción
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1a1a1a] text-gray-400 text-xs">
              <tr>
                <th className="px-6 py-4 font-normal cursor-pointer hover:text-white">Título ↑</th>
                <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">Compra ↑</th>
                <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">Posición ↓</th>
                <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">P/L ↕</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {posiciones.map((item, index) => (
                <tr key={index} className="hover:bg-[#1a1a1a] transition-colors group cursor-pointer">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-inner" style={{ backgroundColor: item.color }}>
                      {item.id}
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-gray-500 text-xs">{item.ticker}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {item.compra.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-white font-medium">{item.actual.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                    <div className="text-gray-500 text-xs">{item.total.toLocaleString('es-ES')} EUR</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-medium ${item.pos ? 'text-[#10b981]' : 'text-red-500'}`}>
                      {item.plVal} €
                    </div>
                    <div className={`text-xs mt-0.5 ${item.pos ? 'text-[#10b981]' : 'text-red-500'}`}>
                      {item.pos ? '↑' : '↓'} {item.plPerc}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
