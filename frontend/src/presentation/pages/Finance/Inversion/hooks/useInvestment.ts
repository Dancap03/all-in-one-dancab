import { useState } from 'react';

export const useInvestment = () => {
  // 1. Añadimos 'summary' para solucionar los errores TS2345 en Inversion.tsx
  const [currentView, setCurrentView] = useState<'summary' | 'global' | 'bolsa' | 'proyecto'>('summary');

  // Estados de dinero
  const [disponibleGlobal, setDisponibleGlobal] = useState(1250);
  const [totalInvertido, setTotalInvertido] = useState(8400); 
  const [bolsaDisponible, setBolsaDisponible] = useState(450);
  const [bolsaInvertido, setBolsaInvertido] = useState(5200);
  const [bolsaGanancias, setBolsaGanancias] = useState(320);
  const [proyectoDisponible, setProyectoDisponible] = useState(180);
  const [proyectoInvertido, setProyectoInvertido] = useState(3200);
  const [proyectoGanado, setProyectoGanado] = useState(1150);

  // Variable calculada 
  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  const handleTransferirGlobal = (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
    if (monto <= 0) return;
    if (destino !== 'diadia' && monto > disponibleGlobal) return;

    if (destino === 'bolsa') {
      setDisponibleGlobal(prev => prev - monto);
      setBolsaDisponible(prev => prev + monto);
    } else if (destino === 'proyecto') {
      setDisponibleGlobal(prev => prev - monto);
      setProyectoDisponible(prev => prev + monto);
    } else if (destino === 'diadia') {
      setDisponibleGlobal(prev => prev - monto);
      // Lógica extra para Día a Día
    }
  };

  // 2. Mantenemos el tipo 'diadia' para que no choque con InvestmentSummaryCards.tsx, 
  // pero cambiamos la lógica para que el dinero vaya al disponibleGlobal.
  const handleEjecutarBolsa = (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => {
    if (monto <= 0) return;
    
    if (tipo === 'propio') {
      setBolsaDisponible(prev => prev - monto);
      setBolsaInvertido(prev => prev + monto);
    } else if (tipo === 'ganancia') {
      setBolsaGanancias(prev => prev + monto);
      setBolsaDisponible(prev => prev + monto);
    } else if (tipo === 'diadia') {
      // NUEVA REGLA: Retorna a Balance Global
      setBolsaDisponible(prev => prev - monto);
      setDisponibleGlobal(prev => prev + monto);
    }
  };

  const handleEjecutarProyecto = (modo: 'comprar' | 'vender' | 'diadia', coste: number, venta?: number) => {
    if (coste <= 0) return;
    
    if (modo === 'comprar') {
      setProyectoDisponible(prev => prev - coste);
      setProyectoInvertido(prev => prev + coste);
    } else if (modo === 'vender' && venta) {
      setProyectoInvertido(prev => prev - coste);
      setProyectoDisponible(prev => prev + venta);
      setProyectoGanado(prev => prev + (venta - coste));
    } else if (modo === 'diadia') {
      // NUEVA REGLA: Retorna a Balance Global
      setProyectoDisponible(prev => prev - coste);
      setDisponibleGlobal(prev => prev + coste);
    }
  };

  return {
    currentView,
    setCurrentView,
    disponibleGlobal,
    totalInvertido,
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
  };
};
