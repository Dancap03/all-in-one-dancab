import { useState, useEffect } from 'react';
import { Search, X, Plus, Loader2, TrendingUp, AlertCircle } from 'lucide-react';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: 'Acciones' | 'ETF' | 'Cripto' | 'Bonos';
  price: number;
}

interface AssetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

const CATEGORIES = ['Todos', 'Acciones', 'ETF', 'Cripto', 'Bonos'];

// 🚀 CONEXIÓN DIRECTA: Sin intermediarios que se saturen
const fetchDirectly = async (url: string) => {
  try {
    // 1. Intento directo (Funciona perfecto desde localhost la mayoría de las veces)
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {}

  // 2. Proxies de respaldo SOLO si la directa falla
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  ];

  for (const p of proxies) {
    try {
      const res = await fetch(p);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error("No se pudo conectar");
};

export const AssetSearchModal = ({ isOpen, onClose, onSelectAsset }: AssetSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [results, setResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      setErrorMsg('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      setErrorMsg('');
      
      try {
        // 1. Buscador Directo
        const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchTerm)}&quotesCount=6`;
        const searchData = await fetchDirectly(searchUrl);
        const quotes = searchData.quotes || [];
        
        if (quotes.length === 0) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        const symbols = quotes.map((q: any) => q.symbol);
        symbols.push('EURUSD=X'); 

        // 2. Precios en Vivo (Ruta super rápida de Yahoo)
        let priceMap = new Map();
        let usdToEurRate = 0.92;

        try {
          const priceUrl = `https://query2.finance.yahoo.com/v8/finance/spark?symbols=${symbols.join(',')}`;
          const priceData = await fetchDirectly(priceUrl);
          
          if (priceData?.spark?.result) {
            priceData.spark.result.forEach((res: any) => {
              const meta = res.response?.[0]?.meta;
              if (meta) {
                priceMap.set(res.symbol, meta);
                if (res.symbol === 'EURUSD=X') {
                  usdToEurRate = 1 / (meta.regularMarketPrice || 1.08);
                }
              }
            });
          }
        } catch (e) {
          console.warn("Fallo al obtener precios exactos, se mostrarán en N/D");
        }

        // 3. Unir datos
        const mappedAssets: Asset[] = quotes.map((q: any) => {
          let tipo: Asset['type'] = 'Acciones';
          if (q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND') tipo = 'ETF';
          else if (q.quoteType === 'CRYPTOCURRENCY') tipo = 'Cripto';
          else if (q.quoteType === 'CURRENCY') tipo = 'Bonos';

          const meta = priceMap.get(q.symbol);
          let priceInEur = 0; 

          if (meta) {
            const rawPrice = meta.regularMarketPrice || 0;
            const currency = meta.currency || 'USD';
            if (currency === 'USD') priceInEur = rawPrice * usdToEurRate;
            else if (currency === 'GBP') priceInEur = rawPrice * 1.17; 
            else priceInEur = rawPrice;
          }

          return {
            id: q.symbol,
            ticker: q.symbol,
            name: q.longname || q.shortname || q.symbol,
            type: tipo,
            price: priceInEur
          };
        });

        setResults(mappedAssets);
      } catch (error: any) {
        console.error(error);
        setErrorMsg("Error al conectar con el mercado. Inténtalo de nuevo.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 600); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  if (!isOpen) return null;

  const filteredAssets = results.filter(asset => {
    return activeCategory === 'Todos' || asset.type === activeCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#141416] w-full sm:max-w-md h-[90vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl flex flex-col border border-[#2d2d2d] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
        
        <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-amber-500" /> Mercado Global
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-[#141416]">
          <div className="relative flex items-center w-full">
            <Search size={18} className="absolute left-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Ej: Tesla, Intel, Bitcoin..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2d2d2d] focus:border-amber-500 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white outline-none transition-colors placeholder-gray-500 font-medium"
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-4">
                <Loader2 size={18} className="text-amber-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#2d2d2d]">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === category 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                  : 'bg-[#1c1c1e] text-gray-400 border border-[#2d2d2d] hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 px-6 text-center">
              <AlertCircle size={32} className="opacity-50 text-amber-500 mb-2" />
              <p className="text-sm font-bold text-gray-300">Aviso del sistema</p>
              <p className="text-xs">{errorMsg}</p>
            </div>
          ) : !hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 px-6 text-center opacity-60">
              <Search size={32} className="mb-2" />
              <p className="text-sm font-bold text-gray-400">Encuentra cualquier activo</p>
              <p className="text-xs">Usa el buscador para localizar acciones de todo el mundo.</p>
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="divide-y divide-[#2d2d2d]/50 pb-6">
              {filteredAssets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => onSelectAsset(asset)}
                  className="flex items-center justify-between p-4 hover:bg-[#1c1c1e] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#2d2d2d] flex items-center justify-center font-black text-white text-[10px] border border-[#3d3d3d]">
                      {asset.ticker.substring(0,2)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white font-bold text-sm truncate">{asset.ticker}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[200px]">{asset.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {asset.price > 0 ? (
                        <p className="text-white font-bold text-sm">{asset.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                      ) : (
                        <p className="text-amber-500 font-bold text-sm">N/D</p>
                      )}
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{asset.type}</p>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 px-6 text-center">
              <X size={32} className="opacity-30 mb-2 text-rose-500" />
              <p className="text-sm font-bold text-gray-400">No hemos encontrado "{searchTerm}"</p>
              <p className="text-xs">Comprueba la ortografía del ticker o de la empresa.</p>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};
