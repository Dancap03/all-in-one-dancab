import { Calendar } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';
import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';
import { GlobalDetails } from './components/pages/GlobalDetails';
import { BolsaDetails } from './components/pages/BolsaDetails';
import { ProyectoDetails } from './components/pages/ProyectoDetails';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Inversion = () => {
  const navigate = useNavigate();
  const {
    currentView,
    setCurrentView,
    disponibleGlobal,
    totalInvertidoCalculado,
    bolsaDisponible,
    bolsaInvertido,
    bolsaGanancias,
    proyectoDisponible,
    proyectoInvertido,
    proyectoGanado,
    handleTransferirGlobal,
    handleEjecutarBolsa,
    handleEjecutarProyecto
  } = useInvestment();

  return (
    <div className="w-full text-white space-y-8 animate-in fade-in duration-200 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">
          Inversión
        </h1>
      </div>
      {currentView === 'global' && (
        <GlobalDetails 
          disponibleGlobal={disponibleGlobal} 
          totalInvertido={totalInvertidoCalculado} 
          onTransferir={handleTransferirGlobal} 
          onBack={() => setCurrentView('summary')} 
        />
      )}

      {currentView === 'bolsa' && (
        <BolsaDetails 
          bolsaDisponible={bolsaDisponible} 
          bolsaInvertido={bolsaInvertido} 
          bolsaGanancias={bolsaGanancias} 
          onEjecutarBolsa={handleEjecutarBolsa} 
          onBack={() => setCurrentView('summary')} 
        />
      )}

      {currentView === 'proyecto' && (
        <ProyectoDetails 
          proyectoDisponible={proyectoDisponible} 
          proyectoInvertido={proyectoInvertido} 
          proyectoGanado={proyectoGanado} 
          onEjecutarProyecto={handleEjecutarProyecto} 
          onBack={() => setCurrentView('summary')} 
        />
      )}

      {currentView === 'summary' && (
        <>
          <InvestmentSummaryCards 
            disponibleGlobal={disponibleGlobal} 
            totalInvertido={totalInvertidoCalculado}
            bolsaDisponible={bolsaDisponible} 
            bolsaInvertido={bolsaInvertido} 
            bolsaGanancias={bolsaGanancias}
            proyectoDisponible={proyectoDisponible} 
            proyectoInvertido={proyectoInvertido} 
            proyectoGanado={proyectoGanado}
            onTransferirGlobal={handleTransferirGlobal} 
            onEjecutarBolsa={handleEjecutarBolsa} 
            onEjecutarProyecto={handleEjecutarProyecto}
            onNavigate={(page) => setCurrentView(page)} 
          />
          
          <div className="flex items-center justify-between pt-4 px-1">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <h2 className="text-base font-black text-gray-200 uppercase tracking-widest">Historial de Capital Invertido</h2>
            </div>
          </div>
          
          <InvestmentHistory />
        </>
      )}
    </div>
  );
};
