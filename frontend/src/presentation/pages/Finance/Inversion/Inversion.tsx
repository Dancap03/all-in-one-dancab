import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface InvestmentTransactionModalProps {
  onClose: () => void;
}

// Lista local y fija de activos para el buscador (Sin llamadas a APIs ni IA)
const MOCK_MARKET_ASSETS = [
  { ticker: 'INTC', name: 'Intel Corporation', price: 30.45, currency: 'USD' },
  { ticker: 'BTC', name: 'Bitcoin', price: 64200.00, currency: 'EUR' },
  { ticker: 'ETH', name: 'Ethereum', price: 3450.00, currency: 'EUR' },
  { ticker: 'AAPL', name: 'Apple Inc.', price: 175.20, currency: 'USD' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', price: 415.50, currency: 'USD' },
  { ticker: 'VUSA', name: 'Vanguard S&P 500 ETF', price: 84.10, currency: 'EUR' }
];

export const InvestmentTransactionModal = ({ onClose }: InvestmentTransactionModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_MARKET_ASSETS>([]);
  const [selectedAsset, setSelectedAsset] = useState<typeof MOCK_MARKET_ASSETS[0] | null>(null);
  
  const [cantidad, setCantidad] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [nota, setNota] = useState('');

  // Lógica de búsqueda 100% offline y local
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = MOCK_MARKET_ASSETS.filter(asset => 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSelectAsset = (asset: typeof MOCK_MARKET_ASSETS[0]) => {
    setSelectedAsset(asset);
    setPrecioCompra(asset.price.toString());
    setSearchResults([]);
    setSearchQuery(`${asset.ticker} - ${asset.name}`);
  };

  const handleSave = () => {
    // Aquí irá tu lógica para guardar la transacción en Kutxabank/Firebase
    alert('Transacción agregada con éxito de forma local');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#2d2d2d] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-[#2d2d2d] flex justify-between items-center bg-[#181818] rounded-t-2xl">
          <h3 className="text-lg font-black text-white tracking-wide">Agregar transacción</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 bg-[#252525] rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 overflow-y-auto space-y-4 hide-scrollbar">
          {/* Cartera */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cartera</label>
            <select className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-white outline-none">
              <option>Cartera de prueba</option>
            </select>
          </div>

          {/* Tipo de movimiento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo</label>
            <select className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-white outline-none">
              <option>Comprar</option>
              <option>Vender</option>
            </select>
          </div>

          {/* BUSCADOR DE MERCADO LOCAL */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buscar activo en mercado</label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-3 py-1 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
                <Search size={16} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Ej: intel, btc, apple..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none py-2"
                />
              </div>
              <button type="submit" className="bg-[#1e1e1e] hover:bg-[#252525] border border-[#2d2d2d] text-white px-5 rounded-xl text-sm font-bold transition-colors cursor-pointer">
                Buscar
              </button>
            </form>

            {/* Resultados desplegables flotantes */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[76px] bg-[#181818] border border-[#2d2d2d] rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y border divide-[#2d2d2d]">
                {searchResults.map((asset) => (
                  <button
                    key={asset.ticker}
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full text-left px-4 py-3 hover:bg-[#222] flex justify-between items-center text-sm transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-400 mr-2">{asset.ticker}</span>
                      <span className="text-gray-200 font-medium">{asset.name}</span>
                    </div>
                    <span className="text-gray-400 font-semibold">{asset.price} {asset.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cantidad Invertida */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cantidad invertida</label>
            <input 
              type="number" 
              placeholder="Ejemplo: 50.00" 
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Precio de Compra por Unidad */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Precio de compra (por unidad)</label>
            <div className="relative">
              <input 
                type="number" 
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                {selectedAsset?.currency || 'EUR'}
              </span>
            </div>
          </div>

          {/* Nota Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nota (opcional)</label>
            <textarea 
              placeholder="Añadir un comentario..." 
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-white outline-none h-20 resize-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer con el botón de añadir */}
        <div className="p-5 border-t border-[#2d2d2d] bg-[#181818] rounded-b-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-gray-400">Importe total</span>
            <span className="text-lg font-black text-white">
              {(Number(cantidad || 0) * Number(precioCompra || 0)).toFixed(2)} €
            </span>
          </div>
          <button 
            onClick={handleSave}
            className="w-full bg-white hover:bg-gray-200 text-black font-black py-3.5 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Agregar transacción
          </button>
        </div>

      </div>
    </div>
  );
};
