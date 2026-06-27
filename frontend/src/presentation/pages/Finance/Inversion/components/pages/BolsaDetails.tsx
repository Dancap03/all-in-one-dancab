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
  bolsaInvertido,
  bolsaGanancias,
  onBack
}: BolsaDetailsProps) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para el desplegable del comparador
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string>('S&P500');
  const [searchIndex, setSearchIndex] = useState('');

  // 🚀 POSICIONES VACÍAS: Aquí conectaremos tu Firebase luego
  const [posiciones] = useState<any[]>([]);

  // Listado de índices para el buscador
  const allIndices = ['S&P500', 'MSCI World', 'IBEX 35', 'Nasdaq 100', 'DAX 40', 'Euro Stoxx 50', 'Dow Jones'];
  const filteredIndices = allIndices.filter(idx => idx.toLowerCase().includes(searchIndex.toLowerCase()));

  const handleUpdatePrices = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 800);
  };

  // Cálculos matemáticos
  const carteraTotal = bolsaInvertido + bolsaGanancias;
  const rentabilidadPct = bolsaInvertido > 0 ? (bolsaGanancias / bolsaInvertido) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* ======================= CABECERA SUPERIOR ======================= */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-3 items-center">
          <button 
            onClick={handleUpdatePrices} 
            className={`p-2 text-gray-400 hover:text-white transition-all rounded-lg hover:bg-[#2d2d2d] cursor-pointer ${isUpdating ? 'animate-spin text-gray-100' : ''}`}
            title="Actualizar cotizaciones"
          >
            <RefreshCw size={20} />
          </button>
          {/* Botón + estilo Trade Republic (Cuadrado redondeado ámbar) */}
          <button className="w-10 h-10 bg-[#eab308] hover:bg-[#ca8a04] text-black transition-colors rounded-[10px] flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10">
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ======================= BALANCE Y COMPARADOR ======================= */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-400 font-medium text-sm mb-1">Cartera bolsa total</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-1.5">
            {carteraTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h2>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
            <TrendingUp size={16} strokeWidth={2.5} />
            <span>+{rentabilidadPct.toFixed(1)}% · +{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>

        {/* DESPLEGABLE: Comparar con... */}
        <div className="relative text-right">
          <p className="text-gray-500 text-xs font-medium mb-1.5">Comparar con</p>
          <button
            onClick={() => setIsCompareOpen(!isCompareOpen)}
            className="bg-[#1c1c1e] border border-[#2d2d2d] hover:border-[#3d3d3d] rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {selectedCompare}
            <ChevronDown size={14} className="text-gray-500" />
          </button>

          {isCompareOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-20 overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-[#2d2d2d] bg-[#141416]">
                <Search size={14} className="text-gray-500 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar índice..."
                  value={searchIndex}
                  onChange={(e) => setSearchIndex(e.target.value)}
                  className="bg-transparent w-full text-xs outline-none text-white placeholder-gray-600"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {filteredIndices.length > 0 ? (
                  filteredIndices.map(idx => (
                    <button
                      key={idx}
                      onClick={() => { 
                        setSelectedCompare(idx); 
                        setIsCompareOpen(false); 
                        setSearchIndex(''); 
                      }}
                      className="w-full px-3 py-2.5 text-xs text-left text-gray-300 hover:text-white hover:bg-[#2d2d2d] flex justify-between items-center transition-colors cursor-pointer"
                    >
                      {idx}
                      {selectedCompare === idx && <Check size={14} className="text-amber-500" />}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-gray-500">No hay resultados</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================= GRÁFICA (CONDICIONAL) ======================= */}
      {posiciones.length > 0 ? (
        <div className="mb-8">
          <div className="w-full h-48 mb-4 relative">
            <svg viewBox="0 0 400 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradBolsa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Línea comparativa (Índice) */}
              <path d="M0 130 Q 100 120, 200 100 T 400 60" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,4" />
              {/* Línea de tu cartera */}
              <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30 L 400 150 L 0 150 Z" fill="url(#gradBolsa)" />
              <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Selector de periodo (1D, 1S, 1M...) */}
          <div className="flex items-center justify-between border-t border-[#2d2d2d] pt-3 mb-4">
            {['1D', '1S', '1M', '6M', '1A', 'MAX'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === tf ? 'text-white bg-[#2d2d2d]' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1c1c1e]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Leyenda comparativa */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
              <span className="text-xs font-bold text-gray-300">Mi cartera +{rentabilidadPct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
              <span className="text-xs font-bold text-gray-500">{selectedCompare} +11.8%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-[#141416] rounded-2xl border border-dashed border-[#2d2d2d] flex flex-col items-center justify-center text-gray-600 mb-10">
          <TrendingUp size={32} className="mb-3 opacity-30" />
          <p className="font-bold text-sm text-gray-400 mb-1">Gráfica no disponible</p>
          <p className="text-xs text-gray-600">Añade tu primera inversión para generar el historial</p>
        </div>
      )}

      {/* ======================= LISTADO DE POSICIONES ======================= */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Posiciones</h3>
        
        {posiciones.length > 0 ? (
          <div className="space-y-3">
            {posiciones.map((pos) => (
              <div key={pos.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between hover:bg-[#1c1c1e] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center font-bold text-white text-[10px]">
                    {pos.ticker.substring(0,2)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{pos.ticker}</p>
                    <p className="text-xs text-gray-500">{pos.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{pos.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  <p className={`text-[10px] font-bold ${pos.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos.isUp ? '+' : ''}{pos.changeEur.toLocaleString('es-ES')} € ({pos.changePct}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#141416] border border-[#2d2d2d] rounded-2xl">
            <p className="text-gray-500 font-medium text-sm mb-4">Aún no tienes posiciones en tu cartera.</p>
            <button className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer text-sm">
              Buscar un activo
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
