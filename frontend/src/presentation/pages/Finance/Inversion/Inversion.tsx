import { Calendar } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';
import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';
import { GlobalDetails } from './components/pages/GlobalDetails';
import { BolsaDetails } from './components/pages/BolsaDetails';
import { ProyectoDetails } from './components/pages/ProyectoDetails';

export const Inversion = () => {
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
