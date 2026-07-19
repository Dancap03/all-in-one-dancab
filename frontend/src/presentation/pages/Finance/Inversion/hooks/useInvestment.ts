import { useState, useEffect, useCallback } from 'react';
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

  // 🚀 LA SOLUCIÓN SENCILLA: Pegar la venta en el historial y sumar el dinero
  const cargarSaldos = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      // 1. Obtener historial global actual
      const globalSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const globalTxs: any[] = globalSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const globalIds = new Set(globalTxs.map(t => t.id));

      // 2. Obtener saldo disponible actual
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      let liquidoActual = docSnap.exists() && docSnap.data().disponibleGlobal !== undefined 
            ? Number(docSnap.data().disponibleGlobal) : Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

      // 3. RECUPERAR OPERACIONES DE WALLAPOP (COMO TUS 62.50€) AL HISTORIAL GENERAL
      let saldoRecuperado = 0;
      const carpetas = ['operations', 'transactions'];
      
      for (const carpeta of carpetas) {
          try {
              const subSnap = await getDocs(collection(db, `users/${user.uid}/projects/wallapop/${carpeta}`));
              for (const d of subSnap.docs) {
                  // Si la venta de Wallapop NO está en la lista de abajo, la metemos
                  if (!globalIds.has(d.id)) {
                      const data = d.data() as any;
                      
                      // Guardar en el historial general para que la veas
                      await setDoc(doc(db, `users/${user.uid}/investment_transactions`, d.id), data);
                      globalTxs.push({ id: d.id, ...data });
                      globalIds.add(d.id);

                      // Si es una venta, preparamos el dinero para sumarlo a tu bolsillo
                      const amt = Math.abs(Number(data.amount || 0));
                      const isVenta = data.type === 'venta' || String(data.label).toLowerCase().includes('venta') || Number(data.amount) > 0;
                      
                      if (isVenta) saldoRecuperado += amt;
                      else saldoRecuperado -= amt;
                  }
              }
          } catch(e) {}
      }

      // Si se pegó la venta en el historial, sumamos el dinero a la liquidez (18,46 + 62,50 = 80,96)
      if (saldoRecuperado !== 0) {
          liquidoActual += saldoRecuperado;
          liquidoActual = Math.max(0, liquidoActual);
          await setDoc(docRef, { disponibleGlobal: liquidoActual }, { merge: true });
          localStorage.setItem('aio_total_invertido_diadia_v2', liquidoActual.toString());
      }

      // 4. Leer datos oficiales de Wallapop
      const wallapopSnap = await getDoc(doc(db, `users/${user.uid}/projects`, 'wallapop'));
      let stockWallapop = 0, beneficioWallapop = 0;
      if (wallapopSnap.exists()) {
          const wData = wallapopSnap.data() as any;
          stockWallapop = Number(wData.stockActivo !== undefined ? wData.stockActivo : (wData.stockCoste || 0));
          beneficioWallapop = Number(wData.beneficioNeto || 0);
      }

      // 5. Leer datos de Bolsa y calcular Rentabilidad total
      const bInvertido = docSnap.exists() && docSnap.data().bolsaInvertido !== undefined ? Number(docSnap.data().bolsaInvertido) : 200.00;
      const bGanancias = docSnap.exists() && docSnap.data().bolsaGanancias !== undefined ? Number(docSnap.data().bolsaGanancias) : 65.05;

      const beneficioNetoGlobal = bGanancias + beneficioWallapop; 
      const capitalDesembolsadoReal = bInvertido + stockWallapop; 
      const roiGlobalCalculado = capitalDesembolsadoReal > 0 ? (beneficioNetoGlobal / capitalDesembolsadoReal) * 100 : 0;

      await setDoc(docRef, {
          proyectoInvertido: stockWallapop,
          proyectoGanado: beneficioWallapop,
          rentabilidadAbsoluta: beneficioNetoGlobal,
          rentabilidadPorcentaje: roiGlobalCalculado
      }, { merge: true });

      setDisponibleGlobal(liquidoActual);
      setBolsaInvertido(bInvertido);
      setBolsaGanancias(bGanancias);
      setProyectoInvertido(stockWallapop);
      setProyectoGanado(beneficioWallapop);

      // Mostrar historial de abajo ordenado por fecha
      globalTxs.sort((a, b) => new Date(b.dateString || b.date || 0).getTime() - new Date(a.dateString || a.date || 0).getTime());
      setMovimientos(globalTxs);

    } catch (error) {
      console.error("Error en carga principal:", error);
    } finally {
      setLoading(false);
    }
  }, [currentView]);

  useEffect(() => {
    cargarSaldos();
  }, [cargarSaldos]);

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
      if (lower.includes('dividendo')) nBGan -= amount; 
      else { nGlob += amount; nBInv -= amount; } 
    } else if (lower.includes('proyecto') || lower.includes('artículo')) {
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
            id: newTxId, label: labelFinal, concept: labelFinal, title: labelFinal,
            amount: Number(monto), type: 'income', tipo: 'ingreso',
            category: 'Inversión', dateString: fechaLimpia, date: Timestamp.now()                
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
      
      const invTxRef = doc(db, `users/${user.uid}/investment_transactions`, id);
      await setDoc(invTxRef, {
        amount: Number(nuevoMonto), label: nuevoConcepto,
        dateString: today.toISOString(), updatedAt: Timestamp.now()
      }, { merge: true });

      await cargarSaldos();
    } catch (error) {
      console.error("Error al editar:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 RESTAURADA Y PROTEGIDA: Función simple y directa para las compras/ventas nuevas
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

      const docRefBal = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnapBal = await getDoc(docRefBal);
      let liquidoBase = docSnapBal.exists() && docSnapBal.data().disponibleGlobal !== undefined 
          ? Number(docSnapBal.data().disponibleGlobal) : disponibleGlobal;

      let pCompras = 0, pVentas = 0, pStock = 0;
      const projDocRef = doc(db, `users/${user.uid}/projects`, projectId);
      const projSnap = await getDoc(projDocRef);
      if (projSnap.exists()) {
        const pData = projSnap.data() as any;
        pCompras = Number(pData.comprasTotales || pData.totalCompras || 0);
        pVentas = Number(pData.ventasTotales || pData.totalVentas || 0);
        pStock = Number(pData.stockActivo || pData.stockCoste || 0);
      }

      const exactAmount = Math.abs(Number(monto));
      const exactCoste = Math.abs(Number(costeOriginal));

      // Matemáticas simples: sumamos o restamos
      if (tipo === 'venta') {
        liquidoBase += exactAmount;
        pVentas += exactAmount;
        pStock -= exactCoste;
      } else {
        liquidoBase -= exactAmount;
        pCompras += exactAmount;
        pStock += exactAmount;
      }

      liquidoBase = Math.max(0, liquidoBase); pStock = Math.max(0, pStock);

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

      // Guardamos en TODAS partes para que no haya que recuperar nada nunca más
      await setDoc(doc(db, `users/${user.uid}/investment_transactions`, idOperacion), nuevoMovimiento);
      await setDoc(doc(db, `users/${user.uid}/projects/${projectId}/transactions`, idOperacion), nuevoMovimiento, { merge: true });
      await setDoc(doc(db, `users/${user.uid}/projects/${projectId}/operations`, idOperacion), nuevoMovimiento, { merge: true });

      await setDoc(projDocRef, {
        comprasTotales: pCompras, totalCompras: pCompras,
        ventasTotales: pVentas, totalVentas: pVentas,
        stockActivo: pStock, stockCoste: pStock,
        beneficioNeto: pVentas - pCompras,
        roi: pCompras > 0 ? ((pVentas - pCompras) / pCompras) * 100 : 0,
        updatedAt: Timestamp.now()
      }, { merge: true });

      await syncGlobalBalance(liquidoBase);
      await cargarSaldos();
    } catch (e) {
      console.error("Error guardando operación:", e);
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
        const tx = d.data() as any;
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
    } else if (modo === 'vender' && venta !== undefined) {
      await registrarMovimientoHistorial(venta, 'Venta de proyecto completada');
      const nGan = proyectoGanado + (venta - coste); setProyectoGanado(nGan);
      const nInv = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(nInv);
      guardarEnFirebase({ proyectoGanado: nGan, proyectoInvertido: nInv });
      await syncGlobalBalance(disponibleGlobal + venta);
    } else if (modo === 'balance') {
      await registrarMovimientoHistorial(coste, 'Retorno de capital de Proyectos');
      const n = Math.max(0, proyectoInvertido - coste); setProyectoInvertido(n); guardarEnFirebase({ proyectoInvertido: n });
      await syncGlobalBalance(disponibleGlobal + coste);
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
