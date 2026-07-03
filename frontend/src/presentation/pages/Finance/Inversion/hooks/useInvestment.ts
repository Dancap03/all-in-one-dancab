import { useState, useEffect } from 'react';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, Timestamp, arrayUnion } from 'firebase/firestore';

type ViewState = 'summary' | 'global' | 'bolsa' | 'proyecto';

export const useInvestment = () => {
  const [currentView, setCurrentView] = useState<ViewState>('summary');
  const [loading, setLoading] = useState(true);

  const [disponibleGlobal, setDisponibleGlobal] = useState(0);
  const [bolsaInvertido, setBolsaInvertido] = useState(0);
  const [bolsaGanancias, setBolsaGanancias] = useState(0);
  const [proyectoInvertido, setProyectoInvertido] = useState(0);
  const [proyectoGanado, setProyectoGanado] = useState(0);

  const [movimientos, setMovimientos] = useState<any[]>([]);

  const cargarSaldos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs: any[] = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      firebaseTxs.sort((a, b) => new Date(b.dateString || b.date || 0).getTime() - new Date(a.dateString || a.date || 0).getTime());
      setMovimientos(firebaseTxs);

      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};

      const localGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      let saldoReal = data.disponibleGlobal !== undefined ? data.disponibleGlobal : localGlobal;
      
      if (localGlobal !== data.disponibleGlobal) {
        saldoReal = localGlobal;
        await setDoc(docRef, { disponibleGlobal: saldoReal }, { merge: true });
      }

      setDisponibleGlobal(saldoReal);
      setBolsaInvertido(data.bolsaInvertido || 0);
      setBolsaGanancias(data.bolsaGanancias || 0);
      setProyectoInvertido(data.proyectoInvertido || 0);
      setProyectoGanado(data.proyectoGanado || 0);

    } catch (error) {
      console.error("Error cargando datos:", error);
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
      await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'data'), nuevosSaldos, { merge: true });
    } catch (error) {}
  };

  const syncGlobalBalance = async (nuevoSaldo: number) => {
    setDisponibleGlobal(nuevoSaldo);
    localStorage.setItem('aio_total_invertido_diadia_v2', nuevoSaldo.toString());
    await guardarEnFirebase({ disponibleGlobal: nuevoSaldo });
  };

  const registrarMovimientoHistorial = async (monto: number, descripcion: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const newId = `mov-${Date.now()}`;
    const newMov = { id: newId, amount: monto, label: descripcion, dateString: new Date().toISOString() };
    
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([newMov, ...currentMovements]));
    
    try {
      await setDoc(doc(db, `users/${user.uid}/investment_transactions`, newId), {
        amount: monto, label: descripcion, dateString: new Date().toISOString(), createdAt: new Date()
      });
      setMovimientos(prev => [newMov, ...prev]);
    } catch (error) {}
  };

  const eliminarMovimiento = async (id: string, amount: number, label: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/investment_transactions`, id)); } catch (e) {}

    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const filtered = currentMovements.filter((m: any) => m.id !== id);
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify(filtered));

    let nGlob = disponibleGlobal;
    let nBInv = bolsaInvertido;
    let nPInv = proyectoInvertido;
    let nBGan = bolsaGanancias;
    let nPGan = proyectoGanado;

    const lower = label.toLowerCase();
    
    if (lower.includes('bolsa')) {
      if (lower.includes('dividendo')) { nBGan -= amount; } 
      else { nGlob += amount; nBInv -= amount; } 
    } else if (lower.includes('proyecto')) {
      if (lower.includes('venta')) { nGlob -= amount; nPGan -= amount; } 
      else { nGlob += amount; nPInv -= amount; }
    } else {
      nGlob -= amount; 
    }

    nGlob = Math.max(0, nGlob); nBInv = Math.max(0, nBInv); nPInv = Math.max(0, nPInv);

    await syncGlobalBalance(nGlob); 
    setBolsaInvertido(nBInv); setProyectoInvertido(nPInv); setBolsaGanancias(nBGan); setProyectoGanado(nPGan);
    setMovimientos(prev => prev.filter(m => m.id !== id));
    await guardarEnFirebase({ bolsaInvertido: nBInv, proyectoInvertido: nPInv, bolsaGanancias: nBGan, proyectoGanado: nPGan });
  };

  const handleTransferirGlobal = async (monto: number, destino: string, concepto?: string) => {
    const esRetirada = destino === 'diadia' || destino === 'retirar';
    const labelFinal = concepto || (esRetirada ? 'Retorno a Día a Día' : 'Aportación de capital');
    const nuevoSaldo = esRetirada ? Math.max(0, disponibleGlobal - monto) : disponibleGlobal + monto;
    
    await syncGlobalBalance(nuevoSaldo);
    await registrarMovimientoHistorial(esRetirada ? -monto : monto, labelFinal);

    if (destino === 'diadia') {
      const user = auth.currentUser;
      if (user) {
        try {
          const newTxId = `tx-${Date.now()}`;
          const today = new Date();
          const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          const fechaLimpia = today.toISOString().split('T')[0];

          const txData = {
            id: newTxId,
            label: labelFinal, 
            concept: labelFinal,
            title: labelFinal,
            amount: Number(monto),
            type: 'income',                      
            tipo: 'ingreso',                     
            category: 'Inversión',
            dateString: fechaLimpia,             
            date: Timestamp.now()                
          };

          const monthDocRef = doc(db, `users/${user.uid}/finance_months/${currentMonthId}`);
          
          await setDoc(monthDocRef, {
            transactions: arrayUnion(txData)
          }, { merge: true });

          await setDoc(doc(db, `users/${user.uid}/finance_months/${currentMonthId}/transactions`, newTxId), txData);

          const localTrans = JSON.parse(localStorage.getItem('transactions') || '[]');
          localStorage.setItem('transactions', JSON.stringify([txData, ...localTrans]));
          
        } catch (e) {
          console.error("Error enviando saldo a Día a Día:", e);
        }
      }
    }

    cargarSaldos();
  };

  const handleEditarYReenviar = async (id: string, nuevoMonto: number, nuevoConcepto: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date();
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const fechaLimpia = today.toISOString().split('T')[0];

      const invTxRef = doc(db, `users/${user.uid}/investment_transactions`, id);
      await setDoc(invTxRef, {
        amount: Number(nuevoMonto),
        label: nuevoConcepto,
        dateString: today.toISOString(),
        updatedAt: Timestamp.now()
      }, { merge: true });

      const txData = {
        id: id,
        label: nuevoConcepto,
        concept: nuevoConcepto,
        title: nuevoConcepto,
        amount: Math.abs(Number(nuevoMonto)),
        type: 'income',
        tipo: 'ingreso',
        category: 'Inversión',
        dateString: fechaLimpia,
        date: Timestamp.now()
      };

      const monthDocRef = doc(db, `users/${user.uid}/finance_months/${currentMonthId}`);
      
      const docSnap = await getDoc(monthDocRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const currentList = currentData.transactions || [];
        const updatedList = currentList.filter((t: any) => t.id !== id);
        updatedList.push(txData);
        
        await setDoc(monthDocRef, { transactions: updatedList }, { merge: true });
      } else {
        await setDoc(monthDocRef, { transactions: [txData] }, { merge: true });
      }

      await setDoc(doc(db, `users/${user.uid}/finance_months/${currentMonthId}/transactions`, id), txData);

      const localTrans = JSON.parse(localStorage.getItem('transactions') || '[]');
      const filteredLocal = localTrans.filter((tx: any) => tx.id !== id);
      localStorage.setItem('transactions', JSON.stringify([txData, ...filteredLocal]));

      await cargarSaldos();
    } catch (error) {
      console.error("Error al editar y reenviar el movimiento:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 NUEVA FUNCIÓN 1: EDITAR UNA OPERACIÓN ESPECÍFICA DE UN PROYECTO RECALCULANDO TODO
  const handleEditarOperacionProyecto = async (
    idOperacion: string,
    tipo: 'compra' | 'venta',
    valoresAntiguos: { coste: number; venta?: number },
    valoresNuevos: { coste: number; venta?: number; label?: string }
  ) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      let diffInvertido = 0;
      let diffGanado = 0;

      if (tipo === 'compra') {
        diffInvertido = valoresNuevos.coste - valoresAntiguos.coste;
      } else if (tipo === 'venta' && valoresAntiguos.venta !== undefined && valoresNuevos.venta !== undefined) {
        const gananciaAntigua = valoresAntiguos.venta - valoresAntiguos.coste;
        const gananciaNueva = valoresNuevos.venta - valoresNuevos.coste;
        
        diffInvertido = valoresNuevos.coste - valoresAntiguos.coste;
        diffGanado = gananciaNueva - gananciaAntigua;
      }

      const nProyectoInvertido = Math.max(0, proyectoInvertido + diffInvertido);
      const nProyectoGanado = proyectoGanado + diffGanado;

      setProyectoInvertido(nProyectoInvertido);
      setProyectoGanado(nProyectoGanado);

      await guardarEnFirebase({
        proyectoInvertido: nProyectoInvertido,
        proyectoGanado: nProyectoGanado
      });

      if (valoresNuevos.label) {
        await registrarMovimientoHistorial(
          tipo === 'compra' ? -valoresNuevos.coste : (valoresNuevos.venta || 0),
          `Edición: ${valoresNuevos.label}`
        );
      }

      await cargarSaldos();
    } catch (e) {
      console.error("Error editando operación de proyecto:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 NUEVA FUNCIÓN 2: FORZAR BALANCES MANUALMENTE DESDE LA INTERFAZ PARA ARREGLAR ERRORES DE BORRADO
  const handleForzarBalancesProyecto = async (nuevoInvertido: number, nuevoGanado: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      setProyectoInvertido(nuevoInvertido);
      setProyectoGanado(nuevoGanado);

      await guardarEnFirebase({
        proyectoInvertido: nuevoInvertido,
        proyectoGanado: nuevoGanado
      });

      await registrarMovimientoHistorial(0, 'Ajuste manual de balances de Proyectos');
      await cargarSaldos();
    } catch (e) {
      console.error("Error forzando balances:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEjecutarBolsa = async (monto: number, tipo: string, costeOriginal?: number) => {
    if (tipo === 'propio') {
      await registrarMovimientoHistorial(-monto, 'Compra Bolsa (Saldo Disponible)');
      await syncGlobalBalance(Math.max(0, disponibleGlobal - monto));
      const n = bolsaInvertido + monto; setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
    } else if (tipo === 'ganancia_compra') {
      await registrarMovimientoHistorial(-monto, 'Re-inversión Bolsa (Dividendos)');
      const nGan = Math.max(0, bolsaGanancias - monto); setBolsaGanancias(nGan);
      const nInv = bolsaInvertido + monto; setBolsaInvertido(nInv);
      guardarEnFirebase({ bolsaGanancias: nGan, bolsaInvertido: nInv });
    } else if (tipo === 'otro_compra') {
      await registrarMovimientoHistorial(-monto, 'Compra Bolsa (Dinero Externo)');
      const n = bolsaInvertido + monto; setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
    } else if (tipo === 'ganancia') {
      await registrarMovimientoHistorial(monto, 'Cobro de Dividendos en Bolsa');
      const n = bolsaGanancias + monto; setBolsaGanancias(n); guardarEnFirebase({ clanG: n, bolsaGanancias: n });
    } else if (tipo === 'vender') {
      const gananciaLimpia = monto - (costeOriginal || 0); 
      await registrarMovimientoHistorial(monto, `Venta en Bolsa ${gananciaLimpia >= 0 ? '(Beneficio)' : '(Pérdida)'}`);
      await syncGlobalBalance(disponibleGlobal + monto);
      const nInv = Math.max(0, bolsaInvertido - (costeOriginal || 0)); setBolsaInvertido(nInv);
      const nGan = bolsaGanancias + gananciaLimpia; setBolsaGanancias(nGan);
      guardarEnFirebase({ bolsaInvertido: nInv, bolsaGanancias: nGan });
    } else if (tipo === 'deshacer_propio') {
      await registrarMovimientoHistorial(monto, 'Ajuste: Deshacer Compra (Propio)');
      const n = Math.max(0, bolsaInvertido - monto); setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
      await syncGlobalBalance(disponibleGlobal + monto); 
    } else if (tipo === 'deshacer_ganancia') {
      await registrarMovimientoHistorial(monto, 'Ajuste: Deshacer Compra (Dividendos)');
      const nInv = Math.max(0, bolsaInvertido - monto); setBolsaInvertido(nInv);
      const nGan = bolsaGanancias + monto; setBolsaGanancias(nGan);
      guardarEnFirebase({ bolsaInvertido: nInv, bolsaGanancias: nGan }); 
    } else if (tipo === 'deshacer_otro') {
      await registrarMovimientoHistorial(monto, 'Ajuste: Deshacer Compra (Externo)');
      const n = Math.max(0, bolsaInvertido - monto); setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
    } else if (tipo === 'balance') {
      await registrarMovimientoHistorial(monto, 'Ajuste de Cartera (Borrado)');
      const n = Math.max(0, bolsaInvertido - monto); setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
      await syncGlobalBalance(disponibleGlobal + monto);
    }
    cargarSaldos();
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      await registrarMovimientoHistorial(-coste, 'Inversión en Proyectos');
      const n = proyectoInvertido + coste; setProyectoInvertido(n); guardarEnFirebase({ proyectoInvertido: n });
      await syncGlobalBalance(Math.max(0, disponibleGlobal - coste));
    } else if (modo === 'vender' && venta !== undefined) {
      await registrarMovimientoHistorial(venta, 'Venta de proyecto completada');
      const nGan = proyectoGanado + (venta - coste); setProyectoGanado(nGan);
      const nInv = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(nInv);
      guardarEnFirebase({ proyectoGanado: nGan, proyectoInvertido: nInv });
      await syncGlobalBalance(disponibleGlobal + venta);
    } else {
      await registrarMovimientoHistorial(coste, 'Retorno de capital de Proyectos');
      const n = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(n); guardarEnFirebase({ proyectoInvertido: n });
      await syncGlobalBalance(disponibleGlobal + coste);
    }
    cargarSaldos();
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
    currentView, setCurrentView, disponibleGlobal, totalInvertidoCalculado, bolsaDisponible: 0,
    bolsaInvertido, bolsaGanancias, proyectoDisponible: 0, proyectoInvertido, proyectoGanado,
    handleTransferirGlobal, handleEjecutarBolsa, handleEjecutarProyecto, loading,
    movimientos, eliminarMovimiento, handleEditarYReenviar, handleEditarOperacionProyecto, handleForzarBalancesProyecto
  };
};
