import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface Portfolio {
  id: string;
  nombre: string;
}

interface InvestmentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  activePortfolioId: string;
  currentPositions: any[];
  onSave: (transactionData: any) => void;
}

export const InvestmentTransactionModal = ({ 
  isOpen, onClose, portfolios, activePortfolioId, currentPositions, onSave 
}: InvestmentTransactionModalProps) => {
  const [activeTab, setActiveTab] = useState('Activo');
  const [portfolioId, setPortfolioId] = useState('');
  const [type, setType] = useState('Comprar');
  const [asset, setAsset] = useState('');
  const [cantidadInvertida, setCantidadInvertida] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [nota, setNota] = useState('');

  const tabs = ['Activo', 'Cripto', 'Bono', 'Efectivo', 'Inmobiliario', 'NFT', 'Materia prima', 'Préstamo'];

  useEffect(() => {
    if (isOpen) {
      setPortfolioId(activePortfolioId === 'aggregated' ? (portfolios[0]?.id || '') : activePortfolioId);
      setType('Comprar');
      setAsset('');
      setCantidadInvertida('');
      setPrice('');
      setNota('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, activePortfolioId, portfolios]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!asset || !cantidadInvertida || !price) return;
    
    const shares = Number(cantidadInvertida) / Number(price);

    onSave({
      portfolioId,
      type,
      asset,
      cantidadInvertida: Number(cantidadInvertida),
      price: Number(price),
      shares,
      currency,
      date,
      nota
    });
    
    onClose();
  };

  const importeTotal = Number(cantidadInvertida) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      
      {/* Estilo inyectado para ocultar la scrollbar nativa pero permitir scroll */}
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-6 border-b border-[#2d2d2d]">
          <h2 className="text-xl font-bold text-white">Agregar transacción</h2>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Cargar archivos</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* Pestañas (Scrollable y sin scrollbar visible) */}
        <div className="flex items-center border-b border-[#2d2d2d] relative overflow-hidden">
          <div className="flex gap-6 overflow-x-auto hide-scrollbar px-6 py-3 text-sm font-medium text-gray-400 w-full">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap transition-colors ${activeTab === tab ? 'text-white' : 'hover:text-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="absolute right-0 bg-gradient-to-l from-[#151515] to-transparent w-16 h-full pointer-events-none flex items-center justify-end pr-4">
            <div className="bg-[#1a1a1a] p-0.5 rounded border border-[#2d2d2d]"><ChevronRight size={14} className="text-gray-400" /></div>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-5">
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Cartera de inversiones</label>
            <div className="relative">
              <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none font-medium transition-colors cursor-pointer" style={{ colorScheme: 'dark' }}>
                {portfolios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo de transacción</label>
            <div className="relative">
              <select value={type} onChange={(e) => { setType(e.target.value); setAsset(''); }} className="w-full bg-[#1e1e1e] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none font-medium transition-colors cursor-pointer" style={{ colorScheme: 'dark' }}>
                <option value="Comprar">Comprar</option>
                <option value="Vender">Vender</option>
                <option value="Dividendos">Dividendos</option>
                <option value="Recompensas">Recompensas</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Seleccionar activo a vender' : 'Agregar activo'}</label>
            <div className="relative">
              {type === 'Vender' ? (
                <>
                  <select value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none font-medium transition-colors cursor-pointer" style={{ colorScheme: 'dark' }}>
                    <option value="" disabled>Selecciona una posición actual...</option>
                    {currentPositions.map(p => <option key={p.id} value={p.name}>{p.name} ({p.ticker})</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </>
              ) : (
                <>
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Teletipo de bolsa (ticker), ISIN..." value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg pl-11 pr-4 py-3 text-sm text-white outline-none transition-colors" />
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Cantidad a retirar' : 'Cantidad invertida'}</label>
            <input type="number" placeholder="Por ejemplo 10,00" value={cantidadInvertida} onChange={(e) => setCantidadInvertida(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha de la operación</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" style={{ colorScheme: 'dark' }} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Precio de venta (por unidad)' : 'Precio de compra (por unidad)'}</label>
            <div className="relative flex items-center">
              <input type="number" placeholder="Por ejemplo 1000,00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg pl-4 pr-24 py-3 text-sm text-white outline-none transition-colors" />
              <div className="absolute right-2 flex items-center gap-1 bg-transparent text-sm font-bold text-white">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent outline-none appearance-none cursor-pointer pr-4 z-10 relative" style={{ colorScheme: 'dark' }}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
                <ChevronDown size={14} className="text-white absolute right-0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nota (opcional)</label>
            <input type="text" placeholder="Añadir un comentario..." value={nota} onChange={(e) => setNota(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2d2d2d] bg-[#151515] rounded-b-xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-white">Importe total</span>
            <span className="text-2xl font-bold text-white">{importeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={!asset || !cantidadInvertida || !price}
            className="w-full bg-white text-black font-bold py-3.5 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar transacción
          </button>
        </div>

      </div>
    </div>
  );
};
