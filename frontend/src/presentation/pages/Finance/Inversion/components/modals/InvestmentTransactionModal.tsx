import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { aiFinanceService } from '../../../../../../infrastructure/services/AiFinanceService';

interface Portfolio { id: string; nombre: string; }

interface InvestmentTransactionModalProps {
  isOpen: boolean; onClose: () => void; portfolios: Portfolio[];
  activePortfolioId: string; currentPositions: any[]; onSave: (data: any) => void;
}

export const InvestmentTransactionModal = ({ 
  isOpen, onClose, portfolios, activePortfolioId, currentPositions, onSave 
}: InvestmentTransactionModalProps) => {
  const [portfolioId, setPortfolioId] = useState('');
  const [type, setType] = useState('Comprar');
  
  // Búsqueda y Autocompletado
  const [asset, setAsset] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [cantidadInvertida, setCantidadInvertida] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [nota, setNota] = useState('');

  // Ref para cerrar el dropdown si haces click fuera
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPortfolioId(activePortfolioId === 'aggregated' ? (portfolios[0]?.id || '') : activePortfolioId);
      setType('Comprar'); setAsset(''); setCantidadInvertida(''); setPrice(''); setNota('');
      setDate(new Date().toISOString().split('T')[0]); setIsCurrencyOpen(false);
      setSearchResults([]); setShowDropdown(false);
    }
  }, [isOpen, activePortfolioId, portfolios]);

  if (!isOpen) return null;

  // Llama a la IA para buscar la lista de activos
  const handleSearchClick = async () => {
    if (!asset.trim()) return;
    setIsSearching(true);
    setShowDropdown(false);
    try {
      const results = await aiFinanceService.searchAssetList(asset);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error(error);
      alert("Error de conexión. Revisa tu API Key de Gemini en GitHub Secrets.");
    } finally {
      setIsSearching(false);
    }
  };

  // Cuando el usuario elige un activo de la lista desplegable
  const handleSelectAsset = (item: any) => {
    setAsset(`${item.name} (${item.ticker})`);
    setPrice(item.price.toString());
    setCurrency(item.currency || 'EUR');
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (!asset || !cantidadInvertida || !price) return;
    const shares = Number(cantidadInvertida) / Number(price);
    onSave({
      portfolioId, type, asset, cantidadInvertida: Number(cantidadInvertida),
      price: Number(price), shares, currency, date, nota
    });
    onClose();
  };

  const importeTotal = Number(cantidadInvertida) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-[#2d2d2d]">
          <h2 className="text-xl font-bold text-white">Agregar transacción</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-5">
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Cartera</label>
            <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none">
              {portfolios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none">
              <option value="Comprar">Comprar</option>
              <option value="Vender">Vender</option>
            </select>
          </div>

          {/* EL NUEVO BUSCADOR CON DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Buscar activo en mercado</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Ej: Intel, BTC, Vanguard..." 
                  value={asset} 
                  onChange={(e) => setAsset(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                  className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#10b981] rounded-lg pl-11 pr-4 py-3 text-sm text-white outline-none transition-colors" 
                />
              </div>
              <button 
                onClick={handleSearchClick} 
                disabled={isSearching || !asset} 
                className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white px-5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 border border-[#3d3d3d]"
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* LA LISTA DESPLEGABLE TIPO BROKER */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden">
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectAsset(item)} 
                    className="flex items-center justify-between p-3 hover:bg-[#252525] cursor-pointer border-b border-[#2d2d2d] last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[#2d2d2d] flex items-center justify-center text-xs font-bold text-gray-300">
                        {item.ticker.substring(0, 3)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{item.ticker}</span>
                        <span className="text-xs text-gray-500">{item.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#10b981] text-sm">{item.price} €</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Cantidad invertida</label>
            <input type="number" placeholder="Ejemplo: 50.00" value={cantidadInvertida} onChange={(e) => setCantidadInvertida(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha de la inversión</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none" style={{ colorScheme: 'dark' }} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Precio de compra (por unidad)</label>
            <div className="relative flex items-center">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg pl-4 pr-16 py-3 text-sm text-white outline-none" />
              <div className="absolute right-2">
                <button onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} className="flex items-center gap-1.5 text-sm font-bold text-white px-3 py-1.5 hover:bg-[#333] rounded">
                  {currency} <ChevronDown size={14} />
                </button>
                {isCurrencyOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-1 w-20 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden">
                      {['EUR', 'USD', 'GBP'].map(c => (
                        <div key={c} onClick={() => { setCurrency(c); setIsCurrencyOpen(false); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#2d2d2d] text-center text-white">{c}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nota (opcional)</label>
            <input type="text" placeholder="Añadir un comentario..." value={nota} onChange={(e) => setNota(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none" />
          </div>
        </div>

        <div className="p-6 border-t border-[#2d2d2d] bg-[#151515] rounded-b-xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-white">Importe total</span>
            <span className="text-2xl font-bold text-white">{importeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
          <button onClick={handleSave} disabled={!asset || !cantidadInvertida || !price} className="w-full bg-white text-black font-bold py-3.5 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
            Agregar transacción
          </button>
        </div>
      </div>
    </div>
  );
};
