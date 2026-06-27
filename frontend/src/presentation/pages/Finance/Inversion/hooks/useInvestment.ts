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
      console.error("Error guardando saldos:", error);
    }
  };

  const registrarMovimientoHistorial = async (monto: number, descripcion: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const newMov = { id: `mov-${Date.now()}`, amount: monto, label: descripcion, dateString: new Date().toISOString() };
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([newMov, ...currentMovements]));
    try {
      await addDoc(collection(db, `users/${user.uid}/investment_transactions`), {
        amount: monto, label: descripcion, dateString: new Date().toISOString(), createdAt: new Date()
      });
    } catch (error) {}
  };

  const handleTransferirGlobal = async (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => {
    let nGlob = disponibleGlobal;
    if (destino === 'diadia') {
      nGlob = Math.max(0, disponibleGlobal - monto);
      registrarMovimientoHistorial(-monto, 'Retirada de capital de Balance a Día a Día');
    }
    setDisponibleGlobal(nGlob);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());
    await guardarEnFirebase({ disponibleGlobal: nGlob });
  };

  // 🚀 LÓGICA DE BOLSA UNIFICADA CON LA CAJA FUERTE GLOBAL
  const handleEjecutarBolsa = async (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => {
    let nBInv = bolsaInvertido;
    let nBGan = bolsaGanancias;
    let nGlob = disponibleGlobal;

    if (tipo === 'propio') {
      nGlob = Math.max(0, disponibleGlobal - monto); // Resta del saldo global
      nBInv = bolsaInvertido + monto; // Suma a acciones activas
      registrarMovimientoHistorial(monto, 'Compra de activos en Bolsa');
    } else if (tipo === 'ganancia') {
      nBGan = bolsaGanancias + monto;
      registrarMovimientoHistorial(monto, 'Cobro de Dividendos / Premios');
    } else if (tipo === 'diadia' || tipo === 'balance') {
      nBInv = Math.max(0, bolsaInvertido - monto);
      nGlob = disponibleGlobal + monto; // Devuelve el dinero vendido al global
      registrarMovimientoHistorial(-monto, 'Venta de activos en Bolsa');
    }

    setBolsaInvertido(nBInv);
    setBolsaGanancias(nBGan);
    setDisponibleGlobal(nGlob);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());
    await guardarEnFirebase({ bolsaInvertido: nBInv, bolsaGanancias: nBGan, disponibleGlobal: nGlob });
  };

  // 🚀 LÓGICA DE PROYECTOS UNIFICADA CON LA CAJA FUERTE GLOBAL
  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    let nPInv = proyectoInvertido;
    let nPGan = proyectoGanado;
    let nGlob = disponibleGlobal;

    if (modo === 'comprar') {
      nGlob = Math.max(0, disponibleGlobal - coste); // Resta del saldo global
      nPInv = proyectoInvertido + coste;
      registrarMovimientoHistorial(coste, 'Inversión en Proyectos');
    } else if (modo === 'vender' && venta !== undefined) {
      const ganancia = venta - coste;
      nPGan = proyectoGanado + ganancia;
      nPInv = Math.max(0, proyectoInvertido - coste);
      nGlob = disponibleGlobal + venta; // El dinero total de la venta vuelve al global
      registrarMovimientoHistorial(ganancia, `Venta de proyecto completada`);
    } else if (modo === 'diadia' || modo === 'balance') {
      nPInv = Math.max(0, proyectoInvertido - coste);
      nGlob = disponibleGlobal + coste;
      registrarMovimientoHistorial(-coste, 'Retorno de capital de Proyectos');
    }

    setProyectoInvertido(nPInv);
    setProyectoGanado(nPGan);
    setDisponibleGlobal(nGlob);
    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());
    await guardarEnFirebase({ proyectoInvertido: nPInv, proyectoGanado: nPGan, disponibleGlobal: nGlob });
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
    currentView, setCurrentView, disponibleGlobal, totalInvertidoCalculado, bolsaDisponible,
    bolsaInvertido, bolsaGanancias, proyectoDisponible, proyectoInvertido, proyectoGanado,
    handleTransferirGlobal, handleEjecutarBolsa, handleEjecutarProyecto, loading
  };
};
