interface Props {
  modoFiltro: 'Total' | 'Año' | 'Mes';
  setModoFiltro: (modo: 'Total' | 'Año' | 'Mes') => void;
  yearSeleccionado: number;
  setYearSeleccionado: (year: number) => void;
  mesSeleccionado: number;
  setMesSeleccionado: (mes: number) => void;
}

export const PatrimonioHeader = ({ 
  modoFiltro, setModoFiltro, 
  yearSeleccionado, setYearSeleccionado, 
  mesSeleccionado, setMesSeleccionado 
}: Props) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <h1 className="text-3xl font-black tracking-tight text-white">Resumen<br/>financiero</h1>
      
      <div className="flex bg-[#141416] border border-[#2d2d2d] rounded-xl p-1 w-fit items-center">
        <button 
          onClick={() => setModoFiltro('Total')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${modoFiltro === 'Total' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Total
        </button>
        
        <div className="relative flex items-center">
          <button 
            onClick={() => setModoFiltro('Año')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${modoFiltro === 'Año' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Año
            {modoFiltro === 'Año' && (
              <select value={yearSeleccionado} onChange={(e) => setYearSeleccionado(Number(e.target.value))} className="bg-transparent text-white font-bold outline-none cursor-pointer appearance-none ml-1">
                <option className="bg-[#141416]" value={2026}>2026</option>
                <option className="bg-[#141416]" value={2025}>2025</option>
                <option className="bg-[#141416]" value={2024}>2024</option>
              </select>
            )}
          </button>
        </div>

        <div className="relative flex items-center">
          <button 
            onClick={() => setModoFiltro('Mes')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${modoFiltro === 'Mes' ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Mes
            {modoFiltro === 'Mes' && (
              <div className="flex items-center ml-1 bg-[#1a1a1c] px-2 py-0.5 rounded border border-[#3d3d3d]">
                 <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="bg-transparent text-white font-bold outline-none cursor-pointer appearance-none mr-2">
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                    <option className="bg-[#141416]" key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select value={yearSeleccionado} onChange={(e) => setYearSeleccionado(Number(e.target.value))} className="bg-transparent text-gray-400 font-medium outline-none cursor-pointer appearance-none">
                  <option className="bg-[#141416]" value={2026}>2026</option>
                  <option className="bg-[#141416]" value={2025}>2025</option>
                </select>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
