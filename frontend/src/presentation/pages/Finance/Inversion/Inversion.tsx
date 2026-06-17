import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';
import { GlobalDetails } from './components/pages/GlobalDetails';
import { BolsaDetails } from './components/pages/BolsaDetails';
import { ProyectoDetails } from './components/pages/ProyectoDetails';

type ViewState = 'summary' | 'global' | 'bolsa' | 'proyecto';

export const Inversion = () => {
  const [currentView, setCurrentView] = useState<ViewState>('summary');

  const renderContent = () => {
    switch (currentView) {
      case 'global':
        return <GlobalDetails onBack={() => setCurrentView('summary')} />;
      case 'bolsa':
        return <BolsaDetails onBack={() => setCurrentView('summary')} />;
      case 'proyecto':
        return <ProyectoDetails onBack={() => setCurrentView('summary')} />;
      default:
        return (
          <>
            <InvestmentSummaryCards onNavigate={(page) => setCurrentView(page)} />

            <div className="flex items-center justify-between pt-4 px-1">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <h2 className="text-base font-black text-gray-200 uppercase tracking-widest">Historial de Capital Invertido</h2>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('aio_total_invertido_diadia_v2');
                  localStorage.removeItem('aio_inversion_movimientos_v2');
                  localStorage.removeItem('aio_inv_bolsa_disponible');
                  localStorage.removeItem('aio_inv_bolsa_invertido');
                  localStorage.removeItem('aio_inv_bolsa_ganancias');
                  localStorage.removeItem('aio_inv_proyecto_disponible');
                  localStorage.removeItem('aio_inv_proyecto_invertido');
                  localStorage.removeItem('aio_inv_proyecto_ganado');
                  window.location.reload();
                }}
                className="text-[10px] text-gray-600 hover:text-red-400 transition-colors font-bold cursor-pointer"
              >
                Limpiar todos los saldos de prueba
              </button>
            </div>

            <InvestmentHistory />
          </>
        );
    }
  };

  return (
    <div className="w-full text-white space-y-8 animate-in fade-in duration-200 pb-12">
      {renderContent()}
    </div>
  );
};
