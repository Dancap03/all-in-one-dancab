import { useState } from 'react';

export const useInvestment = () => {
  // Gestión de Vistas (que faltaba en mi código anterior)
  const [currentView, setCurrentView] = useState<'global' | 'bolsa' | 'proyecto'>('global');

  // Estados de dinero
  const [disponibleGlobal, setDisponibleGlobal] = useState(1250);
  const [totalInvertido, setTotalInvertido] = useState(8400); // Lo mantenemos por si lo usas
  const [bolsaDisponible, setBolsaDisponible] = useState(450);
  const [bolsaInvertido, setBolsaInvertido] = useState(5200);
  const [bolsaGanancias, setBolsaGanancias] = useState(320);
  const [proyectoDisponible, setProyectoDisponible] = useState(180);
  const [proyectoInvertido, setProyectoInvertido] = useState(3200);
  const [proyectoGanado, setProyectoGanado] = useState(1150);

  // Variable calculada que pedía tu Inversion.tsx
  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  // --- Funciones Manejadoras (Con los prefijos 'handle' correctos) ---
  
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
      // Lógica extra para enviar al Día a Día
    }
  };

  // AQUÍ ESTÁ LA CORRECCIÓN: 'diadia' -> 'balance'
  const handleEjecutarBolsa = (monto: number, tipo: 'propio' | 'ganancia' | 'balance') => {
    if (monto <= 0) return;
    
    if (tipo === 'propio') {
      setBolsaDisponible(prev => prev - monto);
      setBolsaInvertido(prev => prev + monto);
    } else if (tipo === 'ganancia') {
      setBolsaGanancias(prev => prev + monto);
      setBolsaDisponible(prev => prev + monto);
    } else if (tipo === 'balance') {
      // Regla de negocio: De disponible bolsa a Balance Global
      setBolsaDisponible(prev => prev - monto);
      setDisponibleGlobal(prev => prev + monto);
    }
  };

  // AQUÍ ESTÁ LA CORRECCIÓN: 'diadia' -> 'balance'
  const handleEjecutarProyecto = (modo: 'comprar' | 'vender' | 'balance', coste: number, venta?: number) => {
    if (coste <= 0) return;
    
    if (modo === 'comprar') {
      setProyectoDisponible(prev => prev - coste);
      setProyectoInvertido(prev => prev + coste);
    } else if (modo === 'vender' && venta) {
      setProyectoInvertido(prev => prev - coste);
      setProyectoDisponible(prev => prev + venta);
      setProyectoGanado(prev => prev + (venta - coste));
    } else if (modo === 'balance') {
      // Regla de negocio: De disponible proyecto a Balance Global
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
