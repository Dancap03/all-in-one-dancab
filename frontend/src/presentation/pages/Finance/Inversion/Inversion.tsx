import { Calendar } from 'lucide-react';
import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';

export const Inversion = () => {
  return (
    <div className="w-full text-white space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* TARJETAS INTERACTIVAS CON FLUJO DE DISPONIBLES */}
      <InvestmentSummaryCards />

      {/* TÍTULO DEL HISTORIAL */}
      <div className="flex items-center justify-between pt-4 px-1">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          <h2 className="text-base font-black tracking-wide text-gray-200 uppercase tracking-widest">Historial de Capital Invertido</h2>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('aio_total_invertido_diadia_v2');
            localStorage.removeItem('aio_inversion_movimientos_v2');
            localStorage.removeItem('aio_inv_bolsa_disponible');
            localStorage.removeItem('aio_inv_bolsa_invertido');
            localStorage.removeItem('aio_inv_bolsa_ganancias');
            localStorage.removeItem('aio_inv_proyecto_disponible');
            localStorage.removeItem('aio_inv_proyecto_invertido');
            localStorage.removeItem('aio_inv_proyecto_ganado');
            window.location.reload();
          }}
          className="text-[10px] text-gray-600 hover:text-red-400 transition-colors font-bold cursor-pointer"
        >
          Limpiar todos los saldos de prueba
        </button>
      </div>

      {/* HISTORIAL POR BLOQUES SEPARADOS */}
      <InvestmentHistory />

    </div>
  );
};
