import { useState, useEffect } from 'react';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

type ViewState = 'summary' | 'global' | 'bolsa' | 'proyecto';

export const useInvestment = () => {
  const [currentView, setCurrentView] = useState<ViewState>('summary');
  const [loading, setLoading] = useState(true);

  const [disponibleGlobal, setDisponibleGlobal] = useState(0);
  const [bolsaInvertido, setBolsaInvertido] = useState(0);
  const [bolsaGanancias, setBolsaGanancias] = useState(0);
  const [proyectoInvertido, setProyectoInvertido] = useState(0);
  const [proyectoGanado, setProyectoGanado] = useState(0);

  // NUEVO ESTADO: El historial ahora se controla desde el cerebro
  const [movimientos, setMovimientos] = useState<any[]>([]);

  const cargarSaldos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};

      const localGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

      // 1. CARGAMOS EL HISTORIAL REAL DE FIREBASE Y LOCAL
      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const localTxs = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');

      let pendingGlobalDiff = 0;

      // 2. SINCRONIZACIÓN Y RECUPERACIÓN DE SALDOS PERDIDOS (Aquí recupera tus 74,85€)
      for (const m of localTxs) {
        const exists = firebaseTxs.some(tx => tx.id === m.id || (tx.label === m.label && tx.amount === m.amount && tx.dateString === m.dateString));
        if (!exists) {
          pendingGlobalDiff += Number(m.amount);
          
          const newDocRef = doc(collection(db, `users/${user.uid}/investment_transactions`));
          await setDoc(newDocRef, {
            amount: m.amount, label: m.label || 'Aportación', dateString: m.dateString || new Date().toISOString(), createdAt: new Date()
          });
          firebaseTxs.push({ id: newDocRef.id, amount: m.amount, label: m.label, dateString: m.dateString });
        }
      }

      firebaseTxs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
      setMovimientos(firebaseTxs);

      // 3. ACTUALIZAMOS SALDOS CORRIGIENDO DESFASES
      let finalGlobal = data.disponibleGlobal !== undefined ? data.disponibleGlobal : localGlobal;
      finalGlobal += pendingGlobalDiff; // Suma lo que faltaba

      setDisponibleGlobal(finalGlobal);
      setBolsaInvertido(data.bolsaInvertido || 0);
      setBolsaGanancias(data.bolsaGanancias || 0);
      setProyectoInvertido(data.proyectoInvertido || 0);
      setProyectoGanado(data.proyectoGanado || 0);

      // Si hubo que corregir el saldo, lo guardamos para siempre
      if (pendingGlobalDiff !== 0 || !docSnap.exists()) {
        await setDoc(docRef, { disponibleGlobal: finalGlobal }, { merge: true });
        localStorage.setItem('aio_total_invertido_diadia_v2', finalGlobal.toString());
      }

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, []);

  const guardarEnFirebase = async (nuevosSaldos: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'data'), nuevosSaldos, { merge: true });
    } catch (error) {}
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

  // 🚀 NUEVA FUNCIÓN: ELIMINAR / DESHACER MARCHA ATRÁS
  const eliminarMovimiento = async (id: string, amount: number, label: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/investment_transactions`, id));
    } catch (e) { console.error(e); }

    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const filtered = currentMovements.filter((m: any) => m.id !== id);
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify(filtered));

    // REVERSIÓN MATEMÁTICA DE SALDOS
    let nGlob = disponibleGlobal;
    let nBInv = bolsaInvertido;
    let nPInv = proyectoInvertido;
    let nBGan = bolsaGanancias;
    let nPGan = proyectoGanado;

    const lower = label.toLowerCase();
    
    if (lower.includes('bolsa')) {
      if (lower.includes('dividendo')) { nBGan -= amount; } 
      else { nGlob += amount; nBInv -= amount; } // Deshacer compra o venta
    } 
    else if (lower.includes('proyecto')) {
      if (lower.includes('venta')) { nGlob -= amount; nPGan -= amount; } 
      else { nGlob += amount; nPInv -= amount; }
    } 
    else {
      // Deshacer Aportación o Retirada (Dinero Día a Día)
      nGlob -= amount;
    }

    nGlob = Math.max(0, nGlob);
    nBInv = Math.max(0, nBInv);
    nPInv = Math.max(0, nPInv);

    setDisponibleGlobal(nGlob);
    setBolsaInvertido(nBInv);
    setProyectoInvertido(nPInv);
    setBolsaGanancias(nBGan);
    setProyectoGanado(nPGan);
    setMovimientos(prev => prev.filter(m => m.id !== id));

    localStorage.setItem('aio_total_invertido_diadia_v2', nGlob.toString());
    await guardarEnFirebase({
      disponibleGlobal: nGlob, bolsaInvertido: nBInv, proyectoInvertido: nPInv, bolsaGanancias: nBGan, proyectoGanado: nPGan
    });
  };

  const handleTransferirGlobal = async (monto: number, destino: string, concepto?: string) => {
    const esRetirada = destino === 'diadia' || destino === 'retirar';
    const labelFinal = concepto || (esRetirada ? 'Retirada de capital' : 'Aportación de capital');

    setDisponibleGlobal(saldoAnterior => {
      const nuevoSaldo = esRetirada ? Math.max(0, saldoAnterior - monto) : saldoAnterior + monto;
      localStorage.setItem('aio_total_invertido_diadia_v2', nuevoSaldo.toString());
      guardarEnFirebase({ disponibleGlobal: nuevoSaldo });
      return nuevoSaldo;
    });

    registrarMovimientoHistorial(esRetirada ? -monto : monto, labelFinal);
  };

  const handleEjecutarBolsa = async (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => {
    if (tipo === 'propio') {
      registrarMovimientoHistorial(monto, 'Compra de activos en Bolsa');
      setDisponibleGlobal(prev => { const n = Math.max(0, prev - monto); guardarEnFirebase({ disponibleGlobal: n }); return n; });
      setBolsaInvertido(prev => { const n = prev + monto; guardarEnFirebase({ bolsaInvertido: n }); return n; });
    } else if (tipo === 'ganancia') {
      registrarMovimientoHistorial(monto, 'Cobro de Dividendos / Premios');
      setBolsaGanancias(prev => { const n = prev + monto; guardarEnFirebase({ bolsaGanancias: n }); return n; });
    } else {
      registrarMovimientoHistorial(-monto, 'Venta de activos en Bolsa');
      setBolsaInvertido(prev => { const n = Math.max(0, prev - monto); guardarEnFirebase({ bolsaInvertido: n }); return n; });
      setDisponibleGlobal(prev => { const n = prev + monto; guardarEnFirebase({ disponibleGlobal: n }); return n; });
    }
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      registrarMovimientoHistorial(coste, 'Inversión en Proyectos');
      setDisponibleGlobal(prev => { const n = Math.max(0, prev - coste); guardarEnFirebase({ disponibleGlobal: n }); return n; });
      setProyectoInvertido(prev => { const n = prev + coste; guardarEnFirebase({ proyectoInvertido: n }); return n; });
    } else if (modo === 'vender' && venta !== undefined) {
      const ganancia = venta - coste;
      registrarMovimientoHistorial(ganancia, 'Venta de proyecto completada');
      setProyectoGanado(prev => { const n = prev + ganancia; guardarEnFirebase({ proyectoGanado: n }); return n; });
      setProyectoInvertido(prev => { const n = Math.max(0, prev - coste); guardarEnFirebase({ proyectoInvertido: n }); return n; });
      setDisponibleGlobal(prev => { const n = prev + venta; guardarEnFirebase({ disponibleGlobal: n }); return n; });
    } else {
      registrarMovimientoHistorial(-coste, 'Retorno de capital de Proyectos');
      setProyectoInvertido(prev => { const n = Math.max(0, prev - coste); guardarEnFirebase({ proyectoInvertido: n }); return n; });
      setDisponibleGlobal(prev => { const n = prev + coste; guardarEnFirebase({ disponibleGlobal: n }); return n; });
    }
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
    currentView, setCurrentView, disponibleGlobal, totalInvertidoCalculado, bolsaDisponible: 0,
    bolsaInvertido, bolsaGanancias, proyectoDisponible: 0, proyectoInvertido, proyectoGanado,
    handleTransferirGlobal, handleEjecutarBolsa, handleEjecutarProyecto, loading,
    movimientos, eliminarMovimiento // 🚀 EXPORTAMOS PARA EL HISTORIAL
  };
};
