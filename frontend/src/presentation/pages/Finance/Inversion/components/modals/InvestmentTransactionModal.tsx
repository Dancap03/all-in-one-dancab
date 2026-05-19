import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Sparkles } from 'lucide-react';
import { FinanceService } from '../../../../../../infrastructure/services/FinanceService';
import { GEMINI_API_KEY } from '../../../../../../infrastructure/firebase/config';

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
  const [portfolioId, setPortfolioId] = useState('');
  const [type, setType] = useState('Comprar');
  const [asset, setAsset] = useState('');
  const [cantidadInvertida, setCantidadInvertida] = useState('');
  
  // FECHA: Aquí se controla el día de la inversión (por defecto hoy)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  
  const [currency, setCurrency] = useState('EUR');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [nota, setNota] = useState('');

  // Estados de la IA
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setPortfolioId(activePortfolioId === 'aggregated' ? (portfolios[0]?.id || '') : activePortfolioId);
      setType('Comprar');
      setAsset('');
      setCantidadInvertida('');
      setPrice('');
      setNota('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsCurrencyOpen(false);
      setAiData(null);
    }
  }, [isOpen, activePortfolioId, portfolios]);

  if (!isOpen) return null;

  // ESTA ES LA MAGIA DE LA IA (Búsqueda en tiempo real y auto-completado)
  const handleAnalyzeAI = async () => {
    if (!asset) return;
    setIsAnalyzing(true);
    try {
      const data: any = await FinanceService.analyzeAssetWithAI(asset, GEMINI_API_KEY);
      setAiData(data);
      // Validamos y ponemos el nombre oficial
      setAsset(`${data.name} (${data.ticker})`);
      // Auto-completamos el precio (sigue siendo editable por el usuario)
      setPrice(data.currentPrice.toString());
      setCurrency(data.currency);
      setNota(`Sector: ${data.sector}`);
    } catch (error) {
      console.error(error);
      alert("La IA no ha encontrado este activo. Asegúrate de que el nombre o ticker es correcto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      date, // Se guarda la fecha elegida
      nota,
      aiData: aiData || null 
    });
    
    onClose();
  };

  const importeTotal = Number(cantidadInvertida) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-[#2d2d2d]">
          <h2 className="text-xl font-bold text-white">Agregar transacción</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

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
              <select value={type} onChange={(e) => { setType(e.target.value); setAsset(''); setAiData(null); }} className="w-full bg-[#1e1e1e] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none font-medium transition-colors cursor-pointer" style={{ colorScheme: 'dark' }}>
                <option value="Comprar">Comprar</option>
                <option value="Vender">Vender</option>
                <option value="Dividendos">Dividendos</option>
                <option value="Recompensas">Recompensas</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Seleccionar activo a vender' : 'Buscar activo en mercado'}</label>
            <div className="relative">
              {type === 'Vender' ? (
                <>
                  <select value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none font-medium transition-colors cursor-pointer" style={{ colorScheme: 'dark' }}>
                    <option value="" disabled>Selecciona una posición actual...</option>
                    {currentPositions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Ej: VUSA, Apple, Bitcoin..." value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg pl-11 pr-4 py-3 text-sm text-white outline-none transition-colors" />
                  </div>
                  {/* EL BOTÓN DE LA IA QUE TE FALTABA */}
                  <button onClick={handleAnalyzeAI} disabled={isAnalyzing || !asset} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                    {isAnalyzing ? 'Buscando...' : <><Sparkles size={16} /> Analizar</>}
                  </button>
                </div>
              )}
            </div>
            {/* Pequeña confirmación visual de que el activo existe */}
            {aiData && type !== 'Vender' && (
              <div className="bg-[#1e293b]/50 border border-blue-500/30 rounded-lg p-3 mt-3 text-xs text-gray-300 space-y-1">
                <p className="text-blue-400 font-bold">✓ Activo validado en mercado</p>
                <p>• Tipo: {aiData.assetClass} | Región: {aiData.region}</p>
                <p>• Precio actual en tiempo real: {aiData.currentPrice} {aiData.currency}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Cantidad a retirar (€)' : 'Cantidad invertida (€)'}</label>
            <input type="number" placeholder="Ejemplo: 50.00" value={cantidadInvertida} onChange={(e) => setCantidadInvertida(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha de la inversión</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" style={{ colorScheme: 'dark' }} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{type === 'Vender' ? 'Precio de venta (por unidad)' : 'Precio de compra (por unidad)'}</label>
            <div className="relative flex items-center">
              <input type="number" placeholder="Búscalo con IA o ponlo a mano" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg pl-4 pr-24 py-3 text-sm text-white outline-none transition-colors" />
              
              <div className="absolute right-2 flex items-center">
                <button 
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center gap-1.5 bg-transparent text-sm font-bold text-white px-3 py-1.5 hover:bg-[#333] rounded transition-colors"
                >
                  {currency} <ChevronDown size={14} />
                </button>
                
                {isCurrencyOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-1 w-20 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden">
                      {['EUR', 'USD', 'GBP'].map(c => (
                        <div 
                          key={c}
                          onClick={() => { setCurrency(c); setIsCurrencyOpen(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#2d2d2d] text-center transition-colors ${currency === c ? 'text-white font-bold bg-[#252525]' : 'text-gray-300'}`}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nota (opcional)</label>
            <input type="text" placeholder="Añadir un comentario..." value={nota} onChange={(e) => setNota(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#333] focus:border-[#555] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors" />
          </div>
        </div>

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
