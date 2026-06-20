import { useNavigate } from 'react-router-dom';
import { ChevronRight, Receipt, PiggyBank, TrendingUp, History } from 'lucide-react';

interface Props {
  liquidez: number;
  ahorro: number;
  inversion: number;
  totalMovimientos: number;
}

export const PatrimonioNavGrid = ({ liquidez, ahorro, inversion, totalMovimientos }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div onClick={() => navigate('/finance/diadia')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
        <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3"><Receipt size={16} /></div>
        <p className="text-gray-400 text-xs font-medium mb-1">Día a día</p>
        <p className="text-white font-bold text-xl mb-1">{liquidez.toLocaleString('es-ES')} €</p>
        <p className="text-gray-500 text-[10px]">Capital Operativo</p>
      </div>

      <div onClick={() => navigate('/finance/ahorro')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
        <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3"><PiggyBank size={16} /></div>
        <p className="text-gray-400 text-xs font-medium mb-1">Ahorro</p>
        <p className="text-white font-bold text-xl mb-1">{ahorro.toLocaleString('es-ES')} €</p>
        <p className="text-gray-500 text-[10px]">Fondo de reserva</p>
      </div>

      <div onClick={() => navigate('/finance/inversion')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
        <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3"><TrendingUp size={16} /></div>
        <p className="text-gray-400 text-xs font-medium mb-1">Inversión</p>
        <p className="text-white font-bold text-xl mb-1">{inversion.toLocaleString('es-ES')} €</p>
        <p className="text-gray-500 text-[10px]">Bolsa y Proyectos</p>
      </div>

      <div onClick={() => navigate('/finance/historial')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
        <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
        <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-400 mb-3"><History size={16} /></div>
        <p className="text-gray-400 text-xs font-medium mb-1">Historial</p>
        <p className="text-white font-bold text-xl mb-1">{totalMovimientos}</p>
        <p className="text-gray-500 text-[10px]">movimientos registrados</p>
      </div>
    </div>
  );
};
