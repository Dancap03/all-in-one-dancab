import { useState } from 'react';
import { PosicionesTab } from './components/tabs/PosicionesTab';
import { DistribucionTab } from './components/tabs/DistribucionTab';
import { DividendosTab } from './components/tabs/DividendosTab';
import { RendimientoTab } from './components/tabs/RendimientoTab';
import { InvestmentSummary } from './components/InvestmentSummary';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState<'posiciones' | 'distribucion' | 'dividendos' | 'rendimiento'>('posiciones');

  // Arrays vacíos para satisfacer los tipos estrictos de TypeScript
  const mockPositions: any[] = [];
  const mockVentas: any[] = [];
  const mockTransactions: any[] = [];
  const mockChartData: any[] = [];

  return (
    <div className="space-y-6 text-white pb-24 md:pb-6">
      <InvestmentSummary 
        balance={0}
        chartData={mockChartData}
        activeTimeframe="1M"
        onTimeframeChange={() => {}}
        totalInvested={0}
        totalProfit={0}
        totalProfitPercentage={0}
        dailyChange={0}
        dailyProfitPercentage={0}
        loading={false}
      />

      <div className="border-b border-[#2d2d2d] flex items-center gap-2 overflow-x-auto hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {([
          { id: 'posiciones', label: 'Posiciones' },
          { id: 'distribucion', label: 'Distribución' },
          { id: 'dividendos', label: 'Dividendos' },
          { id: 'rendimiento', label: 'Rendimiento' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'posiciones' && (
          <PosicionesTab 
            currentPositions={mockPositions}
            currentVentas={mockVentas}
            currentTransacciones={mockTransactions}
            onAddTransaction={() => {}}
          />
        )}
        {activeTab === 'distribucion' && (
          <DistribucionTab currentPositions={mockPositions} />
        )}
        {activeTab === 'dividendos' && <DividendosTab />}
        {activeTab === 'rendimiento' && <RendimientoTab />}
      </div>
    </div>
  );
};
