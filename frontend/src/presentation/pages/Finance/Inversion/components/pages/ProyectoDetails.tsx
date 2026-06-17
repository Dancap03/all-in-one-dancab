import { useState } from 'react';
import { ArrowLeft, Briefcase, Plus } from 'lucide-react';

interface ProyectoDetailsProps {
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onEjecutarProyecto: (modo: 'comprar' | 'vender' | 'diadia', coste: number, venta?: number) => void;
  onBack: () => void;
}

export const ProyectoDetails = ({ proyectoDisponible, proyectoInvertido, proyectoGanado, onEjecutarProyecto, onBack }: ProyectoDetailsProps) => {
  const [tabModo, setTabModo] = useState<'comprar' | 'vender' | 'diadia'>('comprar');
  const [coste, setCoste] = useState('');
  const [venta, setVenta] = useState('');

  const handleEjecutar = () => {
    const costVal = Number(coste);
    const ventVal = Number(venta);

    if (tabModo === 'comprar') {
      if (!costVal || costVal <= 0) return alert('Introduce un coste de compra válido.');
      if (costVal > proyectoDisponible) return alert('No posees suficiente dinero líquido disponible para este proyecto.');
      onEjecutarProyecto('comprar', costVal);
    } else if (tabModo === 'vender') {
      if (!costVal || !ventVal || ventVal < costVal) return alert('Los datos comerciales no cuadran.');
      onEjecutarProyecto('vender', costVal, ventVal);
    } else if (tabModo === 'diadia') {
      if (!costVal || costVal <= 0 || costVal > proyectoDisponible) return alert('Cantidad superior al disponible.');
      onEjecutarProyecto('diadia', costVal);
    }

    setCoste('');
    setVenta('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <Briefcase className="text-purple-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Gestión Comercial de Proyectos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Caja Disponible</span>
            <span className="text-xl font-black text-white">{proyectoDisponible.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Inventario / Stock Activo</span>
            <span className="text-xl font-black text-gray-400">{proyectoInvertido.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Beneficio Neto Acumulado</span>
            <span className="text-xl font-black text-emerald-400">+{proyectoGanado.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#2d2d2d] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
            <div className="grid grid-cols-3 gap-2 bg-[#141416] p-1 rounded-lg border border-[#2d2d2d] w-full max-w-md">
              <button onClick={() => setTabModo('comprar')} className={`text-[10px] py-1.5 font-bold rounded cursor-pointer ${tabModo === 'comprar' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500'}`}>1. Comprar Artículo</button>
              <button onClick={() => setTabModo('vender')} className={`text-[10px] py-1.5 font-bold rounded cursor-pointer ${tabModo === 'vender' ? 'bg-[#2d2d2d] text-emerald-400' : 'text-gray-500'}`}>2. Liquidar Venta</button>
              <button onClick={() => setTabModo('diadia')} className={`text-[10px] py-1.5 font-bold rounded cursor-pointer ${tabModo === 'diadia' ? 'bg-[#2d2d2d] text-purple-400' : 'text-gray-500'}`}>3. A Día a Día</button>
            </div>
          </div>

          <div className="space-y-3">
            {tabModo === 'comprar' && (
              <input type="number" placeholder="Inversión/Coste de adquisición (€)" value={coste} onChange={(e) => setCoste(e.target.value)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500" />
            )}
            {tabModo === 'vender' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" placeholder="Coste original del artículo (€)" value={coste} onChange={(e) => setCoste(e.target.value)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
                <input type="number" placeholder="Precio final de venta (€)" value={venta} onChange={(e) => setVenta(e.target.value)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
              </div>
            )}
            {tabModo === 'diadia' && (
              <input type="number" placeholder="Cantidad a retirar a Día a Día (€)" value={coste} onChange={(e) => setCoste(e.target.value)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500" />
            )}
            <button onClick={handleEjecutar} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider cursor-pointer">Procesar Operación</button>
          </div>
        </div>
      </div>
    </div>
  );
};
