import { useState, useEffect } from 'react';
import { Globe, BarChart3, Briefcase, ArrowRightLeft, Plus, DollarSign, TrendingUp } from 'lucide-react';

export const InvestmentSummaryCards = () => {
  // ==========================================
  // 1. ESTADOS DE FLUJO DE CAJA (PERSISTENTES)
  // ==========================================
  const [disponibleGlobal, setDisponibleGlobal] = useState<number>(() => {
    return Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
  });

  const [bolsaDisponible, setBolsaDisponible] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
  });
  const [bolsaInvertido, setBolsaInvertido] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
  });
  const [bolsaGanancias, setBolsaGanancias] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_bolsa_ganancias') || 0);
  });

  const [proyectoDisponible, setProyectoDisponible] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
  });
  const [proyectoInvertido, setProyectoInvertido] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
  });
  const [proyectoGanado, setProyectoGanado] = useState<number>(() => {
    return Number(localStorage.getItem('aio_inv_proyecto_ganado') || 0);
  });

  // Modales de control internos
  const [activeModal, setActiveModal] = useState<'global' | 'bolsa' | 'proyecto' | null>(null);
  const [inputAmount1, setInputAmount1] = useState('');
  const [inputAmount2, setInputAmount2] = useState('');
  const [selectType, setSelectType] = useState('propio');

  // Sincronización constante con la base local
  useEffect(() => {
    const handleStorageChange = () => {
      setDisponibleGlobal(Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveStorage = (key: string, value: number) => {
    localStorage.setItem(key, value.toString());
  };

  // ==========================================
  // 🚀 INTERACCIONES Y ACCIONES DE LOS BOTONES
  // ==========================================
  
  // 1. Enviar dinero desde el Balance Global (Baja el Disponible Global)
  const handleTransferenciaGlobal = (destino: 'bolsa' | 'proyecto') => {
    const qty = Number(inputAmount1);
    if (!qty || qty <= 0 || qty > disponibleGlobal) return alert("Cantidad no válida o insuficiente en Disponible Global.");

    const nuevoGlobal = disponibleGlobal - qty;
    setDisponibleGlobal(nuevoGlobal);
    saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);

    if (destino === 'bolsa') {
      const v = bolsaDisponible + qty; setBolsaDisponible(v); saveStorage('aio_inv_bolsa_disponible', v);
    } else {
      const v = proyectoDisponible + qty; setProyectoDisponible(v); saveStorage('aio_inv_proyecto_disponible', v);
    }
    cerrarModal();
  };

  // 2. Gestionar Capital de Bolsa (Invertir disponible / Registrar dividendos)
  const handleAccionBolsa = () => {
    const qty = Number(inputAmount1);
    if (!qty || qty <= 0) return;

    if (selectType === 'propio') {
      // Pasamos dinero propio del Disponible de bolsa al Invertido Real
      if (qty > bolsaDisponible) return alert("No tienes tanto dinero disponible en tu cuenta de Bolsa.");
      const nDisp = bolsaDisponible - qty; setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      const nInv = bolsaInvertido + qty; setBolsaInvertido(nInv); saveStorage('aio_inv_bolsa_invertido', nInv);
    } else {
      // Son ganancias externas (Dividendos / Recompensas) -> Suman a ganancias y aumentan tu disponible para operar
      const nGan = bolsaGanancias + qty; setBolsaGanancias(nGan); saveStorage('aio_inv_bolsa_ganancias', nGan);
      const nDisp = bolsaDisponible + qty; setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
    }
    cerrarModal();
  };

  // 3. Gestionar Proyectos (Invertir en artículo / Registrar venta con ganancias)
  const handleAccionProyecto = (modo: 'comprar' | 'vender') => {
    const coste = Number(inputAmount1);
    const venta = Number(inputAmount2);

    if (modo === 'comprar') {
      if (!coste || coste <= 0 || coste > proyectoDisponible) return alert("Importe superior a tu disponible de proyectos.");
      const nDisp = proyectoDisponible - coste; setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = proyectoInvertido + coste; setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
    } else {
      // Caso exacto de tu ejemplo: Coste 20€, Venta 25€ -> Ganancia 5€, Disponible +25€
      if (!coste || !venta || venta < coste) return alert("Los datos de venta o costos no cuadran.");
      
      const gananciaEfectiva = venta - coste;
      const nGan = proyectoGanado + gananciaEfectiva; setProyectoGanado(nGan); saveStorage('aio_inv_proyecto_ganado', nGan);
      const nDisp = proyectoDisponible + venta; setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
    }
    cerrarModal();
  };

  const cerrarModal = () => { setActiveModal(null); setInputAmount1(''); setInputAmount2(''); setSelectType('propio'); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ================= BLOQUE 1: BALANCE GLOBAL ================= */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div>
            <div className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Globe size={13} /> Balance Global
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Disponible</span>
                <span className="text-base font-black text-white">{disponibleGlobal.toLocaleString('es-ES')} €</span>
              </div>
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Total Invertido</span>
                <span className="text-base font-black text-gray-400">{(bolsaInvertido + proyectoInvertido).toLocaleString('es-ES')} €</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveModal('global')} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#1b1b1d] hover:bg-[#222224] border border-[#2d2d2d] text-xs font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer text-emerald-400">
            <ArrowRightLeft size={13} /> Enviar Capital
          </button>
        </div>

        {/* ================= BLOQUE 2: INVERSIÓN EN BOLSA ================= */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div>
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5"><BarChart3 size={13} /> Inversión en Bolsa</span>
              <span className="text-[10px] text-blue-500/80 font-black">+{bolsaGanancias.toLocaleString('es-ES')} € Premios</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Disponible</span>
                <span className="text-base font-black text-white">{bolsaDisponible.toLocaleString('es-ES')} €</span>
              </div>
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Invertido Propio</span>
                <span className="text-base font-black text-gray-400">{bolsaInvertido.toLocaleString('es-ES')} €</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveModal('bolsa')} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#1b1b1d] hover:bg-[#222224] border border-[#2d2d2d] text-xs font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer text-blue-400">
            <Plus size={13} /> Gestionar Bolsa
          </button>
        </div>

        {/* ================= BLOQUE 3: PROYECTOS PERSONALES ================= */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div>
            <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5"><Briefcase size={13} /> Proyectos Propios</span>
              <span className="text-[10px] text-emerald-400 font-black">+{proyectoGanado.toLocaleString('es-ES')} € Ganado</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Disponible</span>
                <span className="text-base font-black text-white">{proyectoDisponible.toLocaleString('es-ES')} €</span>
              </div>
              <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Invertido Activo</span>
                <span className="text-base font-black text-gray-400">{proyectoInvertido.toLocaleString('es-ES')} €</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveModal('proyecto')} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#1b1b1d] hover:bg-[#222224] border border-[#2d2d2d] text-xs font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer text-purple-400">
            <Plus size={13} /> Registrar Movimiento
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 🛠️ POPUPS FLOTANTES DE ACCIÓN INTERACTIVA (ESTILO NATIVO) */}
      // =========================================================
      {activeModal === 'global' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-1"><ArrowRightLeft size={12}/> Distribuir Capital Propio</h3>
            <div className="space-y-3">
              <input type="number" placeholder="Cantidad en €" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleTransferenciaGlobal('bolsa')} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">A Bolsa</button>
                <button onClick={() => handleTransferenciaGlobal('proyecto')} className="bg-purple-600 hover:bg-purple-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">A Proyecto</button>
              </div>
              <button onClick={cerrarModal} className="w-full text-center text-[11px] text-gray-500 hover:text-white pt-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'bolsa' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-1"><Plus size={12}/> Gestionar Capital de Bolsa</h3>
            <div className="space-y-3">
              <select value={selectType} onChange={(e) => setSelectType(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-2 py-2 text-xs text-white outline-none">
                <option value="propio">Invertir desde mi Disponible</option>
                <option value="ganancia">Cobrar Dividendos / Premios</option>
              </select>
              <input type="number" placeholder="Importe en €" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <button onClick={handleAccionBolsa} className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">Ejecutar Orden</button>
              <button onClick={cerrarModal} className="w-full text-center text-[11px] text-gray-500 hover:text-white pt-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'proyecto' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-1"><Plus size={12}/> Registro de Operación Comercial</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#2d2d2d]">
                <button onClick={() => setSelectType('propio')} className={`text-[10px] py-1 font-bold rounded ${selectType === 'propio' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500'}`}>1. Comprar Stock</button>
                <button onClick={() => setSelectType('ganancia')} className={`text-[10px] py-1 font-bold rounded ${selectType === 'ganancia' ? 'bg-[#2d2d2d] text-[#10b981]' : 'text-gray-500'}`}>2. Completar Venta</button>
              </div>

              {selectType === 'propio' ? (
                <>
                  <input type="number" placeholder="Coste de compra (€)" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
                  <button onClick={() => handleAccionProyecto('comprar')} className="w-full bg-purple-600 hover:bg-purple-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">Retirar de Disponible e Invertir</button>
                </>
              ) : (
                <>
                  <input type="number" placeholder="¿Cuánto te costó originalmente?" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                  <input type="number" placeholder="¿A cuánto lo has vendido?" value={inputAmount2} onChange={(e) => setInputAmount2(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                  <button onClick={() => handleAccionProyecto('vender')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">Registrar Venta (+ Revertir Capital)</button>
                </>
              )}
              <button onClick={cerrarModal} className="w-full text-center text-[11px] text-gray-500 hover:text-white pt-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
