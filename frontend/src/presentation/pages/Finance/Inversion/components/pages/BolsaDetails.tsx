import { useState } from 'react';
import { ArrowLeft, RefreshCw, Plus, TrendingUp, Search, ChevronDown, Check, X } from 'lucide-react';
import { AssetSearchModal, Asset } from '../modals/AssetSearchModal';

interface Position {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgPriceEur: number;
  currentPrice: number;
  value: number;
  changePct: number;
  changeEur: number;
  isUp: boolean;
}

interface BolsaDetailsProps {
  disponibleGlobal: number; 
  bolsaInvertido: number;
  bolsaGanancias: number;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => Promise<void> | any;
  onBack: () => void;
}

const fetchWithFallback = async (targetUrl: string) => {
  const proxies = [
    { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, wrapped: true },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, wrapped: false }
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy.url);
      if (!res.ok) continue;
      
      const data = await res.json();
      if (proxy.wrapped && data.contents) return JSON.parse(data.contents);
      if (!proxy.wrapped) return data;
    } catch (e) {
      console.warn(`Proxy falló: ${proxy.url}`);
    }
  }
  throw new Error("No se pudo conectar a los servidores del mercado.");
};

export const BolsaDetails = ({ 
  disponibleGlobal,
  bolsaInvertido,
  bolsaGanancias,
  onEjecutarBolsa,
  onBack 
}: BolsaDetailsProps) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string>('S&P500');
  const [searchIndex, setSearchIndex] = useState('');

  const [posiciones, setPosiciones] = useState<Position[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [assetToAdd, setAssetToAdd] = useState<Asset | null>(null);
  
  const [addShares, setAddShares] = useState('');
  const [addPrice, setAddPrice] = useState('');

  const allIndices = ['S&P500', 'MSCI World', 'IBEX 35', 'Nasdaq 100', 'DAX 40', 'Euro Stoxx 50', 'Dow Jones'];
  const filteredIndices = allIndices.filter(idx => idx.toLowerCase().includes(searchIndex.toLowerCase()));

  const handleSelectAsset = (asset: Asset) => {
    setIsSearchOpen(false);
    setAssetToAdd(asset);
    setAddPrice(asset.price.toFixed(2));
  };

  const handleConfirmAdd = () => {
    if (!assetToAdd) return;
    const shares = Number(addShares);
    const avgPrice = Number(addPrice);
    
    if (shares <= 0 || avgPrice <= 0) {
      alert('Por favor, introduce un número de acciones y un precio válidos.');
      return;
    }

    const invested = shares * avgPrice;

    if (invested > disponibleGlobal) {
      alert(`Saldo insuficiente. Intentas invertir ${invested.toLocaleString('es-ES')} € pero solo dispones de ${disponibleGlobal.toLocaleString('es-ES')} €.`);
      return;
    }

    const currentValue = shares * assetToAdd.price;
    const changeEur = currentValue - invested;

    const newPos: Position = {
      id: Date.now().toString(),
      ticker: assetToAdd.ticker,
      name: assetToAdd.name,
      shares,
      avgPriceEur: avgPrice,
      currentPrice: assetToAdd.price,
      value: currentValue,
      changePct: invested > 0 ? (changeEur / invested) * 100 : 0,
      changeEur,
      isUp: changeEur >= 0
    };

    onEjecutarBolsa(invested, 'propio');

    setPosiciones([...posiciones, newPos]);
    setAssetToAdd(null);
    setAddShares('');
    setAddPrice('');
  };

  const handleUpdatePrices = async () => {
    if (posiciones.length === 0) return;
    setIsUpdating(true);
    
    try {
      const symbols: string[] = posiciones.map(p => p.ticker);
      symbols.push('EURUSD=X');

      // 🚀 AQUÍ TAMBIÉN LA CORRECCIÓN: (sym: string)
      const chartPromises = symbols.map(async (sym: string) => {
         const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
         try {
           const data = await fetchWithFallback(chartUrl);
           return data?.chart?.result?.[0]?.meta;
         } catch (e) {
           return null;
         }
      });

      const metas = await Promise.all(chartPromises);
      const validMetas = metas.filter(Boolean);

      const eurUsdMeta = validMetas.find(m => m.symbol === 'EURUSD=X');
      const eurToUsdRate = eurUsdMeta?.regularMarketPrice || 1.08; 
      const usdToEurRate = 1 / eurToUsdRate;

      const updatedPosiciones = posiciones.map(pos => {
        const m = validMetas.find(meta => meta.symbol === pos.ticker);
        if (!m) return pos;

        let currentPriceEur = m.regularMarketPrice || pos.currentPrice;
        if (m.currency === 'USD') currentPriceEur *= usdToEurRate;
        else if (m.currency === 'GBP') currentPriceEur *= 1.17; 

        const value = pos.shares * currentPriceEur;
        const invested = pos.shares * pos.avgPriceEur;
        const changeEur = value - invested;
        const changePct = invested > 0 ? (changeEur / invested) * 100 : 0;

        return {
          ...pos,
          currentPrice: currentPriceEur,
          value,
          changeEur,
          changePct,
          isUp: changeEur >= 0
        };
      });

      setPosiciones(updatedPosiciones);
    } catch (error) {
      console.error("Error actualizando precios de mercado:", error);
      alert("Hubo un problema de conexión con el mercado. Inténtalo de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const totalInvertidoCartera = posiciones.reduce((sum, pos) => sum + (pos.shares * pos.avgPriceEur), 0);
  const carteraTotal = posiciones.reduce((sum, pos) => sum + pos.value, 0);
  const gananciasTotales = carteraTotal - totalInvertidoCartera;
  const rentabilidadPct = totalInvertidoCartera > 0 ? (gananciasTotales / totalInvertidoCartera) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in duration-300 relative">
      
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-3 items-center">
          <button 
            onClick={handleUpdatePrices} 
            disabled={isUpdating || posiciones.length === 0}
            className={`p-2 transition-all rounded-lg cursor-pointer ${
              posiciones.length === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
            } ${isUpdating ? 'animate-spin text-amber-500' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 bg-[#eab308] hover:bg-[#ca8a04] text-black transition-colors rounded-[10px] flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-400 font-medium text-sm mb-1">Cartera bolsa total</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-1.5">
            {posiciones.length > 0 
              ? `${carteraTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
              : `${(bolsaInvertido + bolsaGanancias).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
            }
          </h2>
          <div className={`flex items-center gap-1.5 font-bold text-sm ${gananciasTotales >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <TrendingUp size={16} strokeWidth={2.5} className={gananciasTotales < 0 ? 'transform rotate-180' : ''} />
            <span>
              {posiciones.length > 0 
                ? `${gananciasTotales >= 0 ? '+' : ''}${rentabilidadPct.toFixed(1)}% · ${gananciasTotales >= 0 ? '+' : ''}${gananciasTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
                : `+0.0% · 0,00 €`
              }
            </span>
          </div>
        </div>

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
                      onClick={() => { setSelectedCompare(idx); setIsCompareOpen(false); setSearchIndex(''); }}
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
              <path d="M0 130 Q 100 120, 200 100 T 400 60" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30 L 400 150 L 0 150 Z" fill="url(#gradBolsa)" />
              <path d="M0 110 Q 50 100, 100 120 T 200 90 T 300 70 T 400 30" fill="none" stroke={gananciasTotales >= 0 ? "#f59e0b" : "#f43f5e"} strokeWidth="2.5" />
            </svg>
          </div>

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

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${gananciasTotales >= 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
              <span className="text-xs font-bold text-gray-300">Mi cartera {gananciasTotales >= 0 ? '+' : ''}{rentabilidadPct.toFixed(1)}%</span>
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

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Posiciones</h3>
        
        {posiciones.length > 0 ? (
          <div className="space-y-3">
            {posiciones.map((pos) => (
              <div key={pos.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between hover:bg-[#1c1c1e] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center font-bold text-white text-[10px] border border-[#3d3d3d]">
                    {pos.ticker.substring(0,2)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{pos.ticker}</p>
                    <p className="text-xs text-gray-500">{pos.name}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{pos.shares} acciones</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{pos.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${pos.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos.isUp ? '+' : ''}{pos.changeEur.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({pos.isUp ? '+' : ''}{pos.changePct.toFixed(2)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#141416] border border-[#2d2d2d] rounded-2xl">
            <p className="text-gray-500 font-medium text-sm mb-4">Aún no tienes posiciones en tu cartera.</p>
            <button onClick={() => setIsSearchOpen(true)} className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer text-sm">
              Buscar un activo
            </button>
          </div>
        )}
      </div>

      <AssetSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectAsset={handleSelectAsset} 
      />

      {assetToAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Añadir Posición</h3>
                <p className="text-xs text-gray-500 mt-0.5">{assetToAdd.name} ({assetToAdd.ticker})</p>
              </div>
              <button onClick={() => setAssetToAdd(null)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-[#2d2d2d] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Efectivo disponible:</span>
                <span className="text-sm font-black text-emerald-400">{disponibleGlobal.toLocaleString('es-ES')} €</span>
              </div>

              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-[#2d2d2d] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Precio actual (aprox):</span>
                <span className="text-sm font-black text-amber-500">{assetToAdd.price.toLocaleString('es-ES')} €</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nº de acciones / monedas</label>
                <input 
                  type="number" 
                  placeholder="Ej: 10" 
                  value={addShares} 
                  onChange={(e) => setAddShares(e.target.value)} 
                  className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-amber-500 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de compra (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ej: 150.25" 
                  value={addPrice} 
                  onChange={(e) => setAddPrice(e.target.value)} 
                  className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-amber-500 transition-colors" 
                />
              </div>

              <button 
                onClick={handleConfirmAdd} 
                className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-2"
              >
                Comprar / Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
