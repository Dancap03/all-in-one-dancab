import { useState, useEffect } from 'react';
import { PortfolioModal } from './components/modals/PortfolioModal';
import { PortfolioSettingsModal } from './components/modals/PortfolioSettingsModal';
import { InvestmentTransactionModal } from './components/modals/InvestmentTransactionModal';

// Iconos para los 6 recuadros
import { BarChart3, Briefcase, Wallet, TrendingUp, Globe, Activity } from 'lucide-react';

// Tabs
import { PosicionesTab } from './components/tabs/PosicionesTab'; 
import { DistribucionTab } from './components/tabs/DistribucionTab';
import { RendimientoTab } from './components/tabs/RendimientoTab';
import { DividendosTab } from './components/tabs/DividendosTab';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');
  
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
  // 2. DATO COMPARTIDO: DESDE EL DIA A DIA / AHORRO
  // ==========================================
  const [invertidoDesdeDiaDia, setInvertidoDesdeDiaDia] = useState<number>(() => {
    // Aquí puedes leer el estado global, el localStorage de transacciones de día a día, o tu FinanceService
    const savedDiaDia = localStorage.getItem('aio_total_invertido_diadia');
    return savedDiaDia ? Number(savedDiaDia) : 15000.00; // Valor de ejemplo vinculado a tu flujo
  });

  // 3. ESTADOS DE PROYECTOS PROPIOS (Solo lectura en esta vista)
  const [proyectosInvertido] = useState<number>(2500.00); 
  const [proyectosGanado] = useState<number>(4800.00);

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
  // CÁLCULOS AUTOMÁTICOS DE LAS TARJETAS
  // ==========================================
  const bolsaInvertidoPropio = currentPositions.reduce((sum, p) => sum + p.total, 0);
  const bolsaGanancias = bolsaInvertidoPropio > 0 ? bolsaInvertidoPropio * 0.0842 : 0; // Ganancia simulada de bolsa (+8.42%)

  // El Total Invertido Global ahora usa "invertidoDesdeDiaDia" directamente en vez de sumas manuales
  const globalTotalInvertido = invertidoDesdeDiaDia; 
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
      
      {/* SECCIÓN DE LOS 6 RECUADROS TOTALMENTE DE LECTURA (Cero Inputs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BLOQUE 1: TOTALES GLOBALES ABSOLUTOS */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Globe size={13} className="text-emerald-400" />
            Balance Global
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Invertido</span>
              <span className="text-lg font-black text-white">{globalTotalInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              <span className="text-[9px] text-gray-400 block mt-0.5 font-medium italic">Sincronizado</span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Ganado</span>
              <span className="text-lg font-black text-[#10b981]">{globalTotalGanado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: INVERSIÓN EN BOLSA (MERCADOS FISCALES) */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={13} />
            Inversión en Bolsas
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Invertido Propio</span>
              <span className="text-lg font-black text-gray-200">{bolsaInvertidoPropio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mis Ganancias</span>
              <span className="text-lg font-black text-blue-400">+{bolsaGanancias.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: PROYECTOS PROPIOS (COMPRA-VENTA / SERVICIOS) */}
        <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={13} />
            Proyectos Personales
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dinero Invertido</span>
              <span className="text-lg font-black text-gray-200">{proyectosInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lo que Gané</span>
              <span className="text-lg font-black text-purple-400">+{proyectosGanado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

      </div>

      {/* BURBUJAS DE CARTERA COMPACTAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f0f11] border border-[#2d2d2d] p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActivePortfolioId('aggregated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${effectivePortfolioId === 'aggregated' ? 'bg-white text-black' : 'bg-[#1b1b1d] text-gray-400 hover:text-white'}`}
          >
            Cartera Combinada
          </button>
          {portfolios.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePortfolioId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${effectivePortfolioId === p.id ? 'bg-white text-black' : 'bg-[#1b1b1d] text-gray-400 hover:text-white'}`}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPortfolioModalOpen(true)} className="bg-[#161618] hover:bg-[#202022] border border-[#2d2d2d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            + Nueva Cartera
          </button>
          {hasPortfolios && effectivePortfolioId !== 'aggregated' && (
            <button onClick={() => setIsSettingsModalOpen(true)} className="bg-[#161618] hover:bg-[#202022] border border-[#2d2d2d] text-gray-400 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* SUBPESTAÑAS DE INVERSIÓN */}
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
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-xl p-12 flex flex-col items-center justify-center text-center">
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

      {/* Modales perfectamente compatibles */}
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
