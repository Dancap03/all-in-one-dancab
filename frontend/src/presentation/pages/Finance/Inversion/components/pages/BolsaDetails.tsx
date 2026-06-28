import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Plus, TrendingUp, Search, ChevronDown, Check, X, Calculator, Trash2, Edit2, Calendar } from 'lucide-react';
import { AssetSearchModal, Asset } from '../modals/AssetSearchModal';
import { db, auth } from '../../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  date?: string; 
}

interface BolsaDetailsProps {
  disponibleGlobal: number; 
  bolsaInvertido: number;
  bolsaGanancias: number;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => Promise<void> | any;
  onBack: () => void;
}

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
  const [addPrice, setAddPrice] = useState('');
  const [addInvested, setAddInvested] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]); 

  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editInvested, setEditInvested] = useState('');
  const [editDate, setEditDate] = useState('');

  const allIndices = ['S&P500', 'MSCI World', 'IBEX 35', 'Nasdaq 100', 'DAX 40', 'Euro Stoxx 50', 'Dow Jones'];
  const filteredIndices = allIndices.filter(idx => idx.toLowerCase().includes(searchIndex.toLowerCase()));

  useEffect(() => {
    const loadPositions = async () => {
      const local = JSON.parse(localStorage.getItem('aio_bolsa_posiciones_v2') || '[]');
      setPosiciones(local);

      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, `users/${user.uid}/investment_balances`, 'bolsa_posiciones'));
        if (docSnap.exists()) {
          const data = docSnap.data().posiciones || [];
          setPosiciones(data);
          localStorage.setItem('aio_bolsa_posiciones_v2', JSON.stringify(data));
        }
      } catch (e) {}
    };
    loadPositions();
  }, []);

  const savePositions = async (newPos: Position[]) => {
    setPosiciones(newPos);
    localStorage.setItem('aio_bolsa_posiciones_v2', JSON.stringify(newPos));
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'bolsa_posiciones'), { posiciones: newPos });
    } catch(e) {}
  };

  const handleSelectAsset = (asset: Asset) => {
    setIsSearchOpen(false);
    setAssetToAdd(asset);
    setAddPrice(asset.price > 0 ? asset.price.toFixed(2) : ''); 
    setAddInvested('');
    setAddDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmAdd = () => {
    if (!assetToAdd) return;
    const invested = Number(addInvested);
    const avgPrice = Number(addPrice);
    
    if (invested <= 0 || avgPrice <= 0) {
      alert('Por favor, asegúrate de que el precio y el total a invertir son mayores que 0.');
      return;
    }

    if (invested > disponibleGlobal) {
      alert(`Saldo insuficiente. Intentas invertir ${invested.toLocaleString('es-ES')} € pero dispones de ${disponibleGlobal.toLocaleString('es-ES')} €.`);
      return;
    }

    const shares = invested / avgPrice;
    const currentMarketPrice = assetToAdd.price > 0 ? assetToAdd.price : avgPrice; 
    const currentValue = shares * currentMarketPrice;
    const changeEur = currentValue - invested;

    const newPos: Position = {
      id: Date.now().toString(),
      ticker: assetToAdd.ticker,
      name: assetToAdd.name,
      shares,
      avgPriceEur: avgPrice,
      currentPrice: currentMarketPrice,
      value: currentValue,
      changePct: invested > 0 ? (changeEur / invested) * 100 : 0,
      changeEur,
      isUp: changeEur >= 0,
      date: addDate
    };

    onEjecutarBolsa(invested, 'propio');
    savePositions([...posiciones, newPos]); 
    
    setAssetToAdd(null);
    setAddPrice('');
    setAddInvested('');
  };

  const handleOpenEdit = (pos: Position) => {
    setEditingPos(pos);
    setEditPrice(pos.avgPriceEur.toString());
    const invested = pos.shares * pos.avgPriceEur;
    setEditInvested(invested.toString());
    setEditDate(pos.date || new Date().toISOString().split('T')[0]);
  };

  const handleConfirmEdit = () => {
    if (!editingPos) return;
    const newInvested = Number(editInvested);
    const newAvgPrice = Number(editPrice);
    const oldInvested = editingPos.shares * editingPos.avgPriceEur;
    
    if (newInvested <= 0 || newAvgPrice <= 0) {
      alert('Valores no válidos.'); return;
    }

    const difference = newInvested - oldInvested;

    if (difference > 0 && difference > disponibleGlobal) {
      alert(`Saldo insuficiente para aumentar la posición. Faltan ${difference.toLocaleString('es-ES')} €.`);
      return;
    }

    if (difference > 0) {
      onEjecutarBolsa(difference, 'propio');
    } else if (difference < 0) {
      onEjecutarBolsa(Math.abs(difference), 'balance');
    }

    const newShares = newInvested / newAvgPrice;
    const currentValue = newShares * editingPos.currentPrice;
    const changeEur = currentValue - newInvested;

    const updatedPosiciones = posiciones.map(p => p.id === editingPos.id ? {
      ...p,
      shares: newShares,
      avgPriceEur: newAvgPrice,
      value: currentValue,
      changeEur,
      changePct: newInvested > 0 ? (changeEur / newInvested) * 100 : 0,
      isUp: changeEur >= 0,
      date: editDate
    } : p);

    savePositions(updatedPosiciones);
    setEditingPos(null);
  };

  const handleDeletePosition = (pos: Position) => {
    if (confirm(`¿Vender / Eliminar posición en ${pos.ticker}?\n\nSe devolverán ${pos.value.toFixed(2)} € a tu Saldo Global y se borrará de tu cartera.`)) {
      const nuevasPosiciones = posiciones.filter(p => p.id !== pos.id);
      savePositions(nuevasPosiciones); 
      onEjecutarBolsa(pos.value, 'balance'); 
    }
  };

  // 🚀 OBTENEDOR DE PRECIOS PROFUNDO (Ignora Caché y Bloqueos)
  const handleUpdatePrices = async () => {
    if (posiciones.length === 0) return;
    setIsUpdating(true);
    
    try {
      let usdToEurRate = 0.92;
      try {
        const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          usdToEurRate = fxData.rates.EUR;
        }
      } catch(e) {}

      let actualizados = 0;

      const updatedPosiciones = await Promise.all(posiciones.map(async (pos) => {
        try {
          const timestamp = Date.now();
          let formattedTicker = pos.ticker;
          if (formattedTicker.endsWith('USD') && formattedTicker.length > 3 && !formattedTicker.includes('-')) {
            formattedTicker = formattedTicker.replace('USD', '-USD');
          }

          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1d&range=1d&_ts=${timestamp}`;
          
          const proxies = [
            { url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, isWrapped: true },
            { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, isWrapped: false },
            { url: `https://corsproxy.io/?url=${encodeURIComponent(url)}`, isWrapped: false }
          ];

          let meta = null;
          for (const proxy of proxies) {
            try {
              const res = await fetch(proxy.url);
              if (!res.ok) continue;
              
              let data;
              if (proxy.isWrapped) {
                const wrapper = await res.json();
                data = JSON.parse(wrapper.contents);
              } else {
                data = await res.json();
              }

              if (data?.chart?.result?.[0]?.meta) {
                meta = data.chart.result[0].meta;
                break; // Lo encontramos
              }
            } catch (e) {}
          }

          if (meta && meta.regularMarketPrice) {
            let currentPriceEur = meta.regularMarketPrice;
            if (meta.currency === 'USD') currentPriceEur *= usdToEurRate;
            else if (meta.currency === 'GBP') currentPriceEur *= 1.17; 

            const value = pos.shares * currentPriceEur;
            const invested = pos.shares * pos.avgPriceEur;
            const changeEur = value - invested;
            const changePct = invested > 0 ? (changeEur / invested) * 100 : 0;

            actualizados++;

            return {
              ...pos,
              currentPrice: currentPriceEur,
              value,
              changeEur,
              changePct,
              isUp: changeEur >= 0
            };
          }
        } catch (e) {}
        return pos; 
      }));

      savePositions(updatedPosiciones);
      
      if (actualizados === 0) {
        alert("Los servidores del mercado han rechazado la conexión. Vuelve a intentarlo.");
      }

    } catch (error) {
      alert("Fallo general de red al intentar actualizar los precios.");
    } finally {
      setIsUpdating(false);
    }
  };

  const totalInvertidoCartera = posiciones.reduce((sum, pos) => sum + (pos.shares * pos.avgPriceEur), 0);
  const carteraTotal = posiciones.reduce((sum, pos) => sum + pos.value, 0);
  const gananciasTotales = carteraTotal - totalInvertidoCartera;
  const rentabilidadPct = totalInvertidoCartera > 0 ? (gananciasTotales / totalInvertidoCartera) * 100 : 0;

  let curveType = 'flat';
  if (rentabilidadPct > 0.1) curveType = 'up';
  else if (rentabilidadPct < -0.1) curveType = 'down';

  let dynamicSvgPath = "M 0 80 Q 100 70, 200 80 T 400 80"; 
  let strokeColor = "#9ca3af"; 

  if (curveType === 'up') {
    dynamicSvgPath = "M0 130 Q 100 140, 200 100 T 400 30";
    strokeColor = "#10b981"; 
  } else if (curveType === 'down') {
    dynamicSvgPath = "M0 30 Q 100 20, 200 80 T 400 140";
    strokeColor = "#ef4444"; 
  }

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
          <div className={`flex items-center gap-1.5 font-bold text-sm ${curveType === 'up' ? 'text-emerald-400' : curveType === 'down' ? 'text-rose-400' : 'text-gray-400'}`}>
            <TrendingUp size={16} strokeWidth={2.5} className={curveType === 'down' ? 'transform rotate-180' : ''} />
            <span>
              {posiciones.length > 0 
                ? `${gananciasTotales > 0 ? '+' : ''}${rentabilidadPct.toFixed(2)}% · ${gananciasTotales > 0 ? '+' : ''}${gananciasTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
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
                <input type="text" placeholder="Buscar índice..." value={searchIndex} onChange={(e) => setSearchIndex(e.target.value)} className="bg-transparent w-full text-xs outline-none text-white placeholder-gray-600" autoFocus />
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {filteredIndices.length > 0 ? (
                  filteredIndices.map(idx => (
                    <button key={idx} onClick={() => { setSelectedCompare(idx); setIsCompareOpen(false); setSearchIndex(''); }} className="w-full px-3 py-2.5 text-xs text-left text-gray-300 hover:text-white hover:bg-[#2d2d2d] flex justify-between items-center transition-colors cursor-pointer">
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
                <linearGradient id="gradBolsaDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 130 Q 100 120, 200 100 T 400 60" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d={`${dynamicSvgPath} L 400 150 L 0 150 Z`} fill="url(#gradBolsaDynamic)" />
              <path d={dynamicSvgPath} fill="none" stroke={strokeColor} strokeWidth="2.5" />
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
              <div className={`w-3 h-3 rounded-sm`} style={{ backgroundColor: strokeColor }}></div>
              <span className="text-xs font-bold text-gray-300">Mi cartera {gananciasTotales > 0 ? '+' : ''}{rentabilidadPct.toFixed(2)}%</span>
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
              <div key={pos.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex items-center justify-between hover:bg-[#1c1c1e] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center font-bold text-white text-[10px] border border-[#3d3d3d]">
                    {pos.ticker.substring(0,2)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm flex items-center gap-2">
                      {pos.ticker}
                      <span className="text-[10px] font-medium text-gray-500 bg-[#2d2d2d] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Calendar size={10} /> {pos.date ? new Date(pos.date).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'2-digit'}) : '--/--/--'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{pos.name}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{pos.shares.toLocaleString('es-ES', { maximumFractionDigits: 5 })} acciones</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{pos.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${pos.isUp ? 'text-emerald-400' : pos.changePct < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                      {pos.isUp && pos.changeEur > 0 ? '+' : ''}{pos.changeEur.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({pos.isUp && pos.changePct > 0 ? '+' : ''}{pos.changePct.toFixed(2)}%)
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(pos)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Editar Posición">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeletePosition(pos)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Vender o borrar">
                      <Trash2 size={16} />
                    </button>
                  </div>
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

      <AssetSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectAsset={handleSelectAsset} />

      {/* MODAL: AÑADIR POSICIÓN */}
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
            
            <div className="p-5 space-y-4">
              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-[#2d2d2d] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Efectivo disponible:</span>
                <span className="text-sm font-black text-emerald-400">{disponibleGlobal.toLocaleString('es-ES')} €</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de compra</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de compra (€)</label>
                  <input type="number" step="any" placeholder="Ej: 150.25" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total a Invertir (€)</label>
                  <input type="number" step="any" placeholder="Ej: 10" value={addInvested} onChange={(e) => setAddInvested(e.target.value)} className="w-full bg-[#1c1c1e] border border-amber-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.1)]" />
                </div>
              </div>

              {addInvested && addPrice && Number(addPrice) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-2 flex items-center gap-2">
                  <Calculator size={16} className="text-amber-500" />
                  <p className="text-sm text-amber-500">
                    Estás comprando <span className="font-black">{(Number(addInvested) / Number(addPrice)).toFixed(5)}</span> acciones
                  </p>
                </div>
              )}

              <button onClick={handleConfirmAdd} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">
                Comprar / Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR POSICIÓN */}
      {editingPos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Editar Posición</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingPos.name} ({editingPos.ticker})</p>
              </div>
              <button onClick={() => setEditingPos(null)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de compra</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de compra (€)</label>
                  <input type="number" step="any" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total Invertido (€)</label>
                  <input type="number" step="any" value={editInvested} onChange={(e) => setEditInvested(e.target.value)} className="w-full bg-[#1c1c1e] border border-blue-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.1)]" />
                </div>
              </div>

              {editInvested && editPrice && Number(editPrice) > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mt-2 flex items-center gap-2">
                  <Calculator size={16} className="text-blue-400" />
                  <p className="text-sm text-blue-400">
                    Calculado en <span className="font-black">{(Number(editInvested) / Number(editPrice)).toFixed(5)}</span> acciones
                  </p>
                </div>
              )}

              <button onClick={handleConfirmEdit} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
