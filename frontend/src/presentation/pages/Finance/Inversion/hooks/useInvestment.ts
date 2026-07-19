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

  // 🚀 AUDITOR INVISIBLE: Compara Wallapop vs Historial y te devuelve el dinero que falta
  const sincronizarFugasAutomatico = async (uid: string) => {
    try {
      // 1. ¿Cuánto dice Wallapop que has vendido en total?
      const pDoc = await getDoc(doc(db, `users/${uid}/projects`, 'wallapop'));
      if (!pDoc.exists()) return false;
      
      const pData = pDoc.data() as any;
      const totalVentasProyecto = Number(pData.ventasTotales || pData.totalVentas || 0);

      // 2. ¿Cuánto dinero de ventas hay realmente en tu historial global?
      const txSnap = await getDocs(collection(db, `users/${uid}/investment_transactions`));
      let ventasGlobalesRegistradas = 0;
      
      txSnap.forEach(d => {
        const tx = d.data() as any;
        const label = String(tx.label || '').toLowerCase();
        const amt = Number(tx.amount || 0);
        
        // Sumamos todo lo que sea una venta de proyecto para compararlo
        if (amt > 0 && (label.includes('venta de proyecto') || label.includes('venta de artí') || label.includes('venta de stock'))) {
          ventasGlobalesRegistradas += amt;
        }
      });

      // 3. Calculamos si el historial perdió operaciones (Ej: 157.50 - 95.00 = 62.50)
      const diferencia = Math.round((totalVentasProyecto - ventasGlobalesRegistradas) * 100) / 100;

      // Si falta dinero, el sistema lo crea y te lo inyecta solo
      if (diferencia > 0) {
        console.log(`Auditor: Faltan ${diferencia}€. Inyectando en la base de datos...`);
        
        // A) Creamos la transacción visible en tu historial
        const newTxId = `mov-rescate-${Date.now()}`;
        await setDoc(doc(db, `users/${uid}/investment_transactions`, newTxId), {
          id: newTxId,
          amount: diferencia,
          label: 'Venta de proyecto completada', // El mismo nombre que tus otras ventas
          type: 'venta',
          dateString: new Date().toISOString().split('T')[0],
          date: Timestamp.now(),
          createdAt: Timestamp.now()
        });

        // B) Sumamos los euros reales a tu Saldo Disponible
        const balRef = doc(db, `users/${uid}/investment_balances`, 'data');
        const balSnap = await getDoc(balRef);
        const balData = balSnap.data() as any;
        const liqActual = Number(balData?.disponibleGlobal || 0);
        
        await setDoc(balRef, { disponibleGlobal: liqActual + diferencia }, { merge: true });
        
        return true; // Se realizó una inyección
      }
    } catch(e) {
      console.error("Fallo en el auditor automático:", e);
    }
    return false;
  };

  const cargarSaldos = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      // 🚀 Ejecutamos el auditor antes de cargar nada para que rescate tus 62,50€ si faltan
      await sincronizarFugasAutomatico(user.uid);

      // --- A PARTIR DE AQUÍ CARGA LOS DATOS YA CORREGIDOS ---
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() as any : {};

      const wallapopSnap = await getDoc(doc(db, `users/${user.uid}/projects`, 'wallapop'));
      let stockWallapop = 0; 
      let beneficioWallapop = 0;

      if (wallapopSnap.exists()) {
        const wData = wallapopSnap.data() as any;
        stockWallapop = Number(wData.stockActivo !== undefined ? wData.stockActivo : (wData.stockCoste || 0));
        beneficioWallapop = Number(wData.beneficioNeto || 0);
      }

      let saldoLiquidoReal = data.disponibleGlobal !== undefined ? Number(data.disponibleGlobal) : Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs: any[] = transSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      firebaseTxs.sort((a, b) => new Date(b.dateString || b.date || 0).getTime() - new Date(a.dateString || a.date || 0).getTime());
      
      setMovimientos(firebaseTxs);
      setDisponibleGlobal(saldoLiquidoReal);
      setBolsaInvertido(data.bolsaInvertido !== undefined ? data.bolsaInvertido : 200.00);
      setBolsaGanancias(data.bolsaGanancias !== undefined ? data.bolsaGanancias : 65.05);
      setProyectoInvertido(stockWallapop);
      setProyectoGanado(beneficioWallapop);

      const beneficioNetoGlobal = (data.bolsaGanancias || 65.05) + beneficioWallapop; 
      const capitalDesembolsadoReal = (data.bolsaInvertido || 200.00) + stockWallapop; 
      const roiGlobalCalculado = capitalDesembolsadoReal > 0 ? (beneficioNetoGlobal / capitalDesembolsadoReal) * 100 : 0;

      await setDoc(docRef, {
        disponibleGlobal: saldoLiquidoReal,
        proyectoInvertido: stockWallapop,
        proyectoGanado: beneficioWallapop,
        rentabilidadAbsoluta: beneficioNetoGlobal,
        rentabilidadPorcentaje: roiGlobalCalculado
      }, { merge: true });

      localStorage.setItem('aio_total_invertido_diadia_v2', saldoLiquidoReal.toString());

    } catch (error) {
      console.error("Error cargando datos estructurales:", error);
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
      const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
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
      const balData = docSnapBal.data() as any;
      let liquidoBase = docSnapBal.exists() && balData.disponibleGlobal !== undefined 
          ? Number(balData.disponibleGlobal) : disponibleGlobal;

      let pCompras = 0, pVentas = 0, pStock = 0;
      const projDocRef = doc(db, `users/${user.uid}/projects`, projectId);
      const projSnap = await getDoc(projDocRef);
      if (projSnap.exists()) {
        const pData = projSnap.data() as any;
        pCompras = Number(pData.totalCompras || pData.comprasTotales || 0);
        pVentas = Number(pData.totalVentas || pData.ventasTotales || 0);
        pStock = Number(pData.stockActivo || pData.stockCoste || 0);
      }

      const txDocRef = doc(db, `users/${user.uid}/investment_transactions`, idOperacion);
      const txSnap = await getDoc(txDocRef);

      if (txSnap.exists()) {
        const oldTx = txSnap.data() as any;
        const oldAmount = Math.abs(Number(oldTx.amount || 0));
        const oldCoste = Math.abs(Number(oldTx.costeOriginal || 0));
        const oldType = oldTx.type || (String(oldTx.label).toLowerCase().includes('venta') ? 'venta' : 'compra');

        if (oldType === 'venta') {
          liquidoBase -= oldAmount;
          pVentas -= oldAmount;
          pStock += oldCoste;
        } else {
          liquidoBase += oldAmount;
          pCompras -= oldAmount;
          pStock -= oldAmount;
        }
        await deleteDoc(txDocRef);
      }

      const exactAmount = Math.abs(Number(monto));
      const exactCoste = Math.abs(Number(costeOriginal));

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
        label: tipo === 'compra' ? `Compra De Stock: ${label}` : `Venta de proyecto completada`, // Nombre estandarizado
        type: tipo,
        costeOriginal: tipo === 'venta' ? exactCoste : 0,
        projectId: projectId,
        dateString: new Date().toISOString().split('T')[0],
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      };

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
