import { useState, useEffect } from 'react';
import { Search, X, Plus, Loader2, TrendingUp } from 'lucide-react';

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

export const AssetSearchModal = ({ isOpen, onClose, onSelectAsset }: AssetSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [results, setResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Si borramos el buscador, vaciamos la lista
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Usamos un "Debounce" de 600ms para no saturar la API mientras escribes rápido
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      
      try {
        // 1. BUSCADOR REAL DE YAHOO FINANCE (Usamos AllOrigins como proxy para evitar bloqueos CORS en el navegador)
        const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchTerm)}&quotesCount=8`;
        const proxySearchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
        
        const searchRes = await fetch(proxySearchUrl);
        const searchDataWrapper = await searchRes.json();
        const searchData = JSON.parse(searchDataWrapper.contents);

        const quotes = searchData.quotes || [];
        if (quotes.length === 0) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        // 2. EXTRAEMOS LOS TICKERS Y AÑADIMOS EL CAMBIO EUR/USD PARA HACER LA CONVERSIÓN
        const symbols = quotes.map((q: any) => q.symbol).join(',');
        const symbolsWithFX = `${symbols},EURUSD=X`; // Pedimos también el tipo de cambio Euro/Dolar actual

        // 3. PEDIMOS LOS PRECIOS REALES DE HOY
        const priceUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsWithFX}`;
        const proxyPriceUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(priceUrl)}`;
        
        const priceRes = await fetch(proxyPriceUrl);
        const priceDataWrapper = await priceRes.json();
        const priceData = JSON.parse(priceDataWrapper.contents);
        const priceResult = priceData.quoteResponse?.result || [];

        // 4. CONVERSIÓN DE DIVISAS A EUROS (€)
        const eurUsdQuote = priceResult.find((q: any) => q.symbol === 'EURUSD=X');
        const eurToUsdRate = eurUsdQuote?.regularMarketPrice || 1.08; 
        const usdToEurRate = 1 / eurToUsdRate;

        // 5. MAPEO Y LIMPIEZA DE DATOS
        const mappedAssets: Asset[] = priceResult
          .filter((item: any) => item.symbol !== 'EURUSD=X') // Quitamos el conversor de la lista visual
          .map((item: any) => {
            // Asignar categoría visual
            let tipo: Asset['type'] = 'Acciones';
            if (item.quoteType === 'ETF' || item.quoteType === 'MUTUALFUND') tipo = 'ETF';
            else if (item.quoteType === 'CRYPTOCURRENCY') tipo = 'Cripto';
            else if (item.quoteType === 'CURRENCY' || item.quoteType === 'GOVERNMENT_BOND') tipo = 'Bonos';

            // Convertir a Euros si está en Dólares
            let priceInEur = item.regularMarketPrice || 0;
            if (item.currency === 'USD') {
              priceInEur = priceInEur * usdToEurRate;
            } else if (item.currency === 'GBP') {
              priceInEur = priceInEur * 1.17; // Conversión base aproximada para Libras
            } // Si ya es EUR, se queda igual

            return {
              id: item.symbol,
              ticker: item.symbol,
              name: item.longName || item.shortName || item.symbol,
              type: tipo,
              price: priceInEur
            };
          });

        setResults(mappedAssets);
      } catch (error) {
        console.error("Error consultando la API del mercado:", error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  if (!isOpen) return null;

  // Filtrado final por categoría (Pestañas)
  const filteredAssets = results.filter(asset => {
    return activeCategory === 'Todos' || asset.type === activeCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-[#141416] w-full sm:max-w-md h-[90vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl flex flex-col border border-[#2d2d2d] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-amber-500" /> Mercado Global
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-xl transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="p-4 bg-[#141416]">
          <div className="relative flex items-center w-full">
            <Search size={18} className="absolute left-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Ej: Tesla, Bitcoin, Vanguard S&P 500..." 
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

        {/* PESTAÑAS (CATEGORÍAS) */}
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

        {/* LISTADO DE RESULTADOS REALES */}
        <div className="flex-1 overflow-y-auto">
          {!hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 px-6 text-center opacity-60">
              <Search size={32} className="mb-2" />
              <p className="text-sm font-bold text-gray-400">Busca cualquier activo mundial</p>
              <p className="text-xs">Escribe el nombre de la empresa, el ticker o la criptomoneda. Se cotizará en Euros (€).</p>
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
                      <p className="text-white font-bold text-sm">{asset.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
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
              <p className="text-xs">Prueba con otro nombre, ticker oficial o revisa la pestaña de arriba.</p>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};
