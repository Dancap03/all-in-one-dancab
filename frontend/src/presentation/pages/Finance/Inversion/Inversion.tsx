import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { useInvestment } from './hooks/useInvestment';

import { InvestmentSummaryCards } from './components/InvestmentSummaryCards';
import { InvestmentHistory } from './components/InvestmentHistory';
import { BolsaDetails } from './components/pages/BolsaDetails';
import { ProyectoDetails } from './components/pages/ProyectoDetails';
import { GlobalDetails } from './components/pages/GlobalDetails';

export const Inversion = () => {
  const navigate = useNavigate();
  
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
    handleRecalcularTodo,
    handleLimpiarBasura // <-- Consumimos la purga
  } = useInvestment();

  const [hasHealed, setHasHealed] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      
      {/* CABECERA CON EL BOTÓN ROJO DE PURGA DE BASURA TEMPORAL */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white">Inversión</h1>
        </div>

        {/* 🚨 BOTÓN DE EMERGENCIA: Haz clic para vaciar de golpe los 1049 registros de 0,00€ */}
        <button 
          onClick={() => {
            if(confirm('¿Seguro que quieres eliminar todas las transacciones vacías de 0,00€ de Firestore?')) {
              handleLimpiarBasura();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800/30 hover:bg-rose-900 transition-all cursor-pointer"
        >
          <Trash2 size={14} /> Purgar 0,00 € Basura
        </button>
      </div>

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

      <div className="mt-8">
        <InvestmentHistory 
          movimientos={movimientos} 
          onDelete={eliminarMovimiento} 
        />
      </div>

    </div>
  );
};
