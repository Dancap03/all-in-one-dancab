import { ArrowLeft, Plus, Code, RefreshCw, MoreVertical } from 'lucide-react';

interface ProyectoDetailsProps {
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onEjecutarProyecto: (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => Promise<void> | any;
  onBack: () => void;
}

export const ProyectoDetails = ({
  proyectoInvertido,
  proyectoGanado,
  onBack
}: ProyectoDetailsProps) => {

  // Cálculos reales para las tarjetas superiores
  const ingresosTotales = proyectoInvertido + Math.max(0, proyectoGanado);
  const roiMedio = proyectoInvertido > 0 ? (proyectoGanado / proyectoInvertido) * 100 : 0;

  return (
    <div className="w-full mx-auto pb-12 animate-in fade-in duration-300 relative">
      
      {/* 🚀 CABECERA (Solo con el botón de Nuevo Proyecto, sin Filtros) */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Proyectos personales</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Finanzas › Inversión › Proyectos</p>
          </div>
        </div>
        
        <button className="bg-[#f59e0b] hover:bg-[#ca8a04] text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/10">
          <Plus size={18} strokeWidth={3} /> Nuevo proyecto
        </button>
      </div>

      {/* 📊 TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Beneficio Neto */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Beneficio neto total</p>
          <div>
            <p className={`text-2xl font-black ${proyectoGanado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {proyectoGanado >= 0 ? '+' : ''}{proyectoGanado.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">entre todos los proyectos</p>
          </div>
        </div>

        {/* Capital Invertido */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Capital invertido</p>
          <div>
            <p className="text-2xl font-black text-white">
              {proyectoInvertido.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">coste base acumulado</p>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Ingresos totales</p>
          <div>
            <p className="text-2xl font-black text-teal-400">
              {ingresosTotales.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">ventas + licencias</p>
          </div>
        </div>

        {/* ROI Medio */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">ROI medio</p>
          <div>
            <p className={`text-2xl font-black ${roiMedio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">proyectos activos</p>
          </div>
        </div>
      </div>

      {/* 🚀 CUADRÍCULA DE PROYECTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TARJETA 1: PLUGIN NOTION */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-5 hover:border-[#3d3d3d] transition-colors group cursor-pointer">
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Code size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight mb-2">Plugin Notion ·<br/>Licencias</h3>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">software</span>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">licencias</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                <Plus size={14} /> Ingreso
              </button>
              <button className="px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
                <div className="w-3 h-[2px] bg-rose-400 rounded-full"></div> Gasto
              </button>
              <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Gráfico estético placeholder */}
          <div className="w-full h-16 mb-6">
            <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradNotion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 80 Q 100 75, 200 60 T 400 20 L 400 100 L 0 100 Z" fill="url(#gradNotion)" />
              <path d="M0 80 Q 100 75, 200 60 T 400 20" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1">Capital</p>
              <p className="text-sm font-black text-white">120 €</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1">Ingresos acum.</p>
              <p className="text-sm font-black text-teal-400">680 €</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1">Beneficio neto</p>
              <p className="text-sm font-black text-emerald-400">+560 €</p>
            </div>
          </div>

          <div className="w-full h-1 bg-[#2d2d2d] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-400 w-[85%] rounded-full"></div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
            <p>43 licencias · Gumroad + Lemon</p>
            <p className="text-emerald-400 font-bold">+467% ROI</p>
          </div>
        </div>

        {/* TARJETA 2: COMPRAVENTA ARTÍCULOS */}
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-5 hover:border-[#3d3d3d] transition-colors group cursor-pointer">
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight mb-2">Compraventa<br/>artículos</h3>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">compraventa</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                <Plus size={14} /> Venta
              </button>
              <button className="px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
                <div className="w-3 h-[2px] bg-rose-400 rounded-full"></div> Compra
              </button>
              <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Gráfico de barras estético placeholder */}
          <div className="w-full h-16 mb-6 flex items-end gap-2 px-2">
            <div className="w-1/4 bg-emerald-500 h-[30%] rounded-t-sm opacity-50"></div>
            <div className="w-1/4 bg-emerald-500 h-[40%] rounded-t-sm opacity-60"></div>
            <div className="w-1/4 bg-emerald-500 h-[80%] rounded-t-sm opacity-80"></div>
            <div className="w-1/4 bg-emerald-500 h-[50%] rounded-t-sm opacity-70"></div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
              <p className="text-[11px] font-bold text-gray-500 mb-1">Compras</p>
              <p className="text-sm font-black text-rose-400">-920 €</p>
            </div>
            <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
              <p className="text-[11px] font-bold text-gray-500 mb-1">Ventas</p>
              <p className="text-sm font-black text-teal-400">+1.180 €</p>
            </div>
            <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
              <p className="text-[11px] font-bold text-gray-500 mb-1">Stock activo</p>
              <p className="text-sm font-black text-amber-500">3 art.</p>
            </div>
          </div>

          <div className="w-full h-1 bg-[#2d2d2d] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-400 w-[60%] rounded-full"></div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
            <p>15 vendidos · 3 en stock</p>
            <p className="text-emerald-400 font-bold">+28% margen medio</p>
          </div>
        </div>

      </div>
    </div>
  );
};
