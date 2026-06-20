import { usePatrimonio } from './hooks/usePatrimonio';
import { PatrimonioHeader } from './components/PatrimonioHeader';
import { PatrimonioSummaryCard } from './components/PatrimonioSummaryCard';
import { PatrimonioNavGrid } from './components/PatrimonioNavGrid';
import { PatrimonioChart } from './components/PatrimonioChart';

export const Patrimonio = () => {
  const {
    modoFiltro, setModoFiltro,
    yearSeleccionado, setYearSeleccionado,
    mesSeleccionado, setMesSeleccionado,
    patrimonioTotal, liquidez, ahorro, inversion,
    datosGrafica, totalMovimientos
  } = usePatrimonio();

  return (
    <div className="w-full text-white space-y-6 animate-in fade-in duration-300 pb-12">
      
      <PatrimonioHeader 
        modoFiltro={modoFiltro} 
        setModoFiltro={setModoFiltro} 
        yearSeleccionado={yearSeleccionado} 
        setYearSeleccionado={setYearSeleccionado} 
        mesSeleccionado={mesSeleccionado} 
        setMesSeleccionado={setMesSeleccionado} 
      />

      <PatrimonioSummaryCard 
        patrimonioTotal={patrimonioTotal} 
        liquidez={liquidez} 
        ahorro={ahorro} 
        inversion={inversion} 
      />

      <PatrimonioNavGrid 
        liquidez={liquidez} 
        ahorro={ahorro} 
        inversion={inversion} 
        totalMovimientos={totalMovimientos} 
      />

      <PatrimonioChart 
        datosGrafica={datosGrafica} 
      />

    </div>
  );
};
