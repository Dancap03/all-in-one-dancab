import { ArrowLeft, Globe, TrendingUp, ShieldCheck } from 'lucide-react';

interface GlobalDetailsProps {
  onBack: () => void;
}

export const GlobalDetails = ({ onBack }: GlobalDetailsProps) => {
  const disponibleGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
  const bolsaInvertido = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
  const proyectoInvertido = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
  const totalInvertido = bolsaInvertido + proyectoInvertido;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <Globe className="text-emerald-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Desglose de Balance Global</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Fondo Disponible</span>
            <span className="text-xl font-black text-white">{disponibleGlobal.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Asignado a Activos</span>
            <span className="text-xl font-black text-gray-400">{totalInvertido.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Patrimonio Total</span>
            <span className="text-xl font-black text-emerald-400">{(disponibleGlobal + totalInvertido).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Distribución de Capital</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#1b1b1d] rounded-xl border border-[#2d2d2d]">
              <span className="text-sm font-bold text-gray-300">Mercados de Valores y Bolsa</span>
              <span className="text-sm font-black text-blue-400">{bolsaInvertido.toLocaleString('es-ES')} €</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1b1b1d] rounded-xl border border-[#2d2d2d]">
              <span className="text-sm font-bold text-gray-300">Proyectos de Emprendimiento</span>
              <span className="text-sm font-black text-purple-400">{proyectoInvertido.toLocaleString('es-ES')} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
