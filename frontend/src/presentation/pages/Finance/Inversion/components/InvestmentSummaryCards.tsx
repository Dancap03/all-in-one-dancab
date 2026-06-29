import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRightLeft, Trash2, X, ArrowRight } from 'lucide-react';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';

interface InvestmentSummaryCardsProps {
  disponibleGlobal: number;
  totalInvertido: number;
  bolsaDisponible: number;
  bolsaInvertido: number;
  bolsaGanancias: number;
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onTransferirGlobal: (monto: number, destino: string, concepto?: string) => Promise<void> | any;
  onEjecutarBolsa: any;
  onEjecutarProyecto: any;
  onNavigate: (view: 'global' | 'bolsa' | 'proyecto') => void;
}

export const InvestmentSummaryCards = ({
  disponibleGlobal,
  bolsaInvertido,
  bolsaGanancias,
  proyectoInvertido,
  proyectoGanado,
  onTransferirGlobal,
  onNavigate
}: InvestmentSummaryCardsProps) => {

  const [bolsaLiveValue, setBolsaLiveValue] = useState(0);
  const [bolsaCostePropio, setBolsaCostePropio] = useState(0);
  const [hasPositions, setHasPositions] = useState(false); 

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    const fetchBolsaLive = async () => {
      let posiciones = [];
      try {
        const local = JSON.parse(localStorage.getItem('aio_bolsa_posiciones_v2') || '[]');
        if (local.length > 0) {
          posiciones = local;
        } else {
          const user = auth.currentUser;
          if (user) {
            const snap = await getDoc(doc(db, `users/${user.uid}/investment_balances`, 'bolsa_posiciones'));
            if (snap.exists()) posiciones = snap.data().posiciones || [];
          }
        }
        
        if (posiciones.length > 0) {
          setHasPositions(true);
          let liveVal = 0;
          let costePropio = 0;

          posiciones.forEach((p: any) => {
            liveVal += (p.value || 0);
            if (!p.fundSource || p.fundSource === 'propio') {
              costePropio += (p.shares * p.avgPriceEur);
            }
          });

          setBolsaLiveValue(liveVal);
          setBolsaCostePropio(costePropio);
        } else {
          setHasPositions(false);
          setBolsaLiveValue(0);
          setBolsaCostePropio(0);
        }

        // 🚀 SCRIPT DE AUTO-CURACIÓN PARA RESCATAR TUS 1,69 € (Y SIMILARES)
        const user = auth.currentUser;
        if (user) {
          const txsSnap = await getDocs(collection(db, `users/${user.uid}/transactions`));
          
          for (const d of txsSnap.docs) {
            const data = d.data();
            
            // Busca cualquier envío antiguo al Día a Día que se haya atascado
            if (data.title === 'Ingreso de Inversión' || data.title === 'Retorno de Inversión' || data.description === 'Retorno de Inversión') {
              let needsUpdate = false;
              let updatePayload: any = {};

              // Reparar Fecha: Si se guardó como un texto "2026-...", Firebase no sabe ordenarlo. Lo pasamos a Objeto.
              if (typeof data.createdAt === 'string') {
                updatePayload.createdAt = new Date(data.createdAt);
                needsUpdate = true;
              }
              
              // Reparar Etiquetas: Nos aseguramos de que Día a Día lo entienda
              if (!data.type || data.type !== 'income') {
                updatePayload.type = 'income';
                updatePayload.tipo = 'ingreso';
                updatePayload.name = 'Retorno de Inversión';
                needsUpdate = true;
              }

              if (needsUpdate) {
                // Inyectamos la curación en la base de datos
                await setDoc(doc(db, `users/${user.uid}/transactions`, d.id), updatePayload, { merge: true });
              }
            }
          }
        }

      } catch (e) {
        console.error("Error en la sincronización o cálculo:", e);
      }
    };
    fetchBolsaLive();
  }, [bolsaInvertido, disponibleGlobal]);

  const handleBorrarFantasma = () => {
    if (disponibleGlobal > 0) {
      if (confirm(`¿Estás seguro de borrar los ${disponibleGlobal.toLocaleString('es-ES')} € de saldo fantasma?\n\nTu saldo disponible volverá a ser 0 €.`)) {
        onTransferirGlobal(disponibleGlobal, 'retirar', 'Ajuste: Borrado de saldo fantasma');
      }
    }
  };

  const handleConfirmWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (amount <= 0 || amount > disponibleGlobal) { return; }
    await onTransferirGlobal(amount, 'diadia', 'Retorno a Día a Día');
    setIsWithdrawModalOpen(false);
    setWithdrawAmount('');
  };

  const valorBolsa = bolsaLiveValue > 0 ? bolsaLiveValue : bolsaInvertido;
  const valorProyectos = proyectoInvertido; 
  const carteraTotal = disponibleGlobal + valorBolsa + valorProyectos;

  const costeBaseBolsa = hasPositions ? bolsaCostePropio : bolsaInvertido;
  const costeBaseTotal = costeBaseBolsa + proyectoInvertido;
  const beneficioFlotanteBolsa = valorBolsa - costeBaseBolsa;
  const gananciaNetaTotal = beneficioFlotanteBolsa + bolsaGanancias + proyectoGanado;
  
  const baseForRoi = costeBaseTotal > 0 ? costeBaseTotal : 1;
  const rentabilidadPct = (gananciaNetaTotal / baseForRoi) * 100;
  const isUp = gananciaNetaTotal >= 0;

  const totalCircle = carteraTotal > 0 ? carteraTotal : 1;
  const pctBolsa = (valorBolsa / totalCircle) * 100;
  const pctProyectos = (valorProyectos / totalCircle) * 100;
  const pctDisp = (disponibleGlobal / totalCircle) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
      
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-gray-400 font-bold text-sm mb-1">Cartera total</p>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
              {carteraTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h2>
            <div className={`flex items-center gap-1.5 font-bold text-sm ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp size={16} strokeWidth={2.5} className={!isUp ? 'transform rotate-180' : ''} />
              <span>{isUp ? '+' : ''}{rentabilidadPct.toFixed(2)}% · {isUp ? '+' : ''}{gananciaNetaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € desde el inicio</span>
            </div>
          </div>
        </div>

        <div className="w-full h-20 mb-6">
          <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isUp ? "#10b981" : "#f59e0b"} stopOpacity="0.2" /><stop offset="100%" stopColor={isUp ? "#10b981" : "#f59e0b"} stopOpacity="0" /></linearGradient>
            </defs>
            <path d="M0 80 Q 100 75, 200 60 T 400 20 L 400 100 L 0 100 Z" fill="url(#gradTotal)" />
            <path d="M0 80 Q 100 75, 200 60 T 400 20" fill="none" stroke={isUp ? "#10b981" : "#f59e0b"} strokeWidth="2.5" />
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => onNavigate('bolsa')} className="bg-[#1c1c1e] hover:bg-[#252528] transition-colors border border-[#2d2d2d] rounded-2xl p-4 text-left cursor-pointer"><p className="text-xs font-bold text-gray-500 mb-1">Bolsa</p><p className="text-lg font-black text-amber-500">{valorBolsa.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</p></button>
          <button onClick={() => onNavigate('proyecto')} className="bg-[#1c1c1e] hover:bg-[#252528] transition-colors border border-[#2d2d2d] rounded-2xl p-4 text-left cursor-pointer"><p className="text-xs font-bold text-gray-500 mb-1">Proyectos</p><p className="text-lg font-black text-teal-400">{valorProyectos.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</p></button>
          <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4"><p className="text-xs font-bold text-gray-500 mb-1">Rentab. total</p><p className={`text-lg font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{isUp ? '+' : ''}{rentabilidadPct.toFixed(2)}%</p></div>
        </div>
      </div>

      <div className="bg-[#141416] border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-amber-500 font-black text-sm mb-1">Saldo disponible para invertir</p>
          <h3 className="text-3xl font-black text-white mb-1">{disponibleGlobal.toLocaleString('es-ES')} €</h3>
          <p className="text-xs text-gray-500 font-medium">Dinero líquido · Listo para asignar o retirar</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {disponibleGlobal > 0 && (
            <button onClick={handleBorrarFantasma} title="Borrar saldo fantasma" className="border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white p-2.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"><Trash2 size={18} /></button>
          )}
          <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <ArrowRightLeft size={16} /> Gestionar Saldo
          </button>
        </div>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-6">
        <h3 className="text-lg font-black text-white mb-6">Distribución de cartera</h3>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#2d2d2d" strokeWidth="4" />
              {pctBolsa > 0 && <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${pctBolsa} ${100 - pctBolsa}`} strokeDashoffset="0" />}
              {pctProyectos > 0 && <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#2dd4bf" strokeWidth="4" strokeDasharray={`${pctProyectos} ${100 - pctProyectos}`} strokeDashoffset={`-${pctBolsa}`} />}
              {pctDisp > 0 && <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#4b5563" strokeWidth="4" strokeDasharray={`${pctDisp} ${100 - pctDisp}`} strokeDashoffset={`-${pctBolsa + pctProyectos}`} />}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-[10px] font-bold text-gray-500">TOTAL</span><span className="text-sm font-black text-white">{Math.round(carteraTotal)}</span></div>
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500"></div><span className="text-sm font-bold text-gray-300">Bolsa</span></div><span className="text-sm font-black text-white">{valorBolsa.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#2dd4bf]"></div><span className="text-sm font-bold text-gray-300">Proyectos</span></div><span className="text-sm font-black text-white">{valorProyectos.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-600"></div><span className="text-sm font-bold text-gray-500">Sin asignar</span></div><span className="text-sm font-black text-white">{disponibleGlobal.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span></div>
          </div>
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-white tracking-tight">Pasar a Día a Día</h3><p className="text-xs text-gray-500 mt-0.5">Dinero disponible: {disponibleGlobal.toLocaleString('es-ES')} €</p></div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto a retirar (€)</label>
                <input type="number" step="any" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-2xl font-black text-white outline-none focus:border-amber-500 text-center" autoFocus />
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setWithdrawAmount((disponibleGlobal * 0.5).toFixed(2))} className="px-3 py-1.5 bg-[#1c1c1e] border border-[#2d2d2d] rounded-lg text-xs font-bold text-gray-400 transition-colors cursor-pointer">50%</button>
                <button onClick={() => setWithdrawAmount(disponibleGlobal.toString())} className="px-3 py-1.5 bg-[#1c1c1e] border border-[#2d2d2d] rounded-lg text-xs font-bold text-gray-400 transition-colors cursor-pointer">MAX</button>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mt-4 flex items-start gap-3">
                <ArrowRight className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-400 leading-relaxed">Este dinero se registrará automáticamente como un <strong className="text-emerald-400">Ingreso de Inversión</strong> en tu saldo principal.</p>
              </div>
              <button onClick={handleConfirmWithdraw} disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > disponibleGlobal} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-2">Confirmar transferencia</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
