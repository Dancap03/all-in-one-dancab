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
    } fill {
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
    // 🛠️ CORREGIDO: Eliminado el 'vote =>' erróneo de aquí
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
      console.error("Error al editar y reenviar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarOperacionProyecto = async (
    idOperacion: string,
    projectId: string,
    tipo: 'compra' | 'venta',
    monto: number,
    label: string,
    costeOriginal: number = 0
  ) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      let nGlob = disponibleGlobal;
      let nPInv = proyectoInvertido;
      let nPGan = proyectoGanado;

      let pCompras = 0;
      let pVentas = 0;
      let pStock = 0;

      const projDocRef = doc(db, `users/${user.uid}/projects`, projectId);
      const projSnap = await getDoc(projDocRef);
      
      if (projSnap.exists()) {
        const pData = projSnap.data();
        pCompras = Number(pData.totalCompras || pData.comprasTotales || 0);
        pVentas = Number(pData.totalVentas || pData.ventasTotales || 0);
        pStock = Number(pData.stockActivo || pData.stockCoste || 0);
      }

      const txDocRef = doc(db, `users/${user.uid}/investment_transactions`, idOperacion);
      const txSnap = await getDoc(txDocRef);

      if (txSnap.exists()) {
        const oldTx = txSnap.data();
        const oldAmount = Math.abs(Number(oldTx.amount || 0));
        const oldCoste = Math.abs(Number(oldTx.costeOriginal || 0));
        const oldType = oldTx.type || (String(oldTx.label).toLowerCase().includes('venta') ? 'venta' : 'compra');

        if (oldType === 'venta') {
          nGlob -= oldAmount;
          nPInv += oldCoste;
          nPGan -= (oldAmount - oldCoste);
          
          pVentas -= oldAmount;
          pStock += oldCoste;
        } else {
          nGlob += oldAmount;
          nPInv -= oldAmount;
          
          pCompras -= oldAmount;
          pStock -= oldAmount;
        }

        await deleteDoc(txDocRef);
        try { await deleteDoc(doc(db, `users/${user.uid}/projects/${projectId}/transactions`, idOperacion)); } catch(e){}
        try { await deleteDoc(doc(db, `users/${user.uid}/projects/${projectId}/operations`, idOperacion)); } catch(e){}
      }

      const exactAmount = Math.abs(Number(monto));
      const exactCoste = Math.abs(Number(costeOriginal));

      if (tipo === 'venta') {
        nGlob += exactAmount;
        nPInv -= exactCoste;
        nPGan += (exactAmount - exactCoste);

        pVentas += exactAmount;
        pStock -= exactCoste;
      } else {
        nGlob -= exactAmount;
        nPInv += exactAmount;

        pCompras += exactAmount;
        pStock += exactAmount;
      }

      nGlob = Math.max(0, nGlob);
      nPInv = Math.max(0, nPInv);
      pStock = Math.max(0, pStock);
      pCompras = Math.max(0, pCompras);
      pVentas = Math.max(0, pVentas);

      const nuevoMovimiento = {
        id: idOperacion,
        amount: tipo === 'compra' ? -exactAmount : exactAmount,
        label: tipo === 'compra' ? `Compra De Stock: ${label}` : `Venta De Artículo: ${label}`,
        type: tipo,
        costeOriginal: tipo === 'venta' ? exactCoste : 0,
        projectId: projectId,
        dateString: new Date().toISOString().split('T')[0],
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, `users/${user.uid}/investment_transactions`, idOperacion), nuevoMovimiento);
      await setDoc(doc(db, `users/${user.uid}/projects/${projectId}/transactions`, idOperacion), nuevoMovimiento, { merge: true });
      await setDoc(doc(db, `users/${user.uid}/projects/${projectId}/operations`, idOperacion), nuevoMovimiento, { merge: true });

      const projectPayload = {
        totalCompras: pCompras,
        comprasTotales: pCompras,
        totalVentas: pVentas,
        ventasTotales: pVentas,
        stockActivo: pStock,
        stockCoste: pStock,
        beneficioNeto: pVentas - pCompras,
        roi: pCompras > 0 ? ((pVentas - pCompras) / pCompras) * 100 : 0,
        updatedAt: Timestamp.now()
      };
      await setDoc(projDocRef, projectPayload, { merge: true });

      await syncGlobalBalance(nGlob);
      setProyectoInvertido(nPInv);
      setProyectoGanado(nPGan);

      await guardarEnFirebase({
        proyectoInvertido: nPInv,
        proyectoGanado: nPGan
      });

      await cargarSaldos();
    } catch (e) {
      console.error("Error crítico procesando los balances del proyecto:", e);
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
      // 🛠️ CORREGIDO: Cambiado registrarMovimientoInvest por registrarMovimientoHistorial
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
    movimientos, eliminarMovimiento, handleEditarYReenviar, handleGuardarOperacionProyecto
  };
};
