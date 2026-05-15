import { useState } from 'react';
import { InvestmentSummary } from './components/InvestmentSummary';
import { PositionsTable } from './components/PositionsTable';
import { VentasTable } from './components/VentasTable';
import { TransaccionesList } from './components/TransaccionesList';
import { PortfolioModal } from './components/modals/PortfolioModal';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD'); 
  
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState('aggregated');
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  const handleAddPortfolio = (newPortfolio: any) => {
    setPortfolios([...portfolios, newPortfolio]);
    // Si es la primera cartera, la seleccionamos. Si ya había, nos quedamos donde estábamos.
    if (portfolios.length === 0) {
      setActivePortfolioId(newPortfolio.id);
    }
  };

  // Mocks de Base de Datos (SOLO pertenecen a carteras individuales)
  const allMockPositions = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b', portfolioId: 'p1' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444', portfolioId: 'p2' }
  ];

  const allMockVentas = [
    { id: 'TSLA', name: 'Tesla Inc', ticker: 'TSLA', fecha: '12 May 2026', detalles: 'Vendió 5 a 160,20 €', totalVenta: 801.00, plPerc: '+6.68%', plVal: '+50.20', pos: true, color: '#ef4444', portfolioId: 'p1' }
  ];

  const allMockTransacciones = [
    { id: '1', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares MSCI ACWI ETF', detalles: 'Compró 197 a 101,26 €', total: 19948.22, logoInitial: 'i', logoColor: '#3d3d3d', portfolioId: 'p2' },
    { id: '2', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'Alphabet Inc. Class A', detalles: 'Compró 30 a 340,33 €', total: 10209.75, logoInitial: 'Alph', logoColor: '#ef4444', portfolioId: 'p1' },
  ];

  // LÓGICA CORE: ¿Qué estamos viendo?
  const hasPortfolios = portfolios.length > 0;
  // Si solo hay 1 cartera, forzamos ver esa. Si no hay ninguna, mostramos 'aggregated' (vacío por defecto).
  const effectivePortfolioId = !hasPortfolios ? 'aggregated' : (portfolios.length === 1 ? portfolios[0].id : activePortfolioId);

  // Filtramos datos basándonos en la vista actual
  let currentPositions = [];
  let currentVentas = [];
  let currentTransacciones = [];

  if (effectivePortfolioId === 'aggregated') {
    // Si vemos todo, sumamos TODAS las posiciones que pertenezcan a ALGUN portfolio existente
    const existingPortfolioIds = portfolios.map(p => p.id);
    currentPositions = allMockPositions.filter(p => existingPortfolioIds.includes(p.portfolioId!));
    currentVentas = allMockVentas.filter(v => existingPortfolioIds.includes(v.portfolioId!));
    currentTransacciones = allMockTransacciones.filter(t => existingPortfolioIds.includes(t.portfolioId!));
  } else {
    // Si vemos una individual, filtramos estrictamente
    currentPositions = allMockPositions.filter(p => p.portfolioId === effectivePortfolioId);
    currentVentas = allMockVentas.filter(v => v.portfolioId === effectivePortfolioId);
    currentTransacciones = allMockTransacciones.filter(t => t.portfolioId === effectivePortfolioId);
  }

  // Cálculos dinámicos para el Header
  const hasData = currentPositions.length > 0;
  const totalValue = currentPositions.reduce((sum, p) => sum + p.total, 0);
  
  // Simulamos un P/L global. En una app real, sumarías los P/L individuales.
  const isGlobalPositive = totalValue > 50000; // Lógica fake para decidir color verde o rojo

  const balanceData = { 
    total: hasData ? `${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '0,00 €', 
    rendimiento: hasData ? (isGlobalPositive ? '+9.56%' : '-1.49%') : '0,00%', 
    beneficio: hasData ? (isGlobalPositive ? '+10.50 €' : '-1520.22 €') : '0,00 €', 
    positivo: hasData ? isGlobalPositive : false 
  };
  
  const chartData = hasData ? [ { date: '1 ene', value: totalValue * (isGlobalPositive ? 0.9 : 1.1) }, { date: '15 may', value: totalValue } ] : [];

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

  return (
    <div className="w-full">
      {/* La vista de getquin no tiene título "Carteras" suelto arriba, 
        está integrado en el bloque del Summary. 
      */}
      
      <InvestmentSummary 
        balance={balanceData} 
        chartData={chartData} 
        activeTimeframe={activeTimeframe} 
        onTimeframeChange={setActiveTimeframe}
        portfolios={portfolios}
        activePortfolioId={effectivePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onAddPortfolio={() => setIsPortfolioModalOpen(true)}
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
        /* Estado vacío idéntico a image_eef753.png */
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-12 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-12 h-12 bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
             {/* Icono simulado del maletín rojo */}
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
    </div>
  );
};
