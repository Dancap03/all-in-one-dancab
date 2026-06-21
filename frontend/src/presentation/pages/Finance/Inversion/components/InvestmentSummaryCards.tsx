import { useState } from 'react';
import { Globe, BarChart3, Briefcase, ArrowRightLeft, Plus, ChevronRight, X } from 'lucide-react';

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

  const cerrarModal = () => { 
    setActiveModal(null); 
    setInputAmount1(''); 
    setInputAmount2(''); 
    setSelectType('propio'); 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl overflow-hidden flex flex-col shadow-sm group transition-all hover:border-[#3d3d3d]">
        <button onClick={() => onNavigate('global')} className="p-5 text-left w-full hover:bg-[#1a1a1c] transition-colors cursor-pointer flex-1 outline-none">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Globe size={20} /></div>
              <h3 className="font-bold text-white tracking-tight text-lg">Balance Global</h3>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Disponible</p>
              <p className="text-xl font-black text-white truncate">{disponibleGlobal.toLocaleString('es-ES')} €</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Invertido</p>
              <p className="text-xl font-black text-gray-400 truncate">{totalInvertido.toLocaleString('es-ES')} €</p>
            </div>
          </div>
        </button>

        <div className="p-4 border-t border-[#2d2d2d] bg-[#161618]">
          <button onClick={() => setActiveModal('global')} className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-3.5 rounded-xl text-sm font-bold transition-colors cursor-pointer outline-none">
            <ArrowRightLeft size={16} /> Enviar Capital
          </button>
        </div>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl overflow-hidden flex flex-col shadow-sm group transition-all hover:border-[#3d3d3d]">
        <button onClick={() => onNavigate('bolsa')} className="p-5 text-left w-full hover:bg-[#1a1a1c] transition-colors cursor-pointer flex-1 outline-none">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="p-2 bg-blue-500/10 rounded-lg"><BarChart3 size={20} /></div>
              <h3 className="font-bold text-white tracking-tight text-lg">Bolsa</h3>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          </div>
          
          <div className="mb-4 inline-block bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-md text-[11px] font-black tracking-widest uppercase">
            +{bolsaGanancias.toLocaleString('es-ES')} € Premios
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Disponible</p>
              <p className="text-xl font-black text-white truncate">{bolsaDisponible.toLocaleString('es-ES')} €</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Propio</p>
              <p className="text-xl font-black text-gray-400 truncate">{bolsaInvertido.toLocaleString('es-ES')} €</p>
            </div>
          </div>
        </button>

        <div className="p-4 border-t border-[#2d2d2d] bg-[#161618]">
          <button onClick={() => setActiveModal('bolsa')} className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-3.5 rounded-xl text-sm font-bold transition-colors cursor-pointer outline-none">
            <Plus size={16} /> Gestionar Bolsa
          </button>
        </div>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl overflow-hidden flex flex-col shadow-sm group transition-all hover:border-[#3d3d3d]">
        <button onClick={() => onNavigate('proyecto')} className="p-5 text-left w-full hover:bg-[#1a1a1c] transition-colors cursor-pointer flex-1 outline-none">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Briefcase size={20} /></div>
              <h3 className="font-bold text-white tracking-tight text-lg">Proyectos</h3>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          </div>
          
          <div className="mb-4 inline-block bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-md text-[11px] font-black tracking-widest uppercase">
            +{proyectoGanado.toLocaleString('es-ES')} € Ganado
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Disponible</p>
              <p className="text-xl font-black text-white truncate">{proyectoDisponible.toLocaleString('es-ES')} €</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Activo</p>
              <p className="text-xl font-black text-gray-400 truncate">{proyectoInvertido.toLocaleString('es-ES')} €</p>
            </div>
          </div>
        </button>

        <div className="p-4 border-t border-[#2d2d2d] bg-[#161618]">
          <button onClick={() => setActiveModal('proyecto')} className="w-full flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-3.5 rounded-xl text-sm font-bold transition-colors cursor-pointer outline-none">
            <Plus size={16} /> Registro Comercial
          </button>
        </div>
      </div>
      
      {activeModal === 'global' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <h3 className="text-base font-bold text-white tracking-tight">Distribuir Capital Propio</h3>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Monto a mover</label>
                <input type="number" placeholder="Ej: 500" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Selecciona el destino</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => handleGlobal('bolsa')} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer">A Bolsa</button>
                  <button onClick={() => handleGlobal('proyecto')} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer">A Proyectos</button>
                  <button onClick={() => handleGlobal('diadia')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer">A Día a Día</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'bolsa' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <h3 className="text-base font-bold text-white tracking-tight">Gestionar Bolsa</h3>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tipo de operación</label>
                <select value={selectType} onChange={(e) => setSelectType(e.target.value as any)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-blue-500 transition-colors appearance-none">
                  <option value="propio">Invertir desde mi Disponible</option>
                  <option value="ganancia">Cobrar Dividendos / Premios</option>
                  <option value="diadia">Pasar Disponible a Balance Global</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Importe de la operación</label>
                <input type="number" placeholder="Ej: 150" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
              <button onClick={handleBolsa} className="w-full bg-blue-600 hover:bg-blue-500 text-base font-bold py-3.5 rounded-xl text-white transition-colors cursor-pointer mt-2">
                Ejecutar Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'proyecto' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <h3 className="text-base font-bold text-white tracking-tight">Registro Comercial</h3>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-1 bg-[#1c1c1e] p-1.5 rounded-xl border border-[#2d2d2d]">
                <button onClick={() => setSelectType('propio')} className={`text-xs py-2 font-bold rounded-lg transition-colors ${selectType === 'propio' ? 'bg-[#2d2d2d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Comprar</button>
                <button onClick={() => setSelectType('ganancia')} className={`text-xs py-2 font-bold rounded-lg transition-colors ${selectType === 'ganancia' ? 'bg-[#2d2d2d] text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Vender</button>
                <button onClick={() => setSelectType('diadia')} className={`text-xs py-2 font-bold rounded-lg transition-colors ${selectType === 'diadia' ? 'bg-[#2d2d2d] text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Retirar</button>
              </div>

              {selectType === 'propio' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Coste de la compra</label>
                    <input type="number" placeholder="Ej: 50" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-purple-500 transition-colors" />
                  </div>
                  <button onClick={() => handleProyecto('comprar')} className="w-full bg-purple-600 hover:bg-purple-500 text-base font-bold py-3.5 rounded-xl text-white transition-colors cursor-pointer">
                    Invertir Capital
                  </button>
                </div>
              )}

              {selectType === 'ganancia' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Coste original del producto</label>
                    <input type="number" placeholder="Ej: 50" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Precio de venta final</label>
                    <input type="number" placeholder="Ej: 120" value={inputAmount2} onChange={(e) => setInputAmount2(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <button onClick={() => handleProyecto('vender')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-base font-bold py-3.5 rounded-xl text-white transition-colors cursor-pointer mt-2">
                    Completar Operación
                  </button>
                </div>
              )}

              {selectType === 'diadia' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Cantidad a retirar al Balance</label>
                    <input type="number" placeholder="Ej: 100" value={inputAmount1} onChange={(e) => setInputAmount1(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-purple-500 transition-colors" />
                  </div>
                  <button onClick={() => handleProyecto('diadia')} className="w-full bg-purple-600 hover:bg-purple-500 text-base font-bold py-3.5 rounded-xl text-white transition-colors cursor-pointer">
                    Pasar a Balance Global
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
