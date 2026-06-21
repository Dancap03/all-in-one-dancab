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
      
      {/* ======================= TARJETA GLOBAL ======================= */}
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

      {/* ======================= TARJETA BOLSA ======================= */}
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

      {/* ======================= TARJETA PROYECTOS ======================= */}
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

      {/* ================================================================
          MODALES ADAPTADOS A MÓVIL Y ESCRITORIO
      ================================================================ */}
      
      {activeModal === 'global' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-
