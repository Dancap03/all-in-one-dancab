import { useState } from 'react';
import { ArrowLeft, RefreshCw, Plus, TrendingUp, Search, ChevronDown, Check } from 'lucide-react';

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
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string | null>(null);

  // 🚀 TUS POSICIONES REALES (Aquí irán tus datos de Firebase)
  const [posiciones] = useState([
    { id: 1, ticker: 'S&P 500', name: 'Vanguard S&P 500 UCITS', shares: 2.4, value: 204.48, changePct: 1.2, changeEur: 2.45, isUp: true },
    { id: 2, ticker: 'AAPL', name: 'Apple Inc.', shares: 1.5, value: 263.25, changePct: -0.5, changeEur: -1.31, isUp: false },
    { id: 3, ticker: 'MSFT', name: 'Microsoft Corp.', shares: 0.8, value: 304.00, changePct: 2.1, changeEur: 6.38, isUp: true },
  ]);

  const handleUpdatePrices = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 800);
  };

  const indices = ['S&P 500', 'MSCI World', 'IBEX 35', 'Nasdaq 100', 'DAX 40'];

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* ======================= CABECERA ======================= */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-2">
          <button onClick={handleUpdatePrices} className={`p-2 text-gray-400 hover:text-white transition-all rounded-lg hover:bg-[#2d2d2d] cursor-pointer ${isUpdating ? 'animate-spin text-amber-500' : ''}`}>
            <RefreshCw size={20} />
          </button>
          <button className="p-2 text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-lg cursor-pointer">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ======================= BALANCE ======================= */}
      <div className="mb-8">
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">
          {(bolsaInvertido + bolsaGanancias).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </h2>
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <TrendingUp size={16} />
          <span>+{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({(bolsaInvertido > 0 ? (bolsaGanancias / bolsaInvertido) * 100 : 0).toFixed(2)}%)</span>
        </div>
      </div>

      {/* ======================= GRÁFICA CONDICIONAL ======================= */}
      {posiciones.length > 0 ? (
        <div className="mb-8">
          <div className="w-full h-56 mb-4 relative">
             {/* Tu SVG de gráfica aquí */}
             <svg viewBox="0 0 400 150" className="w-full h-full"><path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30" fill="none" stroke="#f59e0b" strokeWidth="3" /></svg>
          </div>

          <div className="flex items-center justify-between bg-[#141416] p-1 rounded-xl mb-4 border border-[#2d2d2d]">
            {['1D', '1S', '1M', '6M', '1A', 'MAX'].map((tf) => (
              <button key={tf} onClick={() => setTimeframe(tf)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${timeframe === tf ? 'bg-[#2d2d2d] text-white' : 'text-gray-500'}`}>
                {tf}
              </button>
            ))}
          </div>

          {/* Desplegable de índices */}
          <div className="relative">
            <button onClick={() => setIsCompareOpen(!isCompareOpen)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-xl px-4 py-3 flex justify-between items-center text-sm font-bold text-gray-400 hover:text-white transition-colors">
              <span>{selectedCompare ? `vs ${selectedCompare}` : 'Comparar con...'}</span>
              <ChevronDown size={16} />
            </button>
            {isCompareOpen && (
              <div className="absolute w-full mt-2 bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-10 p-2">
                <div className="flex items-center px-3 py-2 border-b border-[#2d2d2d] mb-1 text-gray-500">
                  <Search size={14} className="mr-2" />
                  <input type="text" placeholder="Buscar índice..." className="bg-transparent w-full text-xs outline-none text-white" />
                </div>
                {indices.map(idx => (
                  <button key={idx} onClick={() => { setSelectedCompare(idx); setIsCompareOpen(false); }} className="w-full px-3 py-2.5 text-xs text-left text-white hover:bg-[#2d2d2d] rounded-lg flex justify-between items-center">
                    {idx}
                    {selectedCompare === idx && <Check size={14} className="text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-[#141416] rounded-2xl border border-dashed border-[#2d2d2d] flex flex-col items-center justify-center text-gray-600 mb-8">
            <TrendingUp size={32} className="mb-2 opacity-50" />
            <p className="font-bold text-xs">Sin datos de inversión</p>
        </div>
      )}

      {/* ======================= POSICIONES ======================= */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Mis Inversiones</h3>
        <div className="space-y-3">
          {posiciones.map((pos) => (
            <div key={pos.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between hover:bg-[#1c1c1e] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center font-bold text-white text-[10px]">{pos.ticker.substring(0,2)}</div>
                <div>
                  <p className="text-white font-bold text-sm">{pos.ticker}</p>
                  <p className="text-xs text-gray-500">{pos.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">{pos.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                <p className={`text-[10px] font-bold ${pos.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pos.isUp ? '+' : ''}{pos.changeEur} € ({pos.changePct}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
