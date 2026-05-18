import { useState, useEffect } from 'react';
import { InvestmentSummary } from './components/InvestmentSummary';
import { PortfolioModal } from './components/modals/PortfolioModal';
import { PortfolioSettingsModal } from './components/modals/PortfolioSettingsModal';
import { InvestmentTransactionModal } from './components/modals/InvestmentTransactionModal';

// Tabs
import { PosicionesTab } from './components/tabs/PosicionesTab';
import { DistribucionTab } from './components/tabs/DistribucionTab';
import { RendimientoTab } from './components/tabs/RendimientoTab';
import { DividendosTab } from './components/tabs/DividendosTab';
import { AllInOneIATab } from './components/tabs/AllInOneIATab';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');
  
  // ESTADOS CON PERSISTENCIA (LocalStorage)
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
    return saved ? JSON.parse(saved) : [
      { id: '1', fechaDia: '08.05', tipoIcono: 'buy', asset: 'iShares MSCI ACWI ETF', detalles: 'Compró a 101,26 €', total: 19948.22, logoInitial: 'i', logoColor: '#3d3d3d', portfolioId: portfolios[1]?.id || 'p2' }
    ];
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
    setActivePortfolioId(updated.length === 1 ? updated[0].id : (updated.length > 0 ? 'aggregated' : 'aggregated'));
  };

  // LOGICA: AGREGAR TRANSACCIÓN (Compra/Venta)
  const handleSaveTransaction = (data: any) => {
    const { portfolioId, type, asset, cantidadInvertida, price, date, nota } = data;
    const formattedDate = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }).replace('/', '.');

    // 1. Historial
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

    // 2. Modificar Posición
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

    // 3. Modificar Ventas
    if (type === 'Vender') {
      const newVenta = {
        id: asset.substring(0, 3).toUpperCase(), name: asset, ticker: asset.toUpperCase(), fecha: formattedDate, 
        detalles: `Vendió a ${price} €`, totalVenta: cantidadInvertida, plPerc: '+0.00%', plVal: '+0.00', 
        pos: true, color: '#ef4444', portfolioId
      };
      setAllVentas(prev => [newVenta, ...prev]);
    }
  };

  const hasPortfolios = portfolios.length > 0;
  const effectivePortfolioId = !hasPortfolios ? 'aggregated' : (portfolios.length === 1 ? portfolios[0].id : activePortfolioId);

  // FILTRADO DINÁMICO
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

  const hasData = currentPositions.length > 0;
  const totalValue = currentPositions.reduce((sum, p) => sum + p.total, 0);
  const isGlobalPositive = totalValue > 50000; 

  const balanceData = { 
    total: hasData ? `${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '0,00 €', 
    rendimiento: hasData ? (isGlobalPositive ? '+9.56%' : '-1.49%') : '0,00%', 
    beneficio: hasData ? (isGlobalPositive ? '+10.50 €' : '-1520.22 €') : '0,00 €', 
    positivo: hasData ? isGlobalPositive : false 
  };
  
  const generateDynamicChartData = () => {
    if (!hasData) return [];
    const data = [];
    let baseValue = totalValue * (isGlobalPositive ? 0.9 : 1.1);
    let points = activeTimeframe === '1D' ? 48 : activeTimeframe === '1W' ? 14 : activeTimeframe === '1M' ? 30 : 60;

    for (let i = 0; i < points; i++) {
      baseValue += (Math.random() - 0.5) * (totalValue * 0.02);
      let dateLabel = '';
      if (activeTimeframe === '1D') dateLabel = `${10 + Math.floor(i/4)}:${(i%4)*15 === 0 ? '00' : (i%4)*15}`;
      else if (activeTimeframe === '1W') dateLabel = `10:00, ${10 + i}. may`;
      else if (activeTimeframe === '1M') dateLabel = `${i + 1}. may`;
      else dateLabel = `${Math.floor(i/5) + 1}. may 2026`;
      data.push({ date: dateLabel, value: i === points - 1 ? totalValue : baseValue });
    }
    return data;
  };

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Posiciones':
        return <PosicionesTab currentPositions={currentPositions} currentVentas={currentVentas} currentTransacciones={currentTransacciones} onAddTransaction={() => setIsTransactionModalOpen(true)} />;
      case 'Distribución':
        eturn <DistribucionTab currentPositions={currentPositions} />;
      case 'Rendimiento':
        return <RendimientoTab />;
      case 'Dividendos':
        return <DividendosTab />;
      case 'IA':
        return <AllInOneIATab />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <InvestmentSummary 
        balance={balanceData} 
        chartData={generateDynamicChartData()} 
        activeTimeframe={activeTimeframe} 
        onTimeframeChange={setActiveTimeframe}
        portfolios={portfolios}
        activePortfolioId={effectivePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onAddPortfolio={() => setIsPortfolioModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        hasPortfolios={hasPortfolios}
      />

      {hasPortfolios ? (
        <>
          <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mt-8 mb-6 px-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 transition-colors ${activeTab === tab ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
            <button onClick={() => setActiveTab('IA')} className={`pb-3 transition-colors flex items-center gap-2 ${activeTab === 'IA' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <span>AllInOne IA</span>
              <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Beta</span>
            </button>
          </div>

          {renderActiveTab()}
        </>
      ) : (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-12 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-12 h-12 bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
             <span className="text-[#ef4444] font-bold text-lg">💼</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Comienza tu viaje de inversión</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-6">Crea tu primera cartera para empezar a hacer seguimiento de tus ETFs, criptomonedas y acciones.</p>
          <button onClick={() => setIsPortfolioModalOpen(true)} className="bg-white hover:bg-gray-200 text-black font-bold px-6 py-2.5 rounded transition-colors text-sm">
            Crear mi primera cartera
          </button>
        </div>
      )}

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
