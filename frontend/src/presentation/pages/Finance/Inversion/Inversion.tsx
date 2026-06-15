import { useState } from 'react';
import { BarChart3, Briefcase, Globe } from 'lucide-react';

export const Inversion = () => {
  
  // 1. CARTERA DE BOLSA (Se mantiene reactiva por si añades posiciones en el futuro)
  const [allPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_positions_v2');
    return saved ? JSON.parse(saved) : []; 
  });

  // 2. PROYECTOS PERSONALES
  const [proyectosInvertido] = useState<number>(() => {
    const saved = localStorage.getItem('aio_proyectos_invertido_v2');
    return saved ? Number(saved) : 0;
  });

  const [proyectosGanado] = useState<number>(() => {
    const saved = localStorage.getItem('aio_proyectos_ganado_v2');
    return saved ? Number(saved) : 0;
  });

  // =======================================================================
  // 🚀 CÁLCULOS DINÁMICOS LIVE (Lectura directa sin pasar por useState)
  // =======================================================================
  // Al leerlo directamente aquí, cada vez que la pantalla se pinte, traerá el dato real de Día a Día
  const globalTotalInvertido = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

  const bolsaInvertidoPropio = allPositions.reduce((sum, p) => sum + p.total, 0);
  const bolsaGanancias = allPositions.reduce((sum, p) => sum + (p.plVal ? Number(p.plVal) : 0), 0);

  const globalTotalGanado = bolsaGanancias + proyectosGanado;

  return (
    <div className="w-full text-white animate-in fade-in duration-200">
      
      {/* REJILLA DE LOS 6 RECUADROS AUTOMATIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RECUADROS BLOQUE 1: TOTALES GLOBALES */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Globe size={13} className="text-emerald-400" />
            Balance Global
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Invertido</span>
              <span className="text-lg font-black text-white">
                {globalTotalInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5 font-medium italic">Desde Día a Día</span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Ganado</span>
              <span className="text-lg font-black text-[#10b981]">
                {globalTotalGanado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>

        {/* RECUADROS BLOQUE 2: INVERSIÓN EN BOLSAS */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={13} />
            Inversión en Bolsas
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Invertido Propio</span>
              <span className="text-lg font-black text-gray-200">
                {bolsaInvertidoPropio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mis Ganancias</span>
              <span className="text-lg font-black text-blue-400">
                {bolsaGanancias >= 0 ? '+' : ''}{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>

        {/* RECUADROS BLOQUE 3: PROYECTOS PERSONALES */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={13} />
            Proyectos Personales
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dinero Invertido</span>
              <span className="text-lg font-black text-gray-200">
                {proyectosInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lo que Gané</span>
              <span className="text-lg font-black text-purple-400">
                {proyectosGanado >= 0 ? '+' : ''}{proyectosGanado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
