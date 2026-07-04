import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';

// Importamos tus componentes y páginas modulares reales
import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';
import { BolsaDetails } from './components/pages/BolsaDetails';
import { ProyectoDetails } from './components/pages/ProyectoDetails';
import { GlobalDetails } from './components/pages/GlobalDetails';

export const Inversion = () => {
  const navigate = useNavigate();
  
  // Extraemos todos los estados y funciones nativas de tu hook
  const {
    currentView,
    setCurrentView,
    disponibleGlobal,
    totalInvertidoCalculado,
    bolsaInvertido,
    bolsaGanancias,
    proyectoInvertido,
    proyectoGanado,
    movimientos,
    loading,
    handleTransferirGlobal,
    handleEjecutarBolsa,
    handleEjecutarProyecto,
    eliminarMovimiento,
    handleRecalcularTodo
  } = useInvestment();

  const [hasHealed, setHasHealed] = useState(false);

  // Auto-heal controlado para actualizar saldos de Firebase una sola vez al entrar
  useEffect(() => {
    if (!loading && !hasHealed) {
      setHasHealed(true);
      handleRecalcularTodo();
    }
  }, [loading, hasHealed, handleRecalcularTodo]);

  if (loading && !hasHealed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 🚀 CONTROLADOR DE NAVEGACIÓN ORIGINAL RECONECTADO CON TUS COMPONENTES REALES
  if (currentView === 'global') {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
        <GlobalDetails 
          disponibleGlobal={disponibleGlobal}
          totalInvertido={totalInvertidoCalculado}
          onTransferir={(monto, destino) => handleTransferirGlobal(monto, destino)}
          onBack={() => setCurrentView('summary')}
        />
      </div>
    );
  }

  if (currentView === 'bolsa') {
    return (
      <BolsaDetails 
        disponibleGlobal={disponibleGlobal}
        bolsaInvertido={bolsaInvertido}
        bolsaGanancias={bolsaGanancias}
        onEjecutarBolsa={handleEjecutarBolsa}
        onBack={() => setCurrentView('summary')}
      />
    );
  }

  if (currentView === 'proyecto') {
    return (
      <ProyectoDetails 
        proyectoDisponible={disponibleGlobal}
        proyectoInvertido={proyectoInvertido}
        proyectoGanado={proyectoGanado}
        onEjecutarProyecto={handleEjecutarProyecto}
        onBack={() => setCurrentView('summary')}
      />
    );
  }

  // 🚀 INTERFAZ HOME (SUMMARY) CON EL DISEÑO ASOCIADO DE TUS TARJETAS E HISTORIAL COMPLETO
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* Cabecera Principal */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white">Inversión</h1>
      </div>

      {/* Tus Tarjetas de Balance e Interacción originales */}
      <InvestmentSummaryCards 
        disponibleGlobal={disponibleGlobal}
        totalInvertido={totalInvertidoCalculado}
        bolsaDisponible={0}
        bolsaInvertido={bolsaInvertido}
        bolsaGanancias={bolsaGanancias}
        proyectoDisponible={0}
        proyectoInvertido={proyectoInvertido}
        proyectoGanado={proyectoGanado}
        onTransferirGlobal={handleTransferirGlobal}
        onEjecutarBolsa={handleEjecutarBolsa}
        onEjecutarProyecto={handleEjecutarProyecto}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Historial interactivo con borrado seguro conectado */}
      <div className="mt-8">
        <InvestmentHistory 
          movimientos={movimientos} 
          onDelete={eliminarMovimiento} 
        />
      </div>

    </div>
  );
};
