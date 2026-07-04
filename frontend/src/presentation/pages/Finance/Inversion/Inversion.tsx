import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';

export const Inversion = () => {
  const navigate = useNavigate();
  
  // Consumimos todo el estado y la función del hook
  const {
    currentView,
    setCurrentView,
    disponibleGlobal,
    totalInvertidoCalculado,
    bolsaInvertido,
    bolsaGanancias,
    proyectoInvertido,
    proyectoGanado,
    movimientos,
    loading,
    handleRecalcularTodo
  } = useInvestment();

  // Estados para el acordeón visual del histórico
  const [isAñoOpen, setIsAñoOpen] = useState(true);
  
  // 🚀 FLAG DE SEGURIDAD: Evita que el useEffect entre en un bucle infinito con el loading de Firestore
  const [hasHealed, setHasHealed] = useState(false);

  // Auto-heal controlado: Solo se ejecuta una vez cuando la carga inicial es correcta
  useEffect(() => {
    if (!loading && !hasHealed) {
      setHasHealed(true); // Bloqueamos ejecuciones posteriores inmediatas
      handleRecalcularTodo();
    }
  }, [loading, hasHealed, handleRecalcularTodo]);

  if (loading && !hasHealed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Cálculos dinámicos para pintar los balances de tu bolsillo
  const carteraTotal = disponibleGlobal + bolsaInvertido + proyectoInvertido;
  const gananciasTotales = bolsaGanancias + proyectoGanado;
  
  const capitalInyectadoTotal = bolsaInvertido + proyectoInvertido;
  const rentabilidadPorcentaje = capitalInyectadoTotal > 0 ? (gananciasTotales / capitalInyectadoTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white">Inversión</h1>
      </div>

      {/* 1. TARJETA MASTER: CARTERA TOTAL */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6 mb-6 relative overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cartera total</p>
        <h2 className="text-3xl font-black tracking-tight mb-2">{carteraTotal.toFixed(2)} €</h2>
        
        {/* Indicador de rentabilidad dinámico */}
        <div className={`flex items-center gap-1.5 text-xs font-bold ${rentabilidadPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
          {rentabilidadPorcentaje >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            {rentabilidadPorcentaje >= 0 ? '+' : ''}{rentabilidadPorcentaje.toFixed(2)}% · {rentabilidadPorcentaje >= 0 ? '+' : ''}{gananciasTotales.toFixed(2)} € desde el inicio
          </span>
        </div>

        {/* Minigráfico decorativo de fondo */}
        <div className="absolute right-6 top-6 bottom-6 w-1/3 opacity-20 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <path d="M 0 25 Q 25 22, 50 15 T 100 5" fill="none" stroke="#f59e0b" strokeWidth="2" />
          </svg>
        </div>

        {/* Desglose de sub-carteras internas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#232323]">
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-1">Bolsa</p>
            <p className="text-sm font-black text-amber-500">{bolsaInvertido.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-1">Proyectos</p>
            <p className="text-sm font-black text-emerald-400">{proyectoInvertido.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-1">Rentab. total</p>
            <p className={`text-sm font-black ${rentabilidadPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {rentabilidadPorcentaje >= 0 ? '+' : ''}{rentabilidadPorcentaje.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* 2. SALDO DISPONIBLE PARA INVERTIR */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Saldo disponible para invertir</p>
          <h3 className="text-2xl font-black text-white mb-1">{disponibleGlobal.toFixed(2)} €</h3>
          <p className="text-xs text-gray-500">Dinero líquido · Listo para asignar o retirar</p>
        </div>

        {/* Panel de control de acciones */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Botón de pánico/sincronización manual corregido */}
          <button 
            onClick={() => handleRecalcularTodo()}
            title="Forzar recalculo de balances"
            className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => setCurrentView('global')}
            className="px-5 py-3 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-600 transition-all border border-amber-600/30 cursor-pointer"
          >
            🔀 Gestionar Saldo
          </button>
        </div>
      </div>

      {/* 3. DISTRIBUCIÓN DE LA CARTERA */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6 mb-8">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Distribución de cartera</h4>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          
          {/* Donut Chart renderizado en CSS nativo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[12px] border-[#202020]"></div>
            <div className="absolute inset-0 rounded-full border-[12px] border-amber-500 clip-donut" style={{ transform: `rotate(${(disponibleGlobal / (carteraTotal || 1)) * 360}deg)` }}></div>
            <div className="flex flex-col items-center justify-center z-10">
              <span className="text-xs text-gray-400 uppercase font-bold text-[9px]">Total</span>
              <span className="text-md font-black">{Math.round(carteraTotal)}</span>
            </div>
          </div>

          {/* Leyenda indexada */}
          <div className="flex-1 w-full flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Bolsa</span>
              </div>
              <span className="font-bold">{bolsaInvertido.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Proyectos</span>
              </div>
              <span className="font-bold">{proyectoInvertido.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <span>Sin asignar</span>
              </div>
              <span className="font-bold">{disponibleGlobal.toFixed(2)} €</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. HISTORIAL DE CAPITAL INVERTIDO (ACORDEÓN REPLICADO) */}
      <div className="border-t border-[#232323] pt-6">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
          💼 Historial de Capital Invertido
        </h3>

        <div className="bg-[#141414] border border-[#232323] rounded-2xl overflow-hidden">
          <div 
            onClick={() => setIsAñoOpen(!isAñoOpen)}
            className="flex items-center justify-between p-4 bg-[#181818] border-b border-[#232323] cursor-pointer hover:bg-[#1f1f1f] transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {isAñoOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>📂 AÑO 2026</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{movimientos.length} ops.</span>
          </div>

          {isAñoOpen && (
            <div className="p-2 flex flex-col gap-1 bg-[#111111]">
              <div 
                onClick={() => navigate('/finance/inversion/mes/2026-07')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <span className="text-xs text-gray-300 font-semibold">🔹 Julio</span>
                <span className="text-xs text-gray-500">
                  {movimientos.filter(m => m.dateString?.includes('-07-')).length} movimientos
                </span>
              </div>
              <div 
                onClick={() => navigate('/finance/inversion/mes/2026-06')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <span className="text-xs text-gray-300 font-semibold">🔹 Junio</span>
                <span className="text-xs text-gray-500">
                  {movimientos.filter(m => m.dateString?.includes('-06-')).length} movimientos
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
