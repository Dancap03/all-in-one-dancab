import { ArrowLeft, BarChart3, TrendingUp, Award } from 'lucide-react';

interface BolsaDetailsProps {
  onBack: () => void;
}

export const BolsaDetails = ({ onBack }: BolsaDetailsProps) => {
  const bolsaDisponible = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
  const bolsaInvertido = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
  const bolsaGanancias = Number(localStorage.getItem('aio_inv_bolsa_ganancias') || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <BarChart3 className="text-blue-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Auditoría de Mercados y Bolsa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Líquido para Operar</span>
            <span className="text-xl font-black text-white">{bolsaDisponible.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Capital Colocado</span>
            <span className="text-xl font-black text-gray-400">{bolsaInvertido.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] p-4 rounded-xl border border-[#262628]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Rendimientos Obtenidos</span>
            <span className="text-xl font-black text-blue-400">+{bolsaGanancias.toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};
