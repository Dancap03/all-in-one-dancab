import { useState } from 'react';
import { Globe, BarChart3, Briefcase, ArrowRightLeft, Plus } from 'lucide-react';

interface InvestmentSummaryCardsProps {
  disponibleGlobal: number;
  totalInvertido: number;
  bolsaDisponible: number;
  bolsaInvertido: number;
  bolsaGanancias: number;
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onTransferirGlobal: (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => void;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => void;
  onEjecutarProyecto: (modo: 'comprar' | 'vender' | 'diadia', coste: number, venta?: number) => void;
  onNavigate: (page: 'global' | 'bolsa' | 'proyecto') => void;
}

export const InvestmentSummaryCards = ({
  disponibleGlobal, totalInvertido, bolsaDisponible, bolsaInvertido, bolsaGanancias,
  proyectoDisponible, proyectoInvertido, proyectoGanado, onTransferirGlobal, onEjecutarBolsa, onEjecutarProyecto, onNavigate
}: InvestmentSummaryCardsProps) => {
  const [activeModal, setActiveModal] = useState<'global' | 'bolsa' | 'proyecto' | null>(null);
  const [inputAmount1, setInputAmount1] = useState('');
  const [inputAmount2, setInputAmount2] = useState('');
  const [selectType, setSelectType] = useState<'propio' | 'ganancia' | 'diadia'>('propio');

  const handleGlobal = (destino: 'bolsa' | 'proyecto' | 'diadia') => {
    const val = Number(inputAmount1);
    if (!val || val <= 0) return;
    if (destino !== 'diadia' && val > disponibleGlobal) return alert('Saldo insuficiente.');
    onTransferirGlobal(val, destino);
    cerrarModal();
  };

  const handleBolsa = () => {
    const val = Number(inputAmount1);
    if (!val || val <= 0) return;
    if ((selectType === 'propio' || selectType === 'diadia') && val > bolsaDisponible) return alert('Saldo disponible insuficiente.');
    onEjecutarBolsa(val, selectType);
    cerrarModal();
  };

  const handleProyecto = (modo: 'comprar' | 'vender' | 'diadia') => {
    const cost = Number(inputAmount1);
    const vent = Number(inputAmount2);
    if (modo === 'comprar') {
      if (!cost || cost <= 0 || cost > proyectoDisponible) return alert('Saldo insuficiente.');
      onEjecutarProyecto('comprar', cost);
    } else if (modo === 'vender') {
      if (!cost || !vent || vent < cost) return alert('Datos erróneos.');
      onEjecutarProyecto('vender', cost, vent);
    } else if (modo === 'diadia') {
      if (!cost || cost <= 0 || cost > proyectoDisponible) return alert('Saldo insuficiente.');
      onEjecutarProyecto('diadia', cost);
    }
    cerrarModal();
  };

  const cerrarModal = () => { setActiveModal(null); setInputAmount1(''); setInputAmount2(''); setSelectType('propio'); };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div>
          <div onClick={() => onNavigate('global')} className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 cursor-pointer hover:text-white transition-colors">
            <Globe size={13} /> Balance Global
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Disponible</span>
              <span className="text-base font-black text-white">{disponibleGlobal.toLocaleString('es-ES')} €</span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Total Invertido</span>
              <span className="text-base font-black text-gray-400">{totalInvertido.toLocaleString('es-ES')} €</span>
            </div>
          </div>
        </div>
        <button onClick={() => setActiveModal('global')} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#1b1b1d] hover:bg-[#222224] border border-[#2d2d2d] text-xs font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer text-emerald-400">
          <ArrowRightLeft size={13} /> Enviar Capital
        </button>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div>
          <div onClick={() => onNavigate('bolsa')} className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center justify-between mb-3 cursor-pointer hover:text-white transition-colors">
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

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div>
          <div onClick={() => onNavigate('proyecto')} className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center justify-between mb-3 cursor-pointer hover:text-white transition-colors">
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

      {activeModal === 'global' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4">Distribuir Capital Propio</h3>
            <div className="space-y-3">
              <input type="number" placeholder="Cantidad en €" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => handleGlobal('bolsa')} className="bg-blue-600 hover:bg-blue-700 text-[10px] font-bold py-2 rounded text-white cursor-pointer">A Bolsa</button>
                <button onClick={() => handleGlobal('proyecto')} className="bg-purple-600 hover:bg-purple-700 text-[10px] font-bold py-2 rounded text-white cursor-pointer">A Proy</button>
                <button onClick={() => handleGlobal('diadia')} className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold py-2 rounded text-white cursor-pointer">A Día Día</button>
              </div>
              <button onClick={cerrarModal} className="w-full text-center text-[11px] text-gray-500 hover:text-white pt-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'bolsa' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4">Gestionar Capital de Bolsa</h3>
            <div className="space-y-3">
              <select value={selectType} onChange={(e) => setSelectType(e.target.value as any)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-2 py-2 text-xs text-white outline-none">
                <option value="propio">Invertir desde mi Disponible</option>
                <option value="ganancia">Cobrar Dividendos / Premios</option>
                <option value="diadia">Pasar Disponible a Día a Día</option>
              </select>
              <input type="number" placeholder="Importe en €" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <button onClick={handleBolsa} className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold py-2 text-white cursor-pointer">Ejecutar Orden</button>
              <button onClick={cerrarModal} className="w-full text-center text-[11px] text-gray-500 hover:text-white pt-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'proyecto' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-5 shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4">Registro Comercial</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2d2d2d]">
                <button onClick={() => setSelectType('propio')} className={`text-[9px] py-1 font-bold rounded ${selectType === 'propio' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500'}`}>Comprar</button>
                <button onClick={() => setSelectType('ganancia')} className={`text-[9px] py-1 font-bold rounded ${selectType === 'ganancia' ? 'bg-[#2d2d2d] text-[#10b981]' : 'text-gray-500'}`}>Vender</button>
                <button onClick={() => setSelectType('diadia')} className={`text-[9px] py-1 font-bold rounded ${selectType === 'diadia' ? 'bg-[#2d2d2d] text-purple-400' : 'text-gray-500'}`}>Al Día Día</button>
              </div>
              {selectType === 'propio' && (
                <>
                  <input type="number" placeholder="Coste de compra (€)" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white outline-none" />
                  <button onClick={() => handleProyecto('comprar')} className="w-full bg-purple-600 hover:bg-purple-700 text-xs font-bold py-2 text-white cursor-pointer">Invertir Capital</button>
                </>
              )}
              {selectType === 'ganancia' && (
                <>
                  <input type="number" placeholder="Coste original (€)" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                  <input type="number" placeholder="Precio de venta (€)" value={inputAmount2} onChange={(e) => setInputAmount2(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                  <button onClick={() => handleProyecto('vender')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2 text-white cursor-pointer">Completar Operación</button>
                </>
              )}
              {selectType === 'diadia' && (
                <>
                  <input type="number" placeholder="Cantidad a retirar (€)" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                  <button onClick={() => handleProyecto('diadia')} className="w-full bg-purple-600 hover:bg-purple-700 text-xs font-bold py-2 text-white cursor-pointer">Pasar a Día a Día</button>
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
