import { useState } from 'react';
import { ArrowLeft, Plus, RefreshCw, TrendingUp, MoreVertical } from 'lucide-react';

interface BolsaDetailsProps {
  bolsaDisponible: number;
  bolsaInvertido: number;
  bolsaGanancias: number;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => void;
  onBack: () => void;
}

export const BolsaDetails = ({
  bolsaDisponible,
  bolsaInvertido,
  bolsaGanancias,
  onBack
}: BolsaDetailsProps) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [isUpdating, setIsUpdating] = useState(false);
  const [compareIndex, setCompareIndex] = useState<string | null>(null);

  // El valor de tu cartera suma lo invertido, las ganancias generadas y el efectivo parado
  const totalBolsa = bolsaInvertido + bolsaGanancias + bolsaDisponible;

  // Botón falso de actualizar para el efecto visual
  const handleUpdatePrices = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 800);
  };

  // 🚀 POSICIONES DE EJEMPLO (En el siguiente paso las conectaremos a tu BD)
  const mockPosiciones = [
    { id: 1, ticker: 'S&P 500', name: 'Vanguard S&P 500 UCITS', shares: 2.4, price: 85.20, value: 204.48, changePct: 1.2, changeEur: 2.45, isUp: true },
    { id: 2, ticker: 'AAPL', name: 'Apple Inc.', shares: 1.5, price: 175.50, value: 263.25, changePct: -0.5, changeEur: -1.31, isUp: false },
    { id: 3, ticker: 'MSFT', name: 'Microsoft Corp.', shares: 0.8, price: 380.00, value: 304.00, changePct: 2.1, changeEur: 6.38, isUp: true },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* ======================= CABECERA ======================= */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-2">
          <button 
            onClick={handleUpdatePrices} 
            className={`p-2 text-gray-400 hover:text-white transition-all rounded-lg hover:bg-[#2d2d2d] cursor-pointer ${isUpdating ? 'animate-spin text-amber-500' : ''}`}
            title="Actualizar precios"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => alert('¡Listo para el siguiente paso! Aquí abriremos el buscador de acciones.')} 
            className="p-2 text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-lg cursor-pointer flex items-center justify-center"
            title="Añadir posición"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ======================= BALANCE PRINCIPAL ======================= */}
      <div className="mb-6">
        <h2 className="text-5xl font-black text-white tracking-tight mb-2">
          {totalBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </h2>
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/10 w-max px-3 py-1.5 rounded-lg">
          <TrendingUp size={16} />
          <span>+{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({(totalBolsa > 0 ? (bolsaGanancias / bolsaInvertido) * 100 : 0).toFixed(2)}%)</span>
        </div>
      </div>

      {/* ======================= GRÁFICA Y TIMEFRAMES ======================= */}
      <div className="mb-10">
        
        {/* Gráfica SVG Dinámica con gradiente Trade Republic */}
        <div className="w-full h-56 mb-4 relative">
          <svg viewBox="0 0 400 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradBolsa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Línea comparativa punteada */}
            {compareIndex && (
              <path d="M0 130 Q 100 120, 200 100 T 400 60" fill="none" stroke="#3d3d3d" strokeWidth="2" strokeDasharray="6,4" />
            )}
            {/* Línea de tu cartera real */}
            <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30 L 400 150 L 0 150 Z" fill="url(#gradBolsa)" />
            <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30" fill="none" stroke="#f59e0b" strokeWidth="3" />
          </svg>
        </div>

        {/* Botones de Tiempo */}
        <div className="flex items-center justify-between bg-[#141416] p-1 rounded-xl mb-4 border border-[#2d2d2d]">
          {['1D', '1S', '1M', '6M', '1A', 'MAX'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                timeframe === tf ? 'bg-[#2d2d2d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1c1c1e]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Pestañas de Comparación */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setCompareIndex(compareIndex === 'SP500' ? null : 'SP500')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
              compareIndex === 'SP500' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-[#141416] border-[#2d2d2d] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            vs S&P 500
          </button>
          <button 
            onClick={() => setCompareIndex(compareIndex === 'MSCI' ? null : 'MSCI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
              compareIndex === 'MSCI' ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-[#141416] border-[#2d2d2d] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            vs MSCI World
          </button>
          <button 
            onClick={() => setCompareIndex(compareIndex === 'IBEX' ? null : 'IBEX')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
              compareIndex === 'IBEX' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-[#141416] border-[#2d2d2d] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            vs IBEX 35
          </button>
        </div>
      </div>

      {/* ======================= EFECTIVO ======================= */}
      <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between mb-8 cursor-pointer hover:border-amber-500/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#2d2d2d] flex items-center justify-center text-gray-400 font-bold text-lg">
            €
          </div>
          <div>
            <p className="text-white font-bold text-sm">Efectivo</p>
            <p className="text-xs text-gray-500 mt-0.5">Dinero sin invertir</p>
          </div>
        </div>
        <p className="text-lg font-black text-white">{bolsaDisponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
      </div>

      {/* ======================= POSICIONES ABIERTAS ======================= */}
      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-lg font-bold text-white tracking-tight">Mis Inversiones</h3>
          <span className="text-xs font-bold text-gray-500 bg-[#1c1c1e] px-2.5 py-1 rounded-lg border border-[#2d2d2d]">{mockPosiciones.length} Posiciones</span>
        </div>
        
        <div className="space-y-2.5">
          {mockPosiciones.map((pos) => (
            <div key={pos.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between hover:bg-[#1c1c1e] transition-all cursor-pointer group hover:border-[#3d3d3d]">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#2d2d2d] flex items-center justify-center font-black text-white text-xs border border-[#3d3d3d]">
                  {pos.ticker.substring(0,2)}
                </div>
                <div>
                  <p className="text-white font-bold leading-tight text-sm">{pos.ticker}</p>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[120px] sm:max-w-[200px] mt-0.5">{pos.name}</p>
                  <p className="text-[10px] text-gray-600 mt-1 font-bold">{pos.shares} acciones</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-white font-bold text-sm">{pos.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  <p className={`text-[11px] font-bold mt-1 ${pos.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos.isUp ? '+' : ''}{pos.changeEur.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({pos.isUp ? '+' : ''}{pos.changePct}%)
                  </p>
                </div>
                <MoreVertical size={16} className="text-gray-600 group-hover:text-gray-400 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
