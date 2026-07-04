import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, TrendingDown, TrendingUp, DollarSign, Plus, Percent, X } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';

export const Inversion = () => {
  const navigate = useNavigate();
  
  const {
    currentView,
    setCurrentView,
    disponibleGlobal,
    bolsaInvertido,
    bolsaGanancias,
    proyectoInvertido,
    proyectoGanado,
    movimientos,
    loading,
    handleRecalcularTodo,
    handleEjecutarBolsa
  } = useInvestment();

  const [isAñoOpen, setIsAñoOpen] = useState(true);
  const [hasHealed, setHasHealed] = useState(false);

  // Estados para el Modal interno de Bolsa
  const [isBolsaModalOpen, setIsBolsaModalOpen] = useState(false);
  const [bolsaModalType, setBolsaModalType] = useState<'propio' | 'ganancia' | 'vender'>('propio');
  const [bolsaMonto, setBolsaMonto] = useState('');
  const [bolsaCosteOriginal, setBolsaCosteOriginal] = useState('');

  // Auto-heal controlado de un solo impacto al montar la pantalla
  useEffect(() => {
    if (!loading && !hasHealed) {
      setHasHealed(true);
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

  // Métricas unificadas dinámicas
  const totalValorBolsa = bolsaInvertido + bolsaGanancias; 
  const carteraTotal = disponibleGlobal + totalValorBolsa + proyectoInvertido;
  const gananciasTotales = bolsaGanancias + proyectoGanado;
  
  const capitalInyectadoTotal = bolsaInvertido + proyectoInvertido;
  const rentabilidadPorcentaje = capitalInyectadoTotal > 0 ? (gananciasTotales / capitalInyectadoTotal) * 100 : 0;

  // Manejador del formulario express de Bolsa
  const handleConfirmarBolsa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bolsaMonto) return;

    const montoNum = Number(bolsaMonto);
    const costeNum = bolsaModalType === 'vender' ? Number(bolsaCosteOriginal || 0) : undefined;

    await handleEjecutarBolsa(montoNum, bolsaModalType, costeNum);
    
    setIsBolsaModalOpen(false);
    setBolsaMonto('');
    setBolsaCosteOriginal('');
  };

  // Abrir modal configurando su tipo
  const openBolsaAction = (type: 'propio' | 'ganancia' | 'vender') => {
    setBolsaModalType(type);
    setBolsaMonto('');
    setBolsaCosteOriginal('');
    setIsBolsaModalOpen(true);
  };

  // 🚀 VISTA COMPLETADA: DETALLE DE BOLSA CON BOTONES, TARJETAS E HISTORIAL FILTRADO
  if (currentView === 'bolsa') {
    // Filtramos las operaciones del feed que pertenezcan a Bolsa o Dividendos
    const bolsaOps = movimientos.filter(m => 
      String(m.label).toLowerCase().includes('bolsa') || 
      String(m.label).toLowerCase().includes('dividendo')
    );

    const bolsaRoi = bolsaInvertido > 0 ? (bolsaGanancias / bolsaInvertido) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
        {/* Cabecera del módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('summary')} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Módulo de Bolsa</h1>
          </div>
          
          {/* Botones de acción dinámicos para Bolsa */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => openBolsaAction('propio')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#451a03] text-amber-400 border border-amber-500/20 hover:bg-[#78350f] transition-all cursor-pointer">
              <Plus size={14} /> Comprar Acciones
            </button>
            <button onClick={() => openBolsaAction('vender')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#052e16] text-emerald-400 border border-emerald-500/20 hover:bg-[#064e3b] transition-all cursor-pointer">
              <DollarSign size={14} /> Registrar Venta
            </button>
            <button onClick={() => openBolsaAction('ganancia')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1e1b4b] text-indigo-400 border border-indigo-500/20 hover:bg-[#312e81] transition-all cursor-pointer">
              <Percent size={14} /> Cobrar Dividendo
            </button>
          </div>
        </div>
        
        {/* Fila de Tarjetas Maestras de Bolsa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#141414] border border-[#232323] p-5 rounded-2xl">
            <p className="text-xs font-semibold text-gray-400 mb-1">Cartera Bolsa Total</p>
            <p className="text-2xl font-black text-white">{totalValorBolsa.toFixed(2)} €</p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp size={12} /> +{bolsaGanancias.toFixed(2)} € (+{bolsaRoi.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-[#141414] border border-[#232323] p-5 rounded-2xl">
            <p className="text-xs font-semibold text-gray-400 mb-1">Capital Invertido (Coste)</p>
            <p className="text-2xl font-black text-amber-500">{bolsaInvertido.toFixed(2)} €</p>
            <p className="text-[11px] text-gray-500 mt-1">Fondos asignados de mi bolsillo</p>
          </div>
          <div className="bg-[#141414] border border-[#232323] p-5 rounded-2xl">
            <p className="text-xs font-semibold text-gray-400 mb-1">Plusvalías + Dividendos</p>
            <p className="text-2xl font-black text-indigo-400">+{bolsaGanancias.toFixed(2)} €</p>
            <p className="text-[11px] text-gray-500 mt-1">Rendimiento neto acumulado</p>
          </div>
        </div>

        {/* Feed de Operaciones Exclusivo de Bolsa */}
        <div className="bg-[#141414] border border-[#232323] rounded-2xl p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">📋 Histórico de Operaciones - Bolsa</h3>
          <div className="flex flex-col gap-2">
            {bolsaOps.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No hay transacciones de Bolsa registradas en el historial.</p>
            ) : (
              bolsaOps.map((op) => {
                const esIngreso = Number(op.amount) >= 0;
                return (
                  <div key={op.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#1a1a1a] border border-[#262626]">
                    <div>
                      <p className="text-xs font-bold text-gray-200">{op.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{op.dateString || 'Fecha no registrada'}</p>
                    </div>
                    <span className={`text-xs font-black ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {esIngreso ? '+' : ''}{op.amount.toFixed(2)} €
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA RESTAURADA 2: PROYECTOS PERSONALES ORIGINAL
  if (currentView === 'proyecto') {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos personales</h1>
            <p className="text-xs text-amber-500 font-medium mt-0.5">Dinero disponible: {disponibleGlobal.toFixed(2)} €</p>
          </div>
          <button onClick={() => setCurrentView('summary')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1f1f1f] text-gray-300 hover:text-white transition-all border border-[#2d2d2d] cursor-pointer self-start">
            <ArrowLeft size={14} /> Volver al panel
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#141414] border border-[#232323] p-4 rounded-xl">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Beneficio neto total</p>
            <p className={`text-md font-bold ${proyectoGanado >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {proyectoGanado >= 0 ? '+' : ''}{proyectoGanado.toFixed(2)} €
            </p>
          </div>
          <div className="bg-[#141414] border border-[#232323] p-4 rounded-xl">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Capital invertido</p>
            <p className="text-md font-bold text-white">95.63 €</p>
          </div>
          <div className="bg-[#141414] border border-[#232323] p-4 rounded-xl">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Ingresos totales</p>
            <p className="text-md font-bold text-emerald-400">95.00 €</p>
          </div>
          <div className="bg-[#141414] border border-[#232323] p-4 rounded-xl">
            <p className="text-[11px] text-gray-400 font-medium mb-1">ROI medio</p>
            <p className="text-md font-bold text-rose-500">-1%</p>
          </div>
        </div>
        
        <div 
          onClick={() => navigate('/finance/inversion/proyecto/wallapop')}
          className="bg-[#141414] border border-[#232323] hover:border-emerald-500/50 p-5 rounded-xl flex justify-between items-center cursor-pointer transition-all group"
        >
          <div>
            <h3 className="font-bold text-lg text-white capitalize group-hover:text-emerald-400 transition-colors">wallapop</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">compraventa</span>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
              <p>Total Compras: <span className="text-rose-500 font-medium">-95.63 €</span></p>
              <p>Ventas Totales: <span className="text-emerald-400 font-medium">+95.00 €</span></p>
              <p>Stock (Coste): <span className="text-amber-500 font-bold">{proyectoInvertido.toFixed(2)} €</span></p>
            </div>
            <p className="text-[11px] text-blue-400 hover:underline mt-4 flex items-center gap-1">Ver libro de cuentas <ChevronRight size={12} /></p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-rose-500">-0.7% ROI</span>
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA MAESTRA PRINCIPAL (SUMMARY)
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white">Inversión</h1>
      </div>

      {/* TARJETA MASTER */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6 mb-6 relative overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cartera total</p>
        <h2 className="text-3xl font-black tracking-tight mb-2">{carteraTotal.toFixed(2)} €</h2>
        
        <div className={`flex items-center gap-1.5 text-xs font-bold ${rentabilidadPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
          {rentabilidadPorcentaje >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            {rentabilidadPorcentaje >= 0 ? '+' : ''}{rentabilidadPorcentaje.toFixed(2)}% · {rentabilidadPorcentaje >= 0 ? '+' : ''}{gananciasTotales.toFixed(2)} € desde el inicio
          </span>
        </div>

        <div className="absolute right-6 top-6 bottom-6 w-1/3 opacity-20 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <path d="M 0 25 Q 25 22, 50 15 T 100 5" fill="none" stroke="#f59e0b" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* LAS TRES TARJETAS INTERACTIVAS ORIGINALES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setCurrentView('bolsa')}
          className="bg-[#141414] border border-[#232323] hover:bg-[#1a1a1a] hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-all"
        >
          <p className="text-xs font-semibold text-gray-400 mb-1">Bolsa</p>
          <p className="text-xl font-black text-amber-500">{totalValorBolsa.toFixed(2)} €</p>
        </div>
        
        <div 
          onClick={() => setCurrentView('proyecto')}
          className="bg-[#141414] border border-[#232323] hover:bg-[#1a1a1a] hover:border-emerald-500/40 p-5 rounded-2xl cursor-pointer transition-all"
        >
          <p className="text-xs font-semibold text-gray-400 mb-1">Proyectos</p>
          <p className="text-xl font-black text-emerald-400">{proyectoInvertido.toFixed(2)} €</p>
        </div>

        <div className="bg-[#141414] border border-[#232323] p-5 rounded-2xl">
          <p className="text-xs font-semibold text-gray-400 mb-1">Rentab. total</p>
          <p className={`text-xl font-black ${rentabilidadPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {rentabilidadPorcentaje >= 0 ? '+' : ''}{rentabilidadPorcentaje.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* ACCIONES DE SALDO LIQUIDO */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Saldo disponible para invertir</p>
          <h3 className="text-2xl font-black text-white mb-1">{disponibleGlobal.toFixed(2)} €</h3>
          <p className="text-xs text-gray-500">Dinero líquido · Listo para asignar o retirar</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button 
            onClick={() => handleRecalcularTodo()}
            title="Sincronizar de mi bolsillo"
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

      {/* HISTORIAL GENERAL (ACORDEÓN) */}
      <div className="border-t border-[#232323] pt-6">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">💼 Historial de Capital Invertido</h3>
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
              <div onClick={() => navigate('/finance/inversion/mes/2026-07')} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#181818] transition-colors cursor-pointer">
                <span className="text-xs text-gray-300 font-semibold">🔹 Julio</span>
                <span className="text-xs text-gray-500">{movimientos.filter(m => m.dateString?.includes('-07-')).length} movimientos</span>
              </div>
              <div onClick={() => navigate('/finance/inversion/mes/2026-06')} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#181818] transition-colors cursor-pointer">
                <span className="text-xs text-gray-300 font-semibold">🔹 Junio</span>
                <span className="text-xs text-gray-500">{movimientos.filter(m => m.dateString?.includes('-06-')).length} movimientos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL INTERNO SÍNCRONO PARA OPERACIONES DE BOLSA */}
      {isBolsaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-[#2d2d2d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#2d2d2d]">
              <h3 className="font-bold text-sm text-white capitalize">
                Registrar {bolsaModalType === 'propio' ? 'Compra Bolsa' : bolsaModalType === 'vender' ? 'Venta Bolsa' : 'Cobro Dividendos'}
              </h3>
              <button onClick={() => setIsBolsaModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarBolsa} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monto (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={bolsaMonto} 
                  onChange={(e) => setBolsaMonto(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              {bolsaModalType === 'vender' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Coste de Compra Original (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={bolsaCosteOriginal} 
                    onChange={(e) => setBolsaCosteOriginal(e.target.value)}
                    placeholder="¿Cuánto te costaron estas acciones al comprarlas?" 
                    className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <button type="button" onClick={() => setIsBolsaModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#303030] text-sm font-semibold text-gray-400 hover:text-white cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-black hover:bg-amber-600 cursor-pointer">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
