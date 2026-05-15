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
    setActivePortfolioId(newPortfolio.id); 
  };

  // Mocks de base de datos
  const mockPositions = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b', portfolioId: 'p1' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444', portfolioId: 'p2' }
  ];

  const mockVentas = [
    { id: 'TSLA', name: 'Tesla Inc', ticker: 'TSLA', fecha: '12 May 2026', detalles: 'Vendió 5 a 160,20 €', totalVenta: 801.00, plPerc: '+6.68%', plVal: '+50.20', pos: true, color: '#ef4444', portfolioId: 'p1' }
  ];

  const mockTransacciones = [
    { id: '1', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares MSCI ACWI ETF', detalles: 'Compró 197 a 101,26 €', total: 19948.22, logoInitial: 'i', logoColor: '#3d3d3d', portfolioId: 'p2' },
    { id: '2', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'Alphabet Inc. Class A', detalles: 'Compró 30 a 340,33 €', total: 10209.75, logoInitial: 'Alph', logoColor: '#ef4444', portfolioId: 'p1' },
  ];

  // LÓGICA DE FILTRADO: Si solo hay 1 cartera, forzamos su ID para no buscar "aggregated"
  const effectivePortfolioId = portfolios.length === 1 ? portfolios[0].id : activePortfolioId;

  const filteredPositions = effectivePortfolioId === 'aggregated' ? mockPositions : mockPositions.filter(p => p.portfolioId === effectivePortfolioId);
  const filteredVentas = effectivePortfolioId === 'aggregated' ? mockVentas : mockVentas.filter(v => v.portfolioId === effectivePortfolioId);
  const filteredTransacciones = effectivePortfolioId === 'aggregated' ? mockTransacciones : mockTransacciones.filter(t => t.portfolioId === effectivePortfolioId);

  // CÁLCULO DEL BALANCE REAL Y GRÁFICO CONDICIONAL
  const hasPositions = filteredPositions.length > 0;
  const totalValue = filteredPositions.reduce((sum, p) => sum + p.total, 0);

  const balanceData = { 
    total: hasPositions ? `${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '0,00 €', 
    rendimiento: hasPositions ? '+9.56%' : '0,00%', 
    beneficio: hasPositions ? '+10.50 €' : '0,00 €', 
    positivo: hasPositions ? true : false 
  };
  
  const chartData = hasPositions ? [ { date: '1 ene', value: totalValue * 0.9 }, { date: '15 may', value: totalValue } ] : [];
  
  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];
  const hasPortfolios = portfolios.length > 0;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Carteras</h1>
      </div>

      <InvestmentSummary 
        balance={balanceData} 
        chartData={chartData} 
        activeTimeframe={activeTimeframe} 
        onTimeframeChange={setActiveTimeframe}
        portfolios={portfolios}
        activePortfolioId={effectivePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onAddPortfolio={() => setIsPortfolioModalOpen(true)}
      />

      {hasPortfolios ? (
        <>
          <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mb-6 px-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 transition-colors ${activeTab === tab ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Posiciones' && (
            <div className="flex flex-col pb-10">
              <PositionsTable posiciones={filteredPositions} />
              <VentasTable ventas={filteredVentas} />
              <TransaccionesList transacciones={filteredTransacciones} mesLabel="mayo 2026" />
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-12 flex flex-col items-center justify-center text-center mt-6 shadow-sm">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 border border-[#2d2d2d]">
            <span className="text-3xl">💼</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Comienza tu viaje de inversión</h3>
          <p className="text-gray-400 max-w-sm mb-6 text-sm">Crea tu primera cartera para empezar a hacer seguimiento de tus ETFs, criptomonedas y acciones.</p>
          <button onClick={() => setIsPortfolioModalOpen(true)} className="bg-white hover:bg-gray-200 text-black font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
            Crear mi primera cartera
          </button>
        </div>
      )}

      <PortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} onSave={handleAddPortfolio} />
    </div>
  );
};
