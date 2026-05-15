import { useState } from 'react';
import { InvestmentSummary } from './components/InvestmentSummary';
import { PositionsTable } from './components/PositionsTable';
import { VentasTable } from './components/VentasTable';
import { TransaccionesList } from './components/TransaccionesList';

export const Inversion = () => {
  const [activeTab, setActiveTab] = useState('Posiciones');
  const [activeTimeframe, setActiveTimeframe] = useState('YTD');

  // Datos del Summary
  const balanceData = { total: '120.31 €', rendimiento: '+9.56%', beneficio: '+10.50 €', positivo: true };
  const chartData = [ { date: '1 ene', value: 100 }, { date: '15 may', value: 120.31 } ];

  // Datos Posiciones
  const posicionesData = [
    { id: 'BTC', name: 'Bitcoin EUR', ticker: 'BTC-EUR', compra: 67629.02, actual: 7.09, total: 68501.66, plPerc: '+1.29%', plVal: '+0.09', pos: true, color: '#f59e0b' },
    { id: 'S&P', name: 'Vanguard S&P 500', ticker: 'VUSA.AS', compra: 88.50, actual: 95.00, total: 95.00, plPerc: '+7.34%', plVal: '+6.50', pos: true, color: '#ef4444' }
  ];

  // Datos Ventas (Si está vacío [], el componente no se renderiza)
  const ventasData = [
    { id: 'TSLA', name: 'Tesla Inc', ticker: 'TSLA', fecha: '12 May 2026', detalles: 'Vendió 5 a 160,20 €', totalVenta: 801.00, plPerc: '+6.68%', plVal: '+50.20', pos: true, color: '#ef4444' }
  ];

  // Datos Transacciones (Clonados de tu captura)
  const transaccionesData = [
    { id: '1', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares MSCI ACWI ETF', detalles: 'Compró 197 a 101,26 €', total: 19948.22, logoInitial: 'i', logoColor: '#3d3d3d' },
    { id: '2', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'Alphabet Inc. Class A', detalles: 'Compró 30 a 340,33 €', total: 10209.75, logoInitial: 'Alph', logoColor: '#ef4444' },
    { id: '3', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'Intel', detalles: 'Compró 107 a 93,35 €', total: 9987.91, logoInitial: 'intel', logoColor: '#3b82f6' },
    { id: '4', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares Core MSCI EM IMI ETF', detalles: 'Compró 322 a 46,52 €', total: 14977.99, logoInitial: 'i', logoColor: '#3d3d3d' },
    { id: '5', fechaDia: '08.05', tipoIcono: 'buy' as const, asset: 'iShares Physical Gold ETC', detalles: 'Compró 193 a 77,73 €', total: 15000.93, logoInitial: 'i', logoColor: '#3d3d3d' },
  ];

  const tabs = ['Posiciones', 'Distribución', 'Rendimiento', 'Dividendos'];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Cartera de inversiones</h1>
        <p className="text-gray-400 text-sm">Mis inversiones · Seguimiento en tiempo real</p>
      </div>

      <InvestmentSummary balance={balanceData} chartData={chartData} activeTimeframe={activeTimeframe} onTimeframeChange={setActiveTimeframe} />

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

      {/* Renderizado de la pestaña Posiciones apilando los 3 componentes */}
      {activeTab === 'Posiciones' && (
        <div className="flex flex-col pb-10">
          <PositionsTable posiciones={posicionesData} />
          {/* El componente VentasTable tiene un if interno que hace que no se renderice si le pasas un array vacío [] */}
          <VentasTable ventas={ventasData} />
          <TransaccionesList transacciones={transaccionesData} mesLabel="mayo 2026" />
        </div>
      )}
      
      {activeTab !== 'Posiciones' && (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-10 flex items-center justify-center text-gray-500 italic">
          Módulo de {activeTab} en desarrollo...
        </div>
      )}
    </div>
  );
};
