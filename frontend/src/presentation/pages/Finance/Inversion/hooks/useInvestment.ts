import { useState, useEffect } from 'react';

type ViewState = 'summary' | 'global' | 'bolsa' | 'proyecto';

export const useInvestment = () => {
  const [currentView, setCurrentView] = useState<ViewState>('summary');
  
  const [disponibleGlobal, setDisponibleGlobal] = useState(0);
  const [bolsaDisponible, setBolsaDisponible] = useState(0);
  const [bolsaInvertido, setBolsaInvertido] = useState(0);
  const [bolsaGanancias, setBolsaGanancias] = useState(0);
  const [proyectoDisponible, setProyectoDisponible] = useState(0);
  const [proyectoInvertido, setProyectoInvertido] = useState(0);
  const [proyectoGanado, setProyectoGanado] = useState(0);

  const cargarSaldos = () => {
    setDisponibleGlobal(Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0));
    setBolsaDisponible(Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0));
    setBolsaInvertido(Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0));
    setBolsaGanancias(Number(localStorage.getItem('aio_inv_bolsa_ganancias') || 0));
    setProyectoDisponible(Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0));
    setProyectoInvertido(Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0));
    setProyectoGanado(Number(localStorage.getItem('aio_inv_proyecto_ganado') || 0));
  };

  useEffect(() => {
    cargarSaldos();
  }, [currentView]);

  const saveStorage = (key: string, value: number) => {
    localStorage.setItem(key, value.toString());
  };

  const registrarMovimientoHistorial = (monto: number, descripcion: string) => {
    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const newMov = {
      id: `mov-${Date.now()}`,
      amount: monto,
      label: descripcion,
      dateString: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([newMov, ...currentMovements]));
  };

  const handleTransferirGlobal = (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
    if (destino === 'diadia') {
      const nuevoGlobal = Math.max(0, disponibleGlobal - monto);
      setDisponibleGlobal(nuevoGlobal);
      saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);
      registrarMovimientoHistorial(-monto, 'Retirada de capital de Balance a Día a Día');
    } else {
      const nuevoGlobal = Math.max(0, disponibleGlobal - monto);
      setDisponibleGlobal(nuevoGlobal);
      saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);
      if (destino === 'bolsa') {
        const v = bolsaDisponible + monto; setBolsaDisponible(v); saveStorage('aio_inv_bolsa_disponible', v);
        registrarMovimientoHistorial(monto, 'Asignación de capital a Disponible de Bolsa');
      } else {
        const v = proyectoDisponible + monto; setProyectoDisponible(v); saveStorage('aio_inv_proyecto_disponible', v);
        registrarMovimientoHistorial(monto, 'Asignación de capital a Disponible de Proyectos');
      }
    }
    cargarSaldos();
  };

  // 🚀 MÁXIMA COMPATIBILIDAD: Soporta 'diadia' y 'balance' para que ningún componente falle
  const handleEjecutarBolsa = (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => {
    if (tipo === 'propio') {
      const nDisp = Math.max(0, bolsaDisponible - monto); setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      const nInv = bolsaInvertido + monto; setBolsaInvertido(nInv); saveStorage('aio_inv_bolsa_invertido', nInv);
      registrarMovimientoHistorial(monto, 'Inversión de fondos propios en Bolsa');
    } else if (tipo === 'ganancia') {
      const nGan = bolsaGanancias + monto; setBolsaGanancias(nGan); saveStorage('aio_inv_bolsa_ganancias', nGan);
      const nDisp = bolsaDisponible + monto; setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      registrarMovimientoHistorial(monto, 'Cobro de Dividendos / Premios reinvertidos');
    } else if (tipo === 'diadia' || tipo === 'balance') {
      const nDisp = Math.max(0, bolsaDisponible - monto); setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      const nuevoGlobal = disponibleGlobal + monto; setDisponibleGlobal(nuevoGlobal); saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);
      registrarMovimientoHistorial(-monto, 'Retorno de capital de Bolsa a Balance Global');
    }
    cargarSaldos();
  };

  // 🚀 MÁXIMA COMPATIBILIDAD: Soporta 'diadia' y 'balance'
  const handleEjecutarProyecto = (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      const nDisp = Math.max(0, proyectoDisponible - coste); setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = proyectoInvertido + coste; setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
      registrarMovimientoHistorial(coste, 'Compra de stock / Material para proyectos');
    } else if (modo === 'vender' && venta) {
      const ganancia = venta - coste;
      const nGan = proyectoGanado + ganancia; setProyectoGanado(nGan); saveStorage('aio_inv_proyecto_ganado', nGan);
      const nDisp = proyectoDisponible + venta; setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
      registrarMovimientoHistorial(ganancia, `Venta completada (Coste: ${coste}€ | Venta: ${venta}€)`);
    } else if (modo === 'diadia' || modo === 'balance') {
      const nDisp = Math.max(0, proyectoDisponible - coste); setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nuevoGlobal = disponibleGlobal + coste; setDisponibleGlobal(nuevoGlobal); saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);
      registrarMovimientoHistorial(-coste, 'Retorno de capital de Proyectos a Balance Global');
    }
    cargarSaldos();
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
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
  };
};
