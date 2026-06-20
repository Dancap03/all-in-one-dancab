import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  modoFiltro: 'Total' | 'Año';
  setModoFiltro: (modo: 'Total' | 'Año') => void;
  yearSeleccionado: number;
  setYearSeleccionado: (year: number) => void;
}

export const PatrimonioHeader = ({ 
  modoFiltro, setModoFiltro, 
  yearSeleccionado, setYearSeleccionado 
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">Resumen<br/>financiero</h1>
      </div>
      
      <div className="flex bg-[#141416] border border-[#2d2d2d] rounded-xl p-1 w-fit items-center">
        <button 
          onClick={() => setModoFiltro('Total')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${modoFiltro === 'Total' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Total
        </button>
        
        <div className="relative flex items-center">
          <button 
            onClick={() => setModoFiltro('Año')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${modoFiltro === 'Año' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Año
            {modoFiltro === 'Año' && (
              <select 
                value={yearSeleccionado} 
                onChange={(e) => setYearSeleccionado(Number(e.target.value))} 
                className="bg-transparent text-white font-bold outline-none cursor-pointer appearance-none ml-1"
              >
                <option className="bg-[#141416]" value={2026}>2026</option>
                <option className="bg-[#141416]" value={2025}>2025</option>
                <option className="bg-[#141416]" value={2024}>2024</option>
              </select>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
