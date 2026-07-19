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

  // 🚀 ESCÁNER MAESTRO: Carga los saldos y rescata automáticamente el dinero atrapado
  const cargarSaldos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};

      // Liquidez base conocida
      let saldoLiquidoReal = data.disponibleGlobal !== undefined ? Number(data.disponibleGlobal) : Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      let saldoModificado = false;

      // 1. MAPEO DEL HISTORIAL GLOBAL (Para saber qué tenemos y qué nos falta)
      const globalTxRef = collection(db, `users/${user.uid}/investment_transactions`);
      const globalSnap = await getDocs(globalTxRef);
      const globalIds = new Set(globalSnap.docs.map(d => d.id));

      // 2. ESCÁNER PROFUNDO DE PROYECTOS (Aquí atraparemos los 62,50€ perdidos)
      const projCol = await getDocs(collection(db, `users/${user.uid}/projects`));
      const projectIds = projCol.docs.map(d => d.id);
      if (!projectIds.includes('wallapop')) projectIds.push('wallapop');

      let acumuladoStock = 0;
      let acumuladoGanancia = 0;

      for (const pid of projectIds) {
        // Obtenemos saldos oficiales del proyecto (Ej: Stock = 0, Beneficio = +23.69)
        const pDoc = await getDoc(doc(db, `users/${user.uid}/projects`, pid));
        if (pDoc.exists()) {
           const pd = pDoc.data();
           acumuladoStock += Number(pd.stockActivo !== undefined ? pd.stockActivo : (pd.stockCoste || 0));
           acumuladoGanancia += Number(pd.beneficioNeto || 0);
        }

        // Rastrear operaciones huérfanas en las dos subcolecciones posibles
        const paths = [`transactions`, `operations`];
        for (const sub of paths) {
          try {
            const subSnap = await getDocs(collection(db, `users/${user.uid}/projects/${pid}/${sub}`));
            for (const subDoc of subSnap.docs) {
              if (!globalIds.has(subDoc.id)) {
                // 🚨 ¡OPERACIÓN PERDIDA ENCONTRADA! Rescatando...
                const txData = subDoc.data();
                const amt = Math.abs(Number(txData.amount || 0));
                const isVenta = txData.type === 'venta' || String(txData.label).toLowerCase().includes('venta') || Number(txData.amount) > 0;

                const recoveredTx = {
                  id: subDoc.id,
                  amount: isVenta ? amt : -amt,
                  label: txData.label || (isVenta ? 'Venta De Artículo' : 'Compra De Stock'),
                  type: isVenta ? 'venta' : 'compra',
                  costeOriginal: txData.costeOriginal || 0,
                  projectId: pid,
                  dateString: txData.dateString || new Date().toISOString().split('T')[0],
                  createdAt: txData.createdAt || Timestamp.now(),
                  date: txData.date || Timestamp.now()
                };

                // Guardamos la copia globalmente
                await setDoc(doc(db, `users/${user.uid}/investment_transactions`, subDoc.id), recoveredTx);
                globalIds.add(subDoc.id);

                // Ajustamos tu líquido automáticamente
                if (isVenta) {
                  saldoLiquidoReal += amt; // Aquí se suman los 62,50€ a tu bolsillo
                } else {
                  saldoLiquidoReal -= amt;
                }
                saldoModificado = true;
              }
            }
          } catch (e) {} 
        }
      }

      // Si el escáner ha encontrado algo y sumado el dinero, lo guardamos para siempre
      if (saldoModificado) {
        saldoLiquidoReal = Math.max(0, saldoLiquidoReal);
        await setDoc(docRef, { disponibleGlobal: saldoLiquidoReal }, { merge: true });
        localStorage.setItem('aio_total_invertido_diadia_v2', saldoLiquidoReal.toString());
      }

      // 3. RECARGAMOS LOS MOVIMIENTOS DEFINITIVOS PARA MOSTRARLOS
      const finalSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs = finalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      firebaseTxs.sort((a, b) => new Date(b.dateString || b.date || 0).getTime() - new Date(a.dateString || a.date || 0).getTime());
      setMovimientos(firebaseTxs);

      const bInvertido = data.bolsaInvertido !== undefined ? Number(data.bolsaInvertido) : 200.00;
      const bGanancias = data.bolsaGanancias !== undefined ? Number(data.bolsaGanancias) : 65.05;

      setDisponibleGlobal(saldoLiquidoReal);
      setBolsaInvertido(bInvertido);
      setBolsaGanancias(bGanancias);
      setProyectoInvertido(acumuladoStock);
      setProyectoGanado(acumuladoGanancia);

      // Rentabilidad real e invulnerable
      const bNeto = bGanancias + acumuladoGanancia;
      const capReal = bInvertido + acumuladoStock;
      const roi = capReal > 0 ? (bNeto / capReal) * 100 : 0;

      await setDoc(docRef, {
        proyectoInvertido: acumuladoStock,
        proyectoGanado: acumuladoGanancia,
        rentabilidadAbsoluta: bNeto,
        rentabilidadPorcentaje: roi
      }, { merge: true });

    } catch (error) {
      console.error("Error crítico en el rastreador de saldos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, [currentView]);

  const handleRecalcularTodo = async () => {
    await cargarSaldos();
  };

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
          
          await setDoc(monthDocRef, { transactions: arrayUnion(txData) }, { merge: true });
          await setDoc(doc(db, `users/${user.uid}/finance_months/${currentMonthId}/transactions`, newTxId), txData);

          const localTrans = JSON.parse(localStorage.getItem('transactions') || '[]');
          localStorage.setItem('transactions', JSON.stringify([txData, ...localTrans]));
          
        } catch (e) {}
      }
    }
    await cargarSaldos();
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
        id: id, label: nuevoConcepto, concept: nuevoConcepto, title: nuevoConcepto,
        amount: Math.abs(Number(nuevoMonto)), type: 'income', tipo: 'ingreso',
        category: 'Inversión', dateString: fechaLimpia, date: Timestamp.now()
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
      let pCompras = 0, pVentas = 0, pStock = 0;

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
          pVentas -= oldAmount;
          pStock += oldCoste;
        } else {
          nGlob += oldAmount;
          pCompras -= oldAmount;
          pStock -= oldAmount;
        }
        await deleteDoc(txDocRef);
        try { await deleteDoc(doc(db, `users/${user.uid}/projects/${projectId}/transactions`, idOperacion)); } catch(e){}
      }

      const exactAmount = Math.abs(Number(monto));
      const exactCoste = Math.abs(Number(costeOriginal));

      if (tipo === 'venta') {
        nGlob += exactAmount;
        pVentas += exactAmount;
        pStock -= exactCoste;
      } else {
        nGlob -= exactAmount;
        pCompras += exactAmount;
        pStock += exactAmount;
      }

      nGlob = Math.max(0, nGlob); pStock = Math.max(0, pStock);

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

      // 🛠️ ¡CORREGIDO! Ahora sí o sí la operación queda guardada en el historial general a la vez que en el proyecto
      await setDoc(doc(db, `users/${user.uid}/investment_transactions`, idOperacion), nuevoMovimiento);
      await setDoc(doc(db, `users/${user.uid}/projects/${projectId}/transactions`, idOperacion), nuevoMovimiento, { merge: true });

      await setDoc(projDocRef, {
        totalCompras: pCompras, comprasTotales: pCompras,
        totalVentas: pVentas, ventasTotales: pVentas,
        stockActivo: pStock, stockCoste: pStock,
        beneficioNeto: pVentas - pCompras,
        roi: pCompras > 0 ? ((pVentas - pCompras) / pCompras) * 100 : 0,
        updatedAt: Timestamp.now()
      }, { merge: true });

      await syncGlobalBalance(nGlob);
      await cargarSaldos();
    } catch (e) {
      console.error("Error guardando operación en proyecto:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarBasura = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setLoading(true);
      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      for (const d of transSnap.docs) {
        const tx = d.data();
        if (Number(tx.amount || 0) === 0 || String(tx.label || '').includes('Recalibración exitosa')) {
          await deleteDoc(d.ref);
        }
      }
      localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify([]));
      await cargarSaldos();
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleEjecutarBolsa = async (monto: number, tipo: string, costeOriginal?: number) => {
    if (tipo === 'propio') {
      await registrarMovimientoHistorial(-monto, 'Compra Bolsa (Saldo Disponible)');
      await syncGlobalBalance(Math.max(0, disponibleGlobal - monto));
      const n = bolsaInvertido + monto; setBolsaInvertido(n); guardarEnFirebase({ bolsaInvertido: n });
    } else if (tipo === 'vender') {
      const gananciaLimpia = monto - (costeOriginal || 0); 
      await registrarMovimientoHistorial(monto, `Venta en Bolsa`);
      await syncGlobalBalance(disponibleGlobal + monto);
      const nInv = Math.max(0, bolsaInvertido - (costeOriginal || 0)); setBolsaInvertido(nInv);
      const nGan = bolsaGanancias + gananciaLimpia; setBolsaGanancias(nGan);
      guardarEnFirebase({ bolsaInvertido: nInv, bolsaGanancias: nGan });
    }
    await cargarSaldos();
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      await registrarMovimientoHistorial(-coste, 'Inversión en Proyectos');
      await syncGlobalBalance(Math.max(0, disponibleGlobal - coste));
    }
    await cargarSaldos();
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
    currentView, setCurrentView, disponibleGlobal, totalInvertidoCalculado, bolsaDisponible: 0,
    bolsaInvertido, bolsaGanancias, proyectoDisponible: 0, proyectoInvertido, proyectoGanado,
    handleTransferirGlobal, handleEjecutarBolsa, handleEjecutarProyecto, loading,
    movimientos, eliminarMovimiento, handleEditarYReenviar, handleGuardarOperacionProyecto, handleRecalcularTodo,
    handleLimpiarBasura
  };
};
