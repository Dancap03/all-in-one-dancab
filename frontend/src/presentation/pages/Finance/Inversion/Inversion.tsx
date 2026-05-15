import { useState } from 'react';
import { InvestmentSummary } from './components/InvestmentSummary';
import { PositionsTable } from './components/PositionsTable';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');

  // Datos simulados (próximamente vendrán de Firebase/FinanceService)
  const balanceData = {
    total: '120.31 €',
    rendimiento: '+9.56%',
    beneficio: '+10.50 €',
    positivo: true
  };

  const chartData = [
    { date: '1 ene', value: 100 }, { date: '15 ene', value: 101 },
    { date: '1 feb', value: 100.5 }, { date: '15 feb', value: 102 },
    { date: '1 mar', value: 101 }, { date: '15 mar', value: 103 },
    { date: '1 abr', value: 102.5 }, { date: '15 abr', value: 104 },
    { date: '1 may', value: 105 }, { date: '7 may', value: 106 },
    { date: '15 may', value: 120.31 }
  ];

  const posicionesData = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b' },
    { id: 'ETH', name: 'Ethereum', ticker: 'ETH-EUR', compra: 2900.50, actual: 15.40, total: 3105.20, plPerc: '+4.50%', plVal: '+0.69', pos: true, color: '#6366f1' },
    { id: 'SOL', name: 'Solana', ticker: 'SOL-EUR', compra: 120.30, actual: 25.00, total: 145.80, plPerc: '+21.19%', plVal: '+5.30', pos: true, color: '#a855f7' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444' },
    { id: 'WD', name: 'iShares Core MSCI World', ticker: 'IWDA.AS', compra: 85.20, actual: 86.10, total: 86.10, plPerc: '+1.05%', plVal: '+0.90', pos: true, color: '#3b82f6' },
    { id: 'NDX', name: 'Invesco EQQQ Nasdaq-100', ticker: 'EQQQ.MI', compra: 340.10, actual: 325.40, total: 325.40, plPerc: '-4.32%', plVal: '-14.70', pos: false, color: '#10b981' }
  ];

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

  return (
    <div className="w-full">
      {/* Cabecera general */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Cartera de inversiones</h1>
        <p className="text-gray-400 text-sm">Mis inversiones · Seguimiento en tiempo real</p>
      </div>

      <InvestmentSummary 
        balance={balanceData} 
        chartData={chartData} 
        activeTimeframe={activeTimeframe} 
        onTimeframeChange={setActiveTimeframe} 
      />

      {/* Navegación Interna (Pestañas) */}
      <div className="flex gap-8 text-sm font-medium border-b border-[#2d2d2d] mb-6 px-2">
        {tabs.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition-colors ${activeTab === tab ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
        <button 
          onClick={() => setActiveTab('IA')}
          className={`pb-3 transition-colors flex items-center gap-2 ${activeTab === 'IA' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span>AllInOne IA</span>
          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Beta</span>
        </button>
      </div>

      {/* Renderizado Condicional */}
      {activeTab === 'Posiciones' && <PositionsTable posiciones={posicionesData} />}
      
      {activeTab !== 'Posiciones' && (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-10 flex items-center justify-center text-gray-500 italic">
          Módulo de {activeTab} en desarrollo...
        </div>
      )}
    </div>
  );
};
