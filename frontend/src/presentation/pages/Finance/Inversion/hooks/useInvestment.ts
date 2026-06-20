import { useState } from 'react';

export const useInvestment = () => {
  // Estados mockeados (sustituye los valores iniciales por los que vengan de tu backend/Firebase si es necesario)
  const [disponibleGlobal, setDisponibleGlobal] = useState(1250);
  const [totalInvertido, setTotalInvertido] = useState(8400);
  const [bolsaDisponible, setBolsaDisponible] = useState(450);
  const [bolsaInvertido, setBolsaInvertido] = useState(5200);
  const [bolsaGanancias, setBolsaGanancias] = useState(320);
  const [proyectoDisponible, setProyectoDisponible] = useState(180);
  const [proyectoInvertido, setProyectoInvertido] = useState(3200);
  const [proyectoGanado, setProyectoGanado] = useState(1150);

  // --- Función Global ---
  const transferirGlobal = (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
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
      // Aquí iría tu lógica para sumar el dinero a la cuenta corriente del Día a Día
    }
  };

  // --- Función Bolsa (Corregida con 'balance') ---
  const ejecutarBolsa = (monto: number, tipo: 'propio' | 'ganancia' | 'balance') => {
    if (monto <= 0) return;
    
    if (tipo === 'propio') {
      setBolsaDisponible(prev => prev - monto);
      setBolsaInvertido(prev => prev + monto);
    } else if (tipo === 'ganancia') {
      setBolsaGanancias(prev => prev + monto);
      setBolsaDisponible(prev => prev + monto);
    } else if (tipo === 'balance') {
      setBolsaDisponible(prev => prev - monto);
      setDisponibleGlobal(prev => prev + monto);
    }
  };

  // --- Función Proyecto (Corregida con 'balance') ---
  const ejecutarProyecto = (modo: 'comprar' | 'vender' | 'balance', coste: number, venta?: number) => {
    if (coste <= 0) return;
    
    if (modo === 'comprar') {
      setProyectoDisponible(prev => prev - coste);
      setProyectoInvertido(prev => prev + coste);
    } else if (modo === 'vender' && venta) {
      setProyectoInvertido(prev => prev - coste);
      setProyectoDisponible(prev => prev + venta);
      setProyectoGanado(prev => prev + (venta - coste));
    } else if (modo === 'balance') {
      setProyectoDisponible(prev => prev - coste);
      setDisponibleGlobal(prev => prev + coste);
    }
  };

  return {
    disponibleGlobal,
    totalInvertido,
    bolsaDisponible,
    bolsaInvertido,
    bolsaGanancias,
    proyectoDisponible,
    proyectoInvertido,
    proyectoGanado,
    transferirGlobal,
    ejecutarBolsa,
    ejecutarProyecto
  };
};
