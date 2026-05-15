import { useState, useEffect } from 'react';
import { InvestmentSummary } from './components/InvestmentSummary';
import { PositionsTable } from './components/PositionsTable';
import { VentasTable } from './components/VentasTable';
import { TransaccionesList } from './components/TransaccionesList';
import { PortfolioModal } from './components/modals/PortfolioModal';
import { PortfolioSettingsModal } from './components/modals/PortfolioSettingsModal';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');
  
  // ESTADO DE CARTERAS CON PERSISTENCIA
  const [portfolios, setPortfolios] = useState<any[]>(() => {
    const saved = localStorage.getItem('aio_portfolios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activePortfolioId, setActivePortfolioId] = useState(() => {
    const saved = localStorage.getItem('aio_activePortfolio');
    return saved || 'aggregated';
  });

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Guardar en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem('aio_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  useEffect(() => {
    localStorage.setItem('aio_activePortfolio', activePortfolioId);
  }, [activePortfolioId]);

  // Funciones de gestión
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
    if (updated.length > 0) {
      setActivePortfolioId(updated.length === 1 ? updated[0].id : 'aggregated');
    } else {
      setActivePortfolioId('aggregated');
    }
  };

  // Mocks de Base de Datos
  const allMockPositions = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b', portfolioId: portfolios[0]?.id || 'p1' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444', portfolioId: portfolios[1]?.id || 'p2' }
  ];
  const allMockVentas = [];
  const allMockTransacciones = [
    { id: '1', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares MSCI ACWI ETF', detalles: 'Compró 197 a 101,26 €', total: 19948.22, logoInitial: 'i', logoColor: '#3d3d3d', portfolioId: portfolios[0]?.id || 'p1' }
  ];

  const hasPortfolios = portfolios.length > 0;
  const effectivePortfolioId = !hasPortfolios ? 'aggregated' : (portfolios.length === 1 ? portfolios[0].id : activePortfolioId);

  let currentPositions = [];
  let currentVentas = [];
  let currentTransacciones = [];

  if (effectivePortfolioId === 'aggregated') {
    const existingPortfolioIds = portfolios.map(p => p.id);
    currentPositions = allMockPositions.filter(p => existingPortfolioIds.includes(p.portfolioId!));
    currentVentas = allMockVentas.filter(v => existingPortfolioIds.includes(v.portfolioId!));
    currentTransacciones = allMockTransacciones.filter(t => existingPortfolioIds.includes(t.portfolioId!));
  } else {
    currentPositions = allMockPositions.filter(p => p.portfolioId === effectivePortfolioId);
    currentVentas = allMockVentas.filter(v => v.portfolioId === effectivePortfolioId);
    currentTransacciones = allMockTransacciones.filter(t => t.portfolioId === effectivePortfolioId);
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
  
  // GENERADOR DE DATOS DINÁMICOS PARA LA GRÁFICA
  const generateDynamicChartData = () => {
    if (!hasData) return [];
    const data = [];
    let baseValue = totalValue * (isGlobalPositive ? 0.9 : 1.1);
    
    // Determinar puntos y formato de fecha según el timeframe
    let points = 20;
    let labelFormat = '';
    
    if (activeTimeframe === '1D') { points = 48; labelFormat = 'HH:mm'; }
    else if (activeTimeframe === '1W') { points = 14; labelFormat = 'HH:mm, DD. MMM'; }
    else if (activeTimeframe === '1M') { points = 30; labelFormat = 'DD. MMM'; }
    else { points = 60; labelFormat = 'MMM YYYY'; }

    // Generar línea ondulada
    for (let i = 0; i < points; i++) {
      baseValue += (Math.random() - 0.5) * (totalValue * 0.02);
      
      // Formato de fecha falso adaptativo para el Tooltip
      let dateLabel = '';
      if (activeTimeframe === '1D') dateLabel = `${10 + Math.floor(i/4)}:${(i%4)*15 === 0 ? '00' : (i%4)*15}`;
      else if (activeTimeframe === '1W') dateLabel = `10:00, ${10 + i}. may`;
      else if (activeTimeframe === '1M') dateLabel = `${i + 1}. may`;
      else dateLabel = `${Math.floor(i/5) + 1}. may 2026`;

      data.push({ 
        date: dateLabel, 
        value: i === points - 1 ? totalValue : baseValue 
      });
    }
    return data;
  };

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

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
          <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mb-6 px-2">
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

          {activeTab === 'Posiciones' && (
            <div className="flex flex-col pb-10">
              <PositionsTable posiciones={currentPositions} />
              <VentasTable ventas={currentVentas} />
              <TransaccionesList transacciones={currentTransacciones} mesLabel="mayo 2026" />
            </div>
          )}
          
          {activeTab !== 'Posiciones' && (
            <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-10 flex items-center justify-center text-gray-500 italic">
              Módulo de {activeTab} en desarrollo...
            </div>
          )}
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

      {/* Modales */}
      <PortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} onSave={handleAddPortfolio} />
      <PortfolioSettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        portfolio={portfolios.find(p => p.id === effectivePortfolioId)} 
        onUpdate={handleUpdatePortfolio} 
        onDelete={handleDeletePortfolio} 
      />
    </div>
  );
};
