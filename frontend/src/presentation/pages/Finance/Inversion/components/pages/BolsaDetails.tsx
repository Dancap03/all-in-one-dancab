import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Plus, TrendingUp, Search, ChevronDown, Check, X, Calculator, Trash2, Edit2, Calendar, Banknote, ChevronRight } from 'lucide-react';
import { AssetSearchModal, Asset } from '../modals/AssetSearchModal';
import { db, auth } from '../../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Position {
  id: string; ticker: string; name: string; shares: number; avgPriceEur: number;
  currentPrice: number; value: number; changePct: number; changeEur: number;
  isUp: boolean; date?: string; fundSource?: string; 
}

interface GroupedPosition {
  ticker: string; name: string; totalShares: number; totalInvested: number; currentPrice: number;
  totalValue: number; changeEur: number; changePct: number; isUp: boolean; lots: Position[];
}

interface BolsaDetailsProps {
  disponibleGlobal: number; bolsaInvertido: number; bolsaGanancias: number;
  onEjecutarBolsa: (monto: number, tipo: string, costeOriginal?: number) => Promise<void> | any;
  onBack: () => void;
}

export const BolsaDetails = ({ disponibleGlobal, bolsaInvertido, bolsaGanancias, onEjecutarBolsa, onBack }: BolsaDetailsProps) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string>('S&P500');
  const [searchIndex, setSearchIndex] = useState('');

  const [posiciones, setPosiciones] = useState<Position[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedTickers, setExpandedTickers] = useState<Record<string, boolean>>({}); 
  
  const [assetToAdd, setAssetToAdd] = useState<Asset | null>(null);
  const [addPrice, setAddPrice] = useState('');
  const [addInvested, setAddInvested] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]); 
  const [fundSource, setFundSource] = useState('propio'); 

  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editInvested, setEditInvested] = useState('');
  const [editDate, setEditDate] = useState('');

  const [sellingGroup, setSellingGroup] = useState<GroupedPosition | null>(null);
  const [sellShares, setSellShares] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  // 🚀 ESTADO PARA FORZAR PRECIO MANUAL
  const [manualPriceGroup, setManualPriceGroup] = useState<GroupedPosition | null>(null);
  const [manualPriceInput, setManualPriceInput] = useState('');

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
    try { await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'bolsa_posiciones'), { posiciones: newPos }); } catch(e) {}
  };

  const groupedPositions = useMemo(() => {
    const groups: Record<string, GroupedPosition> = {};
    posiciones.forEach(pos => {
      if (!groups[pos.ticker]) {
        groups[pos.ticker] = { ticker: pos.ticker, name: pos.name, totalShares: 0, totalInvested: 0, currentPrice: pos.currentPrice, totalValue: 0, changeEur: 0, changePct: 0, isUp: true, lots: [] };
      }
      groups[pos.ticker].totalShares += pos.shares;
      groups[pos.ticker].totalInvested += (pos.shares * pos.avgPriceEur);
      groups[pos.ticker].totalValue += (pos.shares * pos.currentPrice);
      groups[pos.ticker].currentPrice = pos.currentPrice; 
      groups[pos.ticker].lots.push(pos);
      groups[pos.ticker].lots.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    });
    return Object.values(groups).map(g => {
      g.changeEur = g.totalValue - g.totalInvested;
      g.changePct = g.totalInvested > 0 ? (g.changeEur / g.totalInvested) * 100 : 0;
      g.isUp = g.changeEur >= 0;
      return g;
    });
  }, [posiciones]);

  const toggleExpand = (ticker: string) => setExpandedTickers(prev => ({ ...prev, [ticker]: !prev[ticker] }));

  const handleSelectAsset = (asset: Asset) => {
    setIsSearchOpen(false); setAssetToAdd(asset); setAddPrice(asset.price > 0 ? asset.price.toFixed(2) : ''); 
    setAddInvested(''); setAddDate(new Date().toISOString().split('T')[0]); setFundSource('propio');
  };

  const handleBuyMore = (group: GroupedPosition) => {
    const assetMock: Asset = { id: group.ticker, ticker: group.ticker, name: group.name, type: 'Acciones', price: group.currentPrice };
    handleSelectAsset(assetMock);
  };

  const handleConfirmAdd = () => {
    if (!assetToAdd) return;
    const invested = Number(addInvested); const avgPrice = Number(addPrice);
    if (invested <= 0 || avgPrice <= 0) return;
    if (fundSource === 'propio' && invested > disponibleGlobal) { alert('Saldo Disponible insuficiente.'); return; }
    if (fundSource === 'ganancia' && invested > bolsaGanancias) { alert('Ganancias insuficientes.'); return; }

    const shares = invested / avgPrice;
    const currentMarketPrice = assetToAdd.price > 0 ? assetToAdd.price : avgPrice; 
    const currentValue = shares * currentMarketPrice;
    const changeEur = currentValue - invested;

    const newPos: Position = {
      id: Date.now().toString(), ticker: assetToAdd.ticker, name: assetToAdd.name, shares, avgPriceEur: avgPrice,
      currentPrice: currentMarketPrice, value: currentValue, changePct: invested > 0 ? (changeEur / invested) * 100 : 0, changeEur, isUp: changeEur >= 0, date: addDate,
      fundSource: fundSource 
    };

    const actionType = fundSource === 'propio' ? 'propio' : fundSource === 'ganancia' ? 'ganancia_compra' : 'otro_compra';
    onEjecutarBolsa(invested, actionType);
    savePositions([...posiciones, newPos]); setAssetToAdd(null);
  };

  const handleOpenSell = (group: GroupedPosition) => {
    setSellingGroup(group); setSellShares(group.totalShares.toString()); setSellPrice(group.currentPrice.toString()); 
  };

  const calculateFifoCost = (sharesToSell: number, ticker: string) => {
    let remaining = sharesToSell; let cost = 0;
    const lots = posiciones.filter(p => p.ticker === ticker).sort((a,b) => new Date(a.date||0).getTime() - new Date(b.date||0).getTime());
    for(const l of lots){
      if(remaining <= 0) break;
      if(l.shares <= remaining){ cost += l.shares * l.avgPriceEur; remaining -= l.shares; } 
      else { cost += remaining * l.avgPriceEur; remaining = 0; }
    }
    return cost;
  };

  const handleConfirmSell = () => {
    if (!sellingGroup) return;
    const sharesToSell = Number(sellShares); const priceToSell = Number(sellPrice);
    if (sharesToSell <= 0 || sharesToSell > sellingGroup.totalShares || priceToSell <= 0) return;

    let remainingToSell = sharesToSell; let totalCostOriginal = 0; let updatedPosiciones = [...posiciones];
    const lots = updatedPosiciones.filter(p => p.ticker === sellingGroup.ticker).sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    for (const lot of lots) {
      if (remainingToSell <= 0) break;
      if (lot.shares <= remainingToSell) {
        totalCostOriginal += lot.shares * lot.avgPriceEur; remainingToSell -= lot.shares;
        updatedPosiciones = updatedPosiciones.filter(p => p.id !== lot.id);
      } else {
        totalCostOriginal += remainingToSell * lot.avgPriceEur;
        const remainingSharesInLot = lot.shares - remainingToSell;
        updatedPosiciones = updatedPosiciones.map(p => {
          if (p.id === lot.id) {
            const newValue = remainingSharesInLot * p.currentPrice;
            const newChangeEur = newValue - (remainingSharesInLot * p.avgPriceEur);
            return { ...p, shares: remainingSharesInLot, value: newValue, changeEur: newChangeEur, changePct: (newChangeEur / (remainingSharesInLot * p.avgPriceEur)) * 100 };
          }
          return p;
        });
        remainingToSell = 0;
      }
    }

    onEjecutarBolsa(sharesToSell * priceToSell, 'vender', totalCostOriginal);
    savePositions(updatedPosiciones); setSellingGroup(null);
  };

  const handleDeleteLot = (lot: Position) => {
    const source = lot.fundSource || 'propio'; const cost = lot.shares * lot.avgPriceEur;
    if (confirm(`¿Deshacer lote de ${lot.ticker} por ${cost.toFixed(2)}€?`)) {
      const nuevasPosiciones = posiciones.filter(p => p.id !== lot.id);
      savePositions(nuevasPosiciones); onEjecutarBolsa(cost, `deshacer_${source}`); 
    }
  };

  const handleOpenEdit = (lot: Position) => {
    setEditingPos(lot); setEditPrice(lot.avgPriceEur.toString()); setEditInvested((lot.shares * lot.avgPriceEur).toString()); setEditDate(lot.date || new Date().toISOString().split('T')[0]);
  };

  const handleConfirmEdit = () => {
    if (!editingPos) return;
    const newInvested = Number(editInvested); const newAvgPrice = Number(editPrice);
    const oldInvested = editingPos.shares * editingPos.avgPriceEur;
    if (newInvested <= 0 || newAvgPrice <= 0) return;

    const difference = newInvested - oldInvested;
    const source = editingPos.fundSource || 'propio';

    if (difference > 0) {
      if (source === 'propio' && difference > disponibleGlobal) return;
      if (source === 'ganancia' && difference > bolsaGanancias) return;
      onEjecutarBolsa(difference, source === 'propio' ? 'propio' : source === 'ganancia' ? 'ganancia_compra' : 'otro_compra');
    } else if (difference < 0) {
      onEjecutarBolsa(Math.abs(difference), `deshacer_${source}`); 
    }

    const newShares = newInvested / newAvgPrice;
    const currentValue = newShares * editingPos.currentPrice;
    const changeEur = currentValue - newInvested;

    const updatedPosiciones = posiciones.map(p => p.id === editingPos.id ? {
      ...p, shares: newShares, avgPriceEur: newAvgPrice, value: currentValue, changeEur,
      changePct: newInvested > 0 ? (changeEur / newInvested) * 100 : 0, isUp: changeEur >= 0, date: editDate
    } : p);

    savePositions(updatedPosiciones); setEditingPos(null);
  };

  // 🚀 ACTUALIZACIÓN AUTOMÁTICA EN BATCH
  const handleUpdatePrices = async () => {
    if (posiciones.length === 0) return;
    setIsUpdating(true);
    try {
      let usdToEurRate = 0.92;
      try { const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR'); if (fxRes.ok) usdToEurRate = (await fxRes.json()).rates.EUR; } catch(e) {}

      const uniqueTickers = Array.from(new Set(posiciones.map(p => {
        let t = p.ticker;
        if (t.endsWith('USD') && t.length > 3 && !t.includes('-')) t = t.replace('USD', '-USD');
        return t;
      }))).join(',');

      const timestamp = Date.now();
      const url = `https://query2.finance.yahoo.com/v8/finance/spark?symbols=${uniqueTickers}&_ts=${timestamp}`;
      const proxies = [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`];

      let priceMap = new Map();
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy);
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.spark?.result) {
            data.spark.result.forEach((r: any) => { if (r.response?.[0]?.meta) { priceMap.set(r.symbol, r.response[0].meta); } });
            break;
          }
        } catch (e) {}
      }

      const updatedPosiciones = posiciones.map(pos => {
        let t = pos.ticker;
        if (t.endsWith('USD') && t.length > 3 && !t.includes('-')) t = t.replace('USD', '-USD');
        const meta = priceMap.get(t);
        if (meta && meta.regularMarketPrice) {
          let currentPriceEur = meta.regularMarketPrice;
          if (meta.currency === 'USD') currentPriceEur *= usdToEurRate; else if (meta.currency === 'GBP') currentPriceEur *= 1.17; 
          const value = pos.shares * currentPriceEur; const invested = pos.shares * pos.avgPriceEur; const changeEur = value - invested;
          return { ...pos, currentPrice: currentPriceEur, value, changeEur, changePct: invested > 0 ? (changeEur / invested) * 100 : 0, isUp: changeEur >= 0 };
        }
        return pos; 
      });

      savePositions(updatedPosiciones);
    } catch (error) {} finally { setIsUpdating(false); }
  };

  // 🚀 FORZAR PRECIO MANUAL
  const handleConfirmManualPrice = () => {
    if (!manualPriceGroup) return;
    const newPrice = Number(manualPriceInput);
    if (newPrice <= 0) return;

    const updatedPosiciones = posiciones.map(p => {
      if (p.ticker === manualPriceGroup.ticker) {
        const value = p.shares * newPrice;
        const changeEur = value - (p.shares * p.avgPriceEur);
        return {
          ...p, currentPrice: newPrice, value, changeEur,
          changePct: (changeEur / (p.shares * p.avgPriceEur)) * 100, isUp: changeEur >= 0
        };
      }
      return p;
    });

    savePositions(updatedPosiciones);
    setManualPriceGroup(null);
  };

  const totalInvertidoCartera = groupedPositions.reduce((sum, g) => sum + g.totalInvested, 0);
  const carteraTotal = groupedPositions.reduce((sum, g) => sum + g.totalValue, 0);
  const gananciasTotales = carteraTotal - totalInvertidoCartera;
  const rentabilidadPct = totalInvertidoCartera > 0 ? (gananciasTotales / totalInvertidoCartera) * 100 : 0;
  let curveType = 'flat'; if (rentabilidadPct > 0.1) curveType = 'up'; else if (rentabilidadPct < -0.1) curveType = 'down';
  let dynamicSvgPath = "M 0 80 Q 100 70, 200 80 T 400 80"; let strokeColor = "#9ca3af"; 
  if (curveType === 'up') { dynamicSvgPath = "M0 130 Q 100 140, 200 100 T 400 30"; strokeColor = "#10b981"; } else if (curveType === 'down') { dynamicSvgPath = "M0 30 Q 100 20, 200 80 T 400 140"; strokeColor = "#ef4444"; }

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer"><ArrowLeft size={24} /></button>
        <div className="flex gap-3 items-center">
          <button onClick={handleUpdatePrices} disabled={isUpdating || posiciones.length === 0} className={`p-2 transition-all rounded-lg cursor-pointer ${posiciones.length === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'} ${isUpdating ? 'animate-spin text-amber-500' : ''}`}><RefreshCw size={20} /></button>
          <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 bg-[#eab308] hover:bg-[#ca8a04] text-black transition-colors rounded-[10px] flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10"><Plus size={24} strokeWidth={2.5} /></button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-400 font-medium text-sm mb-1">Cartera bolsa total</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-1.5">{posiciones.length > 0 ? `${carteraTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : `${(bolsaInvertido + bolsaGanancias).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}</h2>
          <div className={`flex items-center gap-1.5 font-bold text-sm ${curveType === 'up' ? 'text-emerald-400' : curveType === 'down' ? 'text-rose-400' : 'text-gray-400'}`}>
            <TrendingUp size={16} strokeWidth={2.5} className={curveType === 'down' ? 'transform rotate-180' : ''} />
            <span>{posiciones.length > 0 ? `${gananciasTotales > 0 ? '+' : ''}${rentabilidadPct.toFixed(2)}% · ${gananciasTotales > 0 ? '+' : ''}${gananciasTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : `+0.0% · 0,00 €`}</span>
          </div>
        </div>
      </div>

      {posiciones.length > 0 ? (
        <div className="mb-8">
          <div className="w-full h-48 mb-4 relative">
            <svg viewBox="0 0 400 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs><linearGradient id="gradBolsaDynamic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" /><stop offset="100%" stopColor={strokeColor} stopOpacity="0" /></linearGradient></defs>
              <path d="M0 130 Q 100 120, 200 100 T 400 60" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d={`${dynamicSvgPath} L 400 150 L 0 150 Z`} fill="url(#gradBolsaDynamic)" />
              <path d={dynamicSvgPath} fill="none" stroke={strokeColor} strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-[#141416] rounded-2xl border border-dashed border-[#2d2d2d] flex flex-col items-center justify-center text-gray-600 mb-10"><TrendingUp size={32} className="mb-3 opacity-30" /><p className="font-bold text-sm text-gray-400 mb-1">Gráfica no disponible</p></div>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Posiciones</h3>
        
        {groupedPositions.length > 0 ? (
          <div className="space-y-3">
            {groupedPositions.map((group) => {
              const isExpanded = !!expandedTickers[group.ticker];
              return (
                <div key={group.ticker} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl overflow-hidden transition-all shadow-sm">
                  <div onClick={() => toggleExpand(group.ticker)} className="p-4 flex items-center justify-between hover:bg-[#1c1c1e] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center font-bold text-white text-[10px] border border-[#3d3d3d]">{group.ticker.substring(0,2)}</div>
                      <div>
                        <p className="text-white font-bold text-sm flex items-center gap-1.5">{group.ticker} {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}</p>
                        <p className="text-xs text-gray-500">{group.name}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{group.totalShares.toLocaleString('es-ES', { maximumFractionDigits: 5 })} acciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{group.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                      <p className={`text-[11px] font-bold mt-0.5 ${group.isUp ? 'text-emerald-400' : group.changePct < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                        {group.isUp && group.changeEur > 0 ? '+' : ''}{group.changeEur.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({group.isUp && group.changePct > 0 ? '+' : ''}{group.changePct.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-[#101012] border-t border-[#2d2d2d]">
                      {/* 🚀 BOTONERA SUPERIOR (Incluye Forzar Precio) */}
                      <div className="flex items-center justify-end gap-2 p-3 border-b border-[#2d2d2d]/50 bg-[#161618]">
                        <button onClick={(e) => { e.stopPropagation(); setManualPriceGroup(group); setManualPriceInput(group.currentPrice.toString()); }} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                          <Edit2 size={14} /> Forzar Precio
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenSell(group); }} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                          <Banknote size={14} /> Vender
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleBuyMore(group); }} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                          <Plus size={14} strokeWidth={3} /> Comprar más
                        </button>
                      </div>

                      <div className="divide-y divide-[#2d2d2d]/30">
                        {group.lots.map((lot, idx) => (
                          <div key={lot.id} className="p-3 pl-14 flex items-center justify-between hover:bg-[#1a1a1c] transition-colors group/lot">
                            <div>
                              <p className="text-xs text-gray-300 font-bold flex items-center gap-1.5">Lote {idx + 1} <span className="text-[9px] font-medium text-gray-500 bg-[#222] px-1.5 py-0.5 rounded">{lot.date ? new Date(lot.date).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'2-digit'}) : 'Antiguo'}</span></p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{lot.shares.toFixed(4)} accs. a {lot.avgPriceEur.toFixed(2)} €</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className={`text-xs font-bold ${lot.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{lot.value.toFixed(2)} €</p>
                              <div className="flex gap-1 opacity-0 group-hover/lot:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEdit(lot)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-md transition-colors cursor-pointer" title="Editar lote"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteLot(lot)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors cursor-pointer" title="Deshacer lote"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#141416] border border-[#2d2d2d] rounded-2xl"><p className="text-gray-500 font-medium text-sm mb-4">Aún no tienes posiciones en tu cartera.</p><button onClick={() => setIsSearchOpen(true)} className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer text-sm">Buscar un activo</button></div>
        )}
      </div>

      <AssetSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectAsset={handleSelectAsset} />

      {/* 🚀 MODAL: FORZAR PRECIO MANUAL */}
      {manualPriceGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-blue-400 tracking-tight">Forzar Precio</h3><p className="text-xs text-gray-500 mt-0.5">{manualPriceGroup.name} ({manualPriceGroup.ticker})</p></div>
              <button onClick={() => setManualPriceGroup(null)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-[#2d2d2d] flex justify-between items-center"><span className="text-xs font-bold text-gray-400">Precio actual en app:</span><span className="text-sm font-black text-white">{manualPriceGroup.currentPrice.toFixed(4)} €</span></div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nuevo precio de mercado (€)</label>
                <input type="number" step="any" placeholder="Precio real actual" value={manualPriceInput} onChange={(e) => setManualPriceInput(e.target.value)} className="w-full bg-[#1c1c1e] border border-blue-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]" autoFocus />
              </div>

              <button onClick={handleConfirmManualPrice} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">Actualizar Precio</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES CLÁSICOS */}
      {assetToAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-white tracking-tight">Comprar Activo</h3><p className="text-xs text-gray-500 mt-0.5">{assetToAdd.name} ({assetToAdd.ticker})</p></div>
              <button onClick={() => setAssetToAdd(null)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Origen del dinero</label>
                <select value={fundSource} onChange={(e) => setFundSource(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-500 cursor-pointer">
                  <option value="propio">Saldo Disponible ({disponibleGlobal.toLocaleString('es-ES')} €)</option>
                  <option value="ganancia">Dividendos/Ganancias ({bolsaGanancias.toLocaleString('es-ES')} €)</option>
                  <option value="otro">Dinero Externo (No resta del saldo)</option>
                </select>
              </div>
              <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de compra</label><input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de compra (€)</label><input type="number" step="any" placeholder="Ej: 150" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total a Invertir (€)</label><input type="number" step="any" placeholder="Ej: 10" value={addInvested} onChange={(e) => setAddInvested(e.target.value)} className="w-full bg-[#1c1c1e] border border-amber-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" /></div>
              </div>
              <button onClick={handleConfirmAdd} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-2">Registrar Compra</button>
            </div>
          </div>
        </div>
      )}

      {sellingGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-emerald-400 tracking-tight">Vender Acciones</h3><p className="text-xs text-gray-500 mt-0.5">{sellingGroup.name} ({sellingGroup.ticker})</p></div>
              <button onClick={() => setSellingGroup(null)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#1c1c1e] p-4 rounded-xl border border-[#2d2d2d] flex justify-between items-center"><span className="text-xs font-bold text-gray-400">Acciones en cartera:</span><span className="text-sm font-black text-white">{sellingGroup.totalShares.toFixed(5)}</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nº a Vender</label><input type="number" step="any" max={sellingGroup.totalShares} value={sellShares} onChange={(e) => setSellShares(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de Venta (€)</label><input type="number" step="any" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-emerald-500" /></div>
              </div>
              {sellShares && sellPrice && Number(sellShares) > 0 && Number(sellPrice) > 0 && (
                <div className="bg-black/20 border border-[#2d2d2d] p-4 rounded-xl space-y-2 mt-4">
                  <div className="flex justify-between text-xs"><span className="text-gray-500 font-bold">Total a recibir en cuenta:</span><span className="text-white font-black">{(Number(sellShares) * Number(sellPrice)).toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span></div>
                  <div className="flex justify-between text-xs border-t border-[#2d2d2d]/50 pt-2"><span className="text-gray-500 font-bold">Beneficio Neto (Ganancia Real):</span><span className={`font-black ${((Number(sellShares) * Number(sellPrice)) - calculateFifoCost(Number(sellShares), sellingGroup.ticker)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{((Number(sellShares) * Number(sellPrice)) - calculateFifoCost(Number(sellShares), sellingGroup.ticker)) > 0 ? '+' : ''}{((Number(sellShares) * Number(sellPrice)) - calculateFifoCost(Number(sellShares), sellingGroup.ticker)).toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span></div>
                </div>
              )}
              <button onClick={handleConfirmSell} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-2">Confirmar Venta</button>
            </div>
          </div>
        </div>
      )}

      {editingPos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-white tracking-tight">Editar Lote</h3><p className="text-xs text-gray-500 mt-0.5">{editingPos.name} ({editingPos.ticker})</p></div>
              <button onClick={() => setEditingPos(null)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de compra</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio de compra</label><input type="number" step="any" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total Invertido (€)</label><input type="number" step="any" value={editInvested} onChange={(e) => setEditInvested(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500" /></div>
              </div>
              <button onClick={handleConfirmEdit} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
