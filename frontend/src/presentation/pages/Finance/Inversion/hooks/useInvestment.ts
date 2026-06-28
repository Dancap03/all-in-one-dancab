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

  const [movimientos, setMovimientos] = useState<any[]>([]);

  const cargarSaldos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs: any[] = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      firebaseTxs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
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

    try {
      await deleteDoc(doc(db, `users/${user.uid}/investment_transactions`, id));
    } catch (e) {}

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
      else { nBInv -= amount; } 
    } 
    else if (lower.includes('proyecto')) {
      if (lower.includes('venta')) { nPGan -= amount; } 
      else { nPInv -= amount; }
    }

    nBInv = Math.max(0, nBInv);
    nPInv = Math.max(0, nPInv);

    setBolsaInvertido(nBInv);
    setProyectoInvertido(nPInv);
    setBolsaGanancias(nBGan);
    setProyectoGanado(nPGan);
    
    setMovimientos(prev => prev.filter(m => m.id !== id));
    await guardarEnFirebase({
      bolsaInvertido: nBInv, proyectoInvertido: nPInv, bolsaGanancias: nBGan, proyectoGanado: nPGan
    });
    
    cargarSaldos();
  };

  const handleTransferirGlobal = async (monto: number, destino: string, concepto?: string) => {
    const esRetirada = destino === 'diadia' || destino === 'retirar';
    const labelFinal = concepto || (esRetirada ? 'Retirada de capital' : 'Aportación de capital');
    
    const nuevoSaldo = esRetirada ? Math.max(0, disponibleGlobal - monto) : disponibleGlobal + monto;
    await syncGlobalBalance(nuevoSaldo);
    await registrarMovimientoHistorial(esRetirada ? -monto : monto, labelFinal);
    cargarSaldos();
  };

  // 🚀 NUEVA LÓGICA DE COMPRA Y VENTA AVANZADA
  const handleEjecutarBolsa = async (monto: number, tipo: string, costeOriginal?: number) => {
    // 1. COMPRAS
    if (tipo === 'propio') {
      await registrarMovimientoHistorial(-monto, 'Compra Bolsa (Saldo Disponible)');
      await syncGlobalBalance(Math.max(0, disponibleGlobal - monto));
      const n = bolsaInvertido + monto;
      setBolsaInvertido(n);
      guardarEnFirebase({ bolsaInvertido: n });
    } else if (tipo === 'ganancia_compra') {
      await registrarMovimientoHistorial(-monto, 'Re-inversión Bolsa (Dividendos)');
      const nGan = Math.max(0, bolsaGanancias - monto);
      setBolsaGanancias(nGan);
      const nInv = bolsaInvertido + monto;
      setBolsaInvertido(nInv);
      guardarEnFirebase({ bolsaGanancias: nGan, bolsaInvertido: nInv });
    } else if (tipo === 'otro_compra') {
      await registrarMovimientoHistorial(monto, 'Compra Bolsa (Dinero Externo)');
      const n = bolsaInvertido + monto;
      setBolsaInvertido(n);
      guardarEnFirebase({ bolsaInvertido: n });
    
    // 2. DIVIDENDOS
    } else if (tipo === 'ganancia') {
      await registrarMovimientoHistorial(monto, 'Cobro de Dividendos en Bolsa');
      const n = bolsaGanancias + monto;
      setBolsaGanancias(n);
      guardarEnFirebase({ bolsaGanancias: n });
    
    // 3. VENTAS (El núcleo de lo que pedías)
    } else if (tipo === 'vender') {
      const gananciaLimpia = monto - (costeOriginal || 0); // monto = dinero total recibido
      await registrarMovimientoHistorial(monto, `Venta en Bolsa ${gananciaLimpia >= 0 ? '(Beneficio)' : '(Pérdida)'}`);
      
      // El dinero de la venta va a tu saldo global disponible
      await syncGlobalBalance(disponibleGlobal + monto);
      
      // Se resta la parte invertida original de la métrica de Invertido
      const nInv = Math.max(0, bolsaInvertido - (costeOriginal || 0));
      setBolsaInvertido(nInv);

      // El beneficio limpio (o pérdida) modifica tus ganancias históricas
      const nGan = bolsaGanancias + gananciaLimpia;
      setBolsaGanancias(nGan);

      guardarEnFirebase({ bolsaInvertido: nInv, bolsaGanancias: nGan });
    
    // 4. BORRADO SIMPLE SIN REGISTRO (Papelera)
    } else if (tipo === 'balance') {
      await registrarMovimientoHistorial(monto, 'Ajuste de Cartera (Borrado)');
      const n = Math.max(0, bolsaInvertido - monto);
      setBolsaInvertido(n);
      guardarEnFirebase({ bolsaInvertido: n });
      await syncGlobalBalance(disponibleGlobal + monto);
    }

    cargarSaldos();
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      await registrarMovimientoHistorial(-coste, 'Inversión en Proyectos');
      const n = proyectoInvertido + coste;
      setProyectoInvertido(n);
      guardarEnFirebase({ proyectoInvertido: n });
      await syncGlobalBalance(Math.max(0, disponibleGlobal - coste));
    } else if (modo === 'vender' && venta !== undefined) {
      await registrarMovimientoHistorial(venta, 'Venta de proyecto completada');
      const nGan = proyectoGanado + (venta - coste);
      setProyectoGanado(nGan);
      const nInv = Math.max(0, proyectoInvertido - coste);
      setProyectoInvertido(nInv);
      guardarEnFirebase({ proyectoGanado: nGan, proyectoInvertido: nInv });
      await syncGlobalBalance(disponibleGlobal + venta);
    } else {
      await registrarMovimientoHistorial(coste, 'Retorno de capital de Proyectos');
      const n = Math.max(0, proyectoInvertido - coste);
      setProyectoInvertido(n);
      guardarEnFirebase({ proyectoInvertido: n });
      await syncGlobalBalance(disponibleGlobal + coste);
    }
    cargarSaldos();
  };

  const totalInvertidoCalculado = bolsaInvertido + proyectoInvertido;

  return {
    currentView, setCurrentView, disponibleGlobal, totalInvertidoCalculado, bolsaDisponible: 0,
    bolsaInvertido, bolsaGanancias, proyectoDisponible: 0, proyectoInvertido, proyectoGanado,
    handleTransferirGlobal, handleEjecutarBolsa, handleEjecutarProyecto, loading,
    movimientos, eliminarMovimiento
  };
};
