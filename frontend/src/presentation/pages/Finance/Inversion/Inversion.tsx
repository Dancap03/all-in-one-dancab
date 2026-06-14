import { useState, useEffect } from 'react';
import { PortfolioModal } from './components/modals/PortfolioModal';
import { PortfolioSettingsModal } from './components/modals/PortfolioSettingsModal';
import { InvestmentTransactionModal } from './components/modals/InvestmentTransactionModal';

// Iconos para las nuevas tarjetas métricas
import { Wallet, TrendingUp, BarChart3, Briefcase, DollarSign, ArrowUpRight } from 'lucide-react';

// Tabs
import { PosicionesTab } from './components/tabs/PosicionesTab'; 
import { DistribucionTab } from './components/tabs/DistribucionTab';
import { RendimientoTab } from './components/tabs/RendimientoTab';
import { DividendosTab } from './components/tabs/DividendosTab';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  
  // ==========================================
  // 1. ESTADOS DE BOLSAS (ETFs, Acciones, Criptos)
  // ==========================================
  const [portfolios, setPortfolios] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_portfolios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activePortfolioId, setActivePortfolioId] = useState(() => {
    const saved = localStorage.getItem('aio_activePortfolio');
    return saved || 'aggregated';
  });

  const [allPositions, setAllPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_positions');
    return saved ? JSON.parse(saved) : [
      { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b', portfolioId: portfolios[0]?.id || 'p1' },
      { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444', portfolioId: portfolios[1]?.id || 'p2' }
    ];
  });

  const [allVentas, setAllVentas] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_ventas');
    return saved ? JSON.parse(saved) : [];
  });

  const [allTransacciones, setAllTransacciones] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_transacciones');
    return saved ? JSON.parse(saved) : [];
  });

  // ==========================================
  // 2. ESTADOS DE PROYECTOS PROPIOS (Compra/Venta, Servicios)
  // ==========================================
  const [proyectosInvertido, setProyectosInvertido] = useState<number>(() => {
    const saved = localStorage.getItem('aio_proyectos_invertido');
    return saved ? Number(saved) : 1200.00; // Valor inicial de ejemplo (puedes cambiarlo)
  });

  const [proyectosGanado, setProyectosGanado] = useState<number>(() => {
    const saved = localStorage.getItem('aio_proyectos_ganado');
    return saved ? Number(saved) : 2450.00; // Valor inicial de ejemplo (puedes cambiarlo)
  });

  // MODALES
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // SINCRONIZACIÓN LOCALSTORAGE
  useEffect(() => { localStorage.setItem('aio_portfolios', JSON.stringify(portfolios)); }, [portfolios]);
  useEffect(() => { localStorage.setItem('aio_activePortfolio', activePortfolioId); }, [activePortfolioId]);
  useEffect(() => { localStorage.setItem('aio_positions', JSON.stringify(allPositions)); }, [allPositions]);
  useEffect(() => { localStorage.setItem('aio_ventas', JSON.stringify(allVentas)); }, [allVentas]);
  useEffect(() => { localStorage.setItem('aio_transacciones', JSON.stringify(allTransacciones)); }, [allTransacciones]);
  useEffect(() => { localStorage.setItem('aio_proyectos_invertido', proyectosInvertido.toString()); }, [proyectosInvertido]);
  useEffect(() => { localStorage.setItem('aio_proyectos_ganado', proyectosGanado.toString()); }, [proyectosGanado]);

  // FUNCIONES DE CARTERA
  const handleAddPortfolio = (newPortfolio: any) => {
    setPortfolios([...portfolios, newPortfolio]);
    if (portfolios.length === 0) setActivePortfolioId(newPortfolio.id);
  };

  const handleUpdatePortfolio = (id: string, newName: string) => {
    setPortfolios(portfolios.map(p => p.id === id ? { ...p, nombre: newName } : p));
  };

  const handleDeletePortfolio = (id: string) => {
    const updated = portfolios.filter(p => p.id !== id);
    setPortfolios(updated);
    setActivePortfolioId(updated.length === 1 ? updated[0].id : 'aggregated');
  };

  // LOGICA DE TRANSACCIONES
  const handleSaveTransaction = (data: any) => {
    const { portfolioId, type, asset, cantidadInvertida, price, date, nota } = data;
    const formattedDate = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }).replace('/', '.');

    const newTx = {
      id: Date.now().toString(),
      fechaDia: formattedDate,
      tipoIcono: type === 'Comprar' ? 'buy' : 'sell',
      asset: asset,
      detalles: `${type === 'Comprar' ? 'Compró' : 'Vendió'} a ${price} € ${nota ? `(${nota})` : ''}`,
      total: cantidadInvertida,
      logoInitial: asset.substring(0, 1).toUpperCase(),
      logoColor: type === 'Comprar' ? '#3b82f6' : '#ef4444',
      portfolioId: portfolioId
    };
    setAllTransacciones(prev => [newTx, ...prev]);

    setAllPositions(prev => {
      let updated = [...prev];
      const existingIdx = updated.findIndex(p => (p.name === asset || p.id === asset) && p.portfolioId === portfolioId);

      if (type === 'Comprar') {
        if (existingIdx >= 0) {
          const p = { ...updated[existingIdx] };
          p.total += cantidadInvertida;
          p.actual = p.total; 
          updated[existingIdx] = p;
        } else {
          updated.push({
            id: asset.substring(0, 3).toUpperCase(), name: asset, ticker: asset.toUpperCase(), 
            compra: price, actual: cantidadInvertida, total: cantidadInvertida,
            plPerc: '+0.00%', plVal: '+0.00', pos: true, color: '#10b981', portfolioId
          });
        }
      } else if (type === 'Vender') {
        if (existingIdx >= 0) {
          const p = { ...updated[existingIdx] };
          p.total -= cantidadInvertida;
          p.actual = p.total;
          if (p.total <= 0) updated.splice(existingIdx, 1); 
          else updated[existingIdx] = p;
        }
      }
      return updated;
    });
  };

  const hasPortfolios = portfolios.length > 0;
  const effectivePortfolioId = !hasPortfolios ? 'aggregated' : (portfolios.length === 1 ? portfolios[0].id : activePortfolioId);

  // FILTRADO DE DATOS LOCALES
  let currentPositions: any[] = [];
  let currentVentas: any[] = [];
  let currentTransacciones: any[] = [];

  if (effectivePortfolioId === 'aggregated') {
    const existingIds = portfolios.map(p => p.id);
    currentPositions = allPositions.filter(p => existingIds.includes(p.portfolioId));
    currentVentas = allVentas.filter(v => existingIds.includes(v.portfolioId));
    currentTransacciones = allTransacciones.filter(t => existingIds.includes(t.portfolioId));
  } else {
    currentPositions = allPositions.filter(p => p.portfolioId === effectivePortfolioId);
    currentVentas = allVentas.filter(v => v.portfolioId === effectivePortfolioId);
    currentTransacciones = allTransacciones.filter(t => t.portfolioId === effectivePortfolioId);
  }

  // ==========================================
  // CALCULO DINÁMICO DE LOS 6 RECUADROS
  // ==========================================
  
  // 1. Métricas de Bolsa (Calculadas dinámicamente de tu tabla de posiciones)
  const bolsaInvertidoPropio = currentPositions.reduce((sum, p) => sum + p.total, 0);
  const bolsaGanancias = bolsaInvertidoPropio > 0 ? bolsaInvertidoPropio * 0.0956 : 0; // Ejemplo de rendimiento estimado (+9.56%)

  // 2. Métricas Globales Totales (Suma de Bolsa + Proyectos)
  const globalTotalInvertido = bolsaInvertidoPropio + proyectosInvertido;
  const globalTotalGanado = bolsaGanancias + proyectosGanado;

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Posiciones':
        return <PosicionesTab currentPositions={currentPositions} currentVentas={currentVentas} currentTransacciones={currentTransacciones} onAddTransaction={() => setIsTransactionModalOpen(true)} />;
      case 'Distribución':
        return <DistribucionTab currentPositions={currentPositions} />;
      case 'Rendimiento':
        return <RendimientoTab />;
      case 'Dividendos':
        return <DividendosTab />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-8 text-white">
      
      {/* SECCIÓN DE LOS 6 RECUADROS EN REJILLA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RECUADROS BLOQUE 1: TOTALES GLOBALES */}
        <div className="space-y-3 bg-[#161618] border border-[#2d2d2d] rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            Resumen Global Absoluto
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[#1c1c1e] border border-[#28282a] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Invertido</span>
              <span className="text-lg font-black text-white">{globalTotalInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="bg-[#1c1c1e] border border-[#28282a] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Ganado</span>
              <span className="text-lg font-black text-[#10b981]">{globalTotalGanado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* RECUADROS BLOQUE 2: MERCADOS FISCALES (Bolsa, ETFs, Acciones, Cryptos) */}
        <div className="space-y-3 bg-[#161618] border border-[#2d2d2d] rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} />
              Inversión en Bolsas
            </div>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">Mercados</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Invertido Propio</span>
              <span className="text-lg font-black text-gray-200">{bolsaInvertidoPropio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mis Ganancias</span>
              <span className="text-lg font-black text-blue-400">+{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* RECUADROS BLOQUE 3: TRABAJO AUTÓNOMO / PROYECTOS (Compra/Venta, Servicios) */}
        <div className="space-y-3 bg-[#161618] border border-[#2d2d2d] rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Briefcase size={14} />
              Proyectos Personales
            </div>
            <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">Libre</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] p-4 rounded-xl relative group">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dinero Invertido</span>
              <input 
                type="number" 
                value={proyectosInvertido} 
                onChange={(e) => setProyectosInvertido(Number(e.target.value))}
                className="w-full bg-transparent font-black text-lg text-gray-200 outline-none border-b border-transparent focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="bg-[#1c1c1e] border border-[#2d2d2d] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lo que Gané</span>
              <input 
                type="number" 
                value={proyectosGanado} 
                onChange={(e) => setProyectosGanado(Number(e.target.value))}
                className="w-full bg-transparent font-black text-lg text-purple-400 outline-none border-b border-transparent focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        </div>

      </div>

      {/* GESTIÓN DE CARTERAS (Selector de burbujas compacto) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111112] border border-[#2d2d2d] p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActivePortfolioId('aggregated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${effectivePortfolioId === 'aggregated' ? 'bg-white text-black' : 'bg-[#1c1c1e] text-gray-400 hover:text-white'}`}
          >
            Cartera Combinada
          </button>
          {portfolios.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePortfolioId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${effectivePortfolioId === p.id ? 'bg-white text-black' : 'bg-[#1c1c1e] text-gray-400 hover:text-white'}`}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPortfolioModalOpen(true)} className="bg-[#1a1a1c] hover:bg-[#222224] border border-[#2d2d2d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            + Nueva Cartera
          </button>
          {hasPortfolios && effectivePortfolioId !== 'aggregated' && (
            <button onClick={() => setIsSettingsModalOpen(true)} className="bg-[#1a1a1c] hover:bg-[#222224] border border-[#2d2d2d] text-gray-400 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* RENDERIZADO DE LAS SUBPESTAÑAS DE INVERSIÓN */}
      {hasPortfolios ? (
        <>
          <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mb-6 px-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 transition-colors cursor-pointer ${activeTab === tab ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>
          {renderActiveTab()}
        </>
      ) : (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
             <span className="text-lg">💼</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Comienza tu viaje de inversión</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-6">Crea tu primera cartera para empezar a hacer seguimiento de tus ETFs, criptomonedas y acciones.</p>
          <button onClick={() => setIsPortfolioModalOpen(true)} className="bg-white hover:bg-gray-200 text-black font-bold px-6 py-2.5 rounded transition-colors text-sm cursor-pointer">
            Crear mi primera cartera
          </button>
        </div>
      )}

      {/* Modales completamente compatibles */}
      <PortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} onSave={handleAddPortfolio} />
      
      <PortfolioSettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        portfolio={portfolios.find(p => p.id === effectivePortfolioId)} 
        onUpdate={handleUpdatePortfolio} 
        onDelete={handleDeletePortfolio} 
      />

      <InvestmentTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        portfolios={portfolios}
        activePortfolioId={effectivePortfolioId}
        currentPositions={currentPositions}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};
