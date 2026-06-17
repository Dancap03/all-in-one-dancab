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

  const registrarRetiradaHistorial = (monto: number, procedencia: string) => {
    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const newMov = {
      id: `ret-${Date.now()}`,
      amount: -monto,
      label: `Retirada para Día a Día (${procedencia})`,
      dateString: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([newMov, ...currentMovements]));
  };

  const handleTransferirGlobal = (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
    if (destino === 'diadia') {
      const nuevoGlobal = disponibleGlobal + monto;
      setDisponibleGlobal(nuevoGlobal);
      saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);
      registrarRetiradaHistorial(monto, 'Balance Global');
    } else {
      const nuevoGlobal = Math.max(0, disponibleGlobal - monto);
      setDisponibleGlobal(nuevoGlobal);
      saveStorage('aio_total_invertido_diadia_v2', nuevoGlobal);

      if (destino === 'bolsa') {
        const v = bolsaDisponible + monto; setBolsaDisponible(v); saveStorage('aio_inv_bolsa_disponible', v);
      } else {
        const v = proyectoDisponible + monto; setProyectoDisponible(v); saveStorage('aio_inv_proyecto_disponible', v);
      }
    }
    cargarSaldos();
  };

  const handleEjecutarBolsa = (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => {
    if (tipo === 'propio') {
      const nDisp = Math.max(0, bolsaDisponible - monto); setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      const nInv = bolsaInvertido + monto; setBolsaInvertido(nInv); saveStorage('aio_inv_bolsa_invertido', nInv);
    } else if (tipo === 'ganancia') {
      const nGan = bolsaGanancias + monto; setBolsaGanancias(nGan); saveStorage('aio_inv_bolsa_ganancias', nGan);
      const nDisp = bolsaDisponible + monto; setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
    } else if (tipo === 'diadia') {
      const nDisp = Math.max(0, bolsaDisponible - monto); setBolsaDisponible(nDisp); saveStorage('aio_inv_bolsa_disponible', nDisp);
      const currentGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      saveStorage('aio_total_invertido_diadia_v2', currentGlobal + monto);
      registrarRetiradaHistorial(monto, 'Bolsa');
    }
    cargarSaldos();
  };

  const handleEjecutarProyecto = (modo: 'comprar' | 'vender' | 'diadia', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      const nDisp = Math.max(0, proyectoDisponible - coste); setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = proyectoInvertido + coste; setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
    } else if (modo === 'vender' && venta) {
      const ganancia = venta - coste;
      const nGan = proyectoGanado + ganancia; setProyectoGanado(nGan); saveStorage('aio_inv_proyecto_ganado', nGan);
      const nDisp = proyectoDisponible + venta; setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const nInv = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(nInv); saveStorage('aio_inv_proyecto_invertido', nInv);
    } else if (modo === 'diadia') {
      const nDisp = Math.max(0, proyectoDisponible - coste); setProyectoDisponible(nDisp); saveStorage('aio_inv_proyecto_disponible', nDisp);
      const currentGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      saveStorage('aio_total_invertido_diadia_v2', currentGlobal + coste);
      registrarRetiradaHistorial(coste, 'Proyectos Propios');
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
    handleEjecutarProyecto,
    cargarSaldos
  };
};
