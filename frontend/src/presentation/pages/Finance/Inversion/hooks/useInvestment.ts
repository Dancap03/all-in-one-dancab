import { useState, useEffect } from 'react';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

type ViewState = 'summary' | 'global' | 'bolsa' | 'proyecto';

export const useInvestment = () => {
  const [currentView, setCurrentView] = useState<ViewState>('summary');
  const [loading, setLoading] = useState(true);

  const [disponibleGlobal, setDisponibleGlobal] = useState(0);
  const [bolsaDisponible, setBolsaDisponible] = useState(0);
  const [bolsaInvertido, setBolsaInvertido] = useState(0);
  const [bolsaGanancias, setBolsaGanancias] = useState(0);
  const [proyectoDisponible, setProyectoDisponible] = useState(0);
  const [proyectoInvertido, setProyectoInvertido] = useState(0);
  const [proyectoGanado, setProyectoGanado] = useState(0);

  const cargarSaldos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Cargar el global (Mantengo lectura de localStorage por si Día a Día lo usa, y de Firebase si existe)
      const localGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setDisponibleGlobal(data.disponibleGlobal !== undefined ? data.disponibleGlobal : localGlobal);
        setBolsaDisponible(data.bolsaDisponible || 0);
        setBolsaInvertido(data.bolsaInvertido || 0);
        setBolsaGanancias(data.bolsaGanancias || 0);
        setProyectoDisponible(data.proyectoDisponible || 0);
        setProyectoInvertido(data.proyectoInvertido || 0);
        setProyectoGanado(data.proyectoGanado || 0);
      } else {
        // Migración desde LocalStorage la primera vez
        const bDisp = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
        const bInv = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
        const bGan = Number(localStorage.getItem('aio_inv_bolsa_ganancias') || 0);
        const pDisp = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
        const pInv = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
        const pGan = Number(localStorage.getItem('aio_inv_proyecto_ganado') || 0);

        setDisponibleGlobal(localGlobal);
        setBolsaDisponible(bDisp);
        setBolsaInvertido(bInv);
        setBolsaGanancias(bGan);
        setProyectoDisponible(pDisp);
        setProyectoInvertido(pInv);
        setProyectoGanado(pGan);

        // Guardar en Firebase para el futuro
        await setDoc(docRef, {
          disponibleGlobal: localGlobal,
          bolsaDisponible: bDisp,
          bolsaInvertido: bInv,
          bolsaGanancias: bGan,
          proyectoDisponible: pDisp,
          proyectoInvertido: pInv,
          proyectoGanado: pGan
        });
      }
    } catch (error) {
      console.error("Error cargando saldos de inversión:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, [currentView]);

  const guardarEnFirebase = async (nuevosSaldos: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      await setDoc(docRef, nuevosSaldos, { merge: true });
    } catch (error) {
      console.error("Error guardando saldos en Firebase:", error);
    }
  };

  const registrarMovimientoHistorial = async (monto: number, descripcion: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // Guardar en LocalStorage por compatibilidad y para la vista inmediata
    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const newMov = {
      id: `mov-${Date.now()}`,
      amount: monto,
      label: descripcion,
      dateString: new Date().toISOString()
    };
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([newMov, ...currentMovements]));

    // Guardar en Firebase
    try {
      await addDoc(collection(db, `users/${user.uid}/investment_transactions`), {
        amount: monto,
        label: descripcion,
        dateString: new Date().toISOString(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error guardando movimiento de inversión:", error);
    }
  };

  // Funciones de actualización (se simplifican un poco)
  const handleTransferirGlobal = async (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
    let nGlob = disponibleGlobal;
    let nBDisp = bolsaDisponible;
    let nPDisp = proyectoDisponible;

    if (destino === 'diadia') {
      nGlob = Math.max(0, disponibleGlobal - monto);
      registrarMovimientoHistorial(-monto, 'Retirada de capital de Balance a Día a Día');
    } else {
      nGlob = Math.max(0, disponibleGlobal - monto);
      if (destino === 'bolsa') {
        nBDisp = bolsaDisponible + monto;
        registrarMovimientoHistorial(monto, 'Asignación de capital a Disponible de Bolsa');
      } else {
        nPDisp = proyectoDisponible + monto;
        registrarMovimientoHistorial(monto, 'Asignación de capital a Disponible de Proyectos');
      }
    }

    setDisponibleGlobal(nGlob);
    setBolsaDisponible(nBDisp);
    setProyectoDisponible(nPDisp);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString()); // Mantener para Día a Día

    await guardarEnFirebase({
      disponibleGlobal: nGlob,
      bolsaDisponible: nBDisp,
      proyectoDisponible: nPDisp
    });
  };

  const handleEjecutarBolsa = async (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => {
    let nBDisp = bolsaDisponible;
    let nBInv = bolsaInvertido;
    let nBGan = bolsaGanancias;
    let nGlob = disponibleGlobal;

    if (tipo === 'propio') {
      nBDisp = Math.max(0, bolsaDisponible - monto);
      nBInv = bolsaInvertido + monto;
      registrarMovimientoHistorial(monto, 'Inversión de fondos propios en Bolsa');
    } else if (tipo === 'ganancia') {
      nBGan = bolsaGanancias + monto;
      nBDisp = bolsaDisponible + monto;
      registrarMovimientoHistorial(monto, 'Cobro de Dividendos / Premios reinvertidos');
    } else if (tipo === 'diadia' || tipo === 'balance') {
      nBDisp = Math.max(0, bolsaDisponible - monto);
      nGlob = disponibleGlobal + monto;
      registrarMovimientoHistorial(-monto, 'Retorno de capital de Bolsa a Balance Global');
    }

    setBolsaDisponible(nBDisp);
    setBolsaInvertido(nBInv);
    setBolsaGanancias(nBGan);
    setDisponibleGlobal(nGlob);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());

    await guardarEnFirebase({
      bolsaDisponible: nBDisp,
      bolsaInvertido: nBInv,
      bolsaGanancias: nBGan,
      disponibleGlobal: nGlob
    });
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    let nPDisp = proyectoDisponible;
    let nPInv = proyectoInvertido;
    let nPGan = proyectoGanado;
    let nGlob = disponibleGlobal;

    if (modo === 'comprar') {
      nPDisp = Math.max(0, proyectoDisponible - coste);
      nPInv = proyectoInvertido + coste;
      registrarMovimientoHistorial(coste, 'Compra de stock / Material para proyectos');
    } else if (modo === 'vender' && venta !== undefined) {
      const ganancia = venta - coste;
      nPGan = proyectoGanado + ganancia;
      nPDisp = proyectoDisponible + venta;
      nPInv = Math.max(0, proyectoInvertido - coste);
      registrarMovimientoHistorial(ganancia, `Venta completada (Coste: ${coste}€ | Venta: ${venta}€)`);
    } else if (modo === 'diadia' || modo === 'balance') {
      nPDisp = Math.max(0, proyectoDisponible - coste);
      nGlob = disponibleGlobal + coste;
      registrarMovimientoHistorial(-coste, 'Retorno de capital de Proyectos a Balance Global');
    }

    setProyectoDisponible(nPDisp);
    setProyectoInvertido(nPInv);
    setProyectoGanado(nPGan);
    setDisponibleGlobal(nGlob);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());

    await guardarEnFirebase({
      proyectoDisponible: nPDisp,
      proyectoInvertido: nPInv,
      proyectoGanado: nPGan,
      disponibleGlobal: nGlob
    });
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
    loading
  };
};
