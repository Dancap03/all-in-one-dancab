import { ArrowLeft, Briefcase, TrendingUp, ShoppingCart } from 'lucide-react';

interface ProyectoDetailsProps {
  onBack: () => void;
}

export const ProyectoDetails = ({ onBack }: ProyectoDetailsProps) => {
  const proyectoDisponible = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
  const proyectoInvertido = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
  const proyectoGanado = Number(localStorage.getItem('aio_inv_proyecto_ganado') || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <Briefcase className="text-purple-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Métricas de Proyectos Propios</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Caja Disponible</span>
            <span className="text-xl font-black text-white">{proyectoDisponible.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Inventario / Costes Activos</span>
            <span className="text-xl font-black text-gray-400">{proyectoInvertido.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Margen Comercial Neto</span>
            <span className="text-xl font-black text-purple-400">+{proyectoGanado.toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};
