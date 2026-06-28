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

// 🚀 OBTENEDOR DE PRECIOS A PRUEBA DE FALLOS
const fetchPriceWithFallback = async (ticker: string) => {
  // Ajuste para criptomonedas (Ej: BTCUSD -> BTC-USD para que Yahoo lo entienda)
  let formattedTicker = ticker;
  if (ticker.endsWith('USD') && ticker.length > 3 && !ticker.includes('-')) {
    formattedTicker = ticker.replace('USD', '-USD');
  }

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1d&range=1d`;
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) continue;
      const text = await res.text();
      // Verificamos que no sea la página HTML de bloqueo de Yahoo
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) continue;
      
      const data = JSON.parse(text);
      if (data?.chart?.result?.[0]?.meta) {
        return data.chart.result[0].meta;
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error("No se pudo obtener el precio en vivo");
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
        // 1. BUSCADOR NATIVO DE TRADINGVIEW (100% Libre de CORS y bloqueos)
        const searchUrl = `https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(searchTerm)}&hl=1&exchange=&lang=en&search_type=undefined&domain=production`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        const validTypes = ['stock', 'crypto', 'fund', 'dr'];
        const assets = searchData.filter((a: any) => validTypes.includes(a.type)).slice(0, 6);

        if (assets.length === 0) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        // 2. CONVERSOR DE DIVISAS (API pública del Banco Central Europeo, sin bloqueos)
        let usdToEurRate = 0.92; // Tasa por defecto de emergencia
        try {
          const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
          if (fxRes.ok) {
            const fxData = await fxRes.json();
            usdToEurRate = fxData.rates.EUR;
          }
        } catch(e) {
          console.warn("Conversor de divisa secundario activado.");
        }

        // 3. MAPEO Y EXTRACCIÓN DE PRECIOS
        const mappedAssets = await Promise.all(assets.map(async (a: any) => {
          let tipo: Asset['type'] = 'Acciones';
          if (a.type === 'crypto') tipo = 'Cripto';
          else if (a.type === 'fund') tipo = 'ETF';

          let priceInEur = 0;
          try {
            const meta = await fetchPriceWithFallback(a.symbol);
            const rawPrice = meta.regularMarketPrice || 0;
            const currency = meta.currency || 'USD';
            
            if (currency === 'USD') priceInEur = rawPrice * usdToEurRate;
            else if (currency === 'GBP') priceInEur = rawPrice * 1.17; 
            else priceInEur = rawPrice; // Asumimos Euros
          } catch (e) {
            // Si el precio falla, permitimos que la acción se muestre con valor 0 para no bloquear al usuario
            priceInEur = 0; 
          }

          return {
            id: a.symbol,
            ticker: a.symbol,
            name: a.description || a.symbol,
            type: tipo,
            price: priceInEur
          };
        }));

        setResults(mappedAssets);
      } catch (error: any) {
        console.error(error);
        setErrorMsg("Los servidores del mercado no responden en este momento.");
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
              placeholder="Buscar acción, cripto o ETF..." 
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
              <p className="text-xs">Usa el buscador para localizar acciones de todo el mundo. Los precios se convertirán a Euros (€).</p>
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
                      <p className="text-white font-bold text-sm">
                        {asset.price > 0 ? `${asset.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '---'}
                      </p>
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
