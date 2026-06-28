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
      // 1. CARGAMOS EL HISTORIAL REAL DE TRANSACCIONES DE FIREBASE
      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs: any[] = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Ordenamos por fecha decreciente para la vista
      firebaseTxs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
      setMovimientos(firebaseTxs);

      // 2. CARGAMOS LOS VALORES INVERTIDOS ACTIVOS DE BOLSA Y PROYECTOS
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};

      // 3. 🎯 MATEMÁTICAS REALES: El saldo global se calcula EXCLUSIVAMENTE sumando el historial real
      let saldoCalculadoDesdeHistorial = 0;
      
      firebaseTxs.forEach(tx => {
        const lowerLabel = (tx.label || '').toLowerCase();
        // Si es una compra en bolsa o inversión en proyecto, restamos del disponible global
        if (lowerLabel.includes('compra de activos') || lowerLabel.includes('inversión en proyectos')) {
          // No restamos aquí si ya se procesa de forma directa, pero como las transacciones guardan 
          // el monto neto de aportación/salida, sumamos el valor real firmado del historial.
          saldoCalculadoDesdeHistorial += Number(tx.amount);
        } else {
          // Aportaciones, retiradas directas, ventas, etc.
          saldoCalculadoDesdeHistorial += Number(tx.amount);
        }
      });

      // Forzamos a que si el historial da 0, el saldo sea 0 limpio
      if (firebaseTxs.length === 0) {
        saldoCalculadoDesdeHistorial = 0;
      }

      setDisponibleGlobal(saldoCalculadoDesdeHistorial);
      setBolsaInvertido(data.bolsaInvertido || 0);
      setBolsaGanancias(data.bolsaGanancias || 0);
      setProyectoInvertido(data.proyectoInvertido || 0);
      setProyectoGanado(data.proyectoGanado || 0);

      // Sincronizamos la base de datos y almacenamiento local con el valor del historial matemático
      await setDoc(docRef, { disponibleGlobal: saldoCalculadoDesdeHistorial }, { merge: true });
      localStorage.setItem('aio_total_invertido_diadia_v2', saldoCalculadoDesdeHistorial.toString());

    } catch (error) {
      console.error("Error cargando y cuadrando datos de inversión:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, [currentView]); // Se actualiza dinámicamente si cambias de pantalla o cierras un modal

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

  const eliminarMovimiento = async (id: string, amount: number, label: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/investment_transactions`, id));
    } catch (e) {}

    const currentMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const filtered = currentMovements.filter((m: any) => m.id !== id);
    localStorage.setItem('aio_inversion_movimientos_v2', JSON.stringify(filtered));

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
    
    // Al filtrar el movimiento local, el useEffect volverá a calcular el saldo real exacto
    setMovimientos(prev => prev.filter(m => m.id !== id));
    await guardarEnFirebase({
      bolsaInvertido: nBInv, proyectoInvertido: nPInv, bolsaGanancias: nBGan, proyectoGanado: nPGan
    });
    
    // Forzamos recarga limpia
    cargarSaldos();
  };

  const handleTransferirGlobal = async (monto: number, destino: string, concepto?: string) => {
    const esRetirada = destino === 'diadia' || destino === 'retirar';
    const labelFinal = concepto || (esRetirada ? 'Retirada de capital' : 'Aportación de capital');
    
    // Registramos la transacción firmada. El cálculo automático del useEffect se encargará de setear el disponible
    await registrarMovimientoHistorial(esRetirada ? -monto : monto, labelFinal);
    cargarSaldos();
  };

  const handleEjecutarBolsa = async (monto: number, tipo: 'propio' | 'ganancia' | 'diadia' | 'balance') => {
    if (tipo === 'propio') {
      await registrarMovimientoHistorial(-monto, 'Compra de activos en Bolsa');
      setBolsaInvertido(prev => { const n = prev + monto; guardarEnFirebase({ bolsaInvertido: n }); return n; });
    } else if (tipo === 'ganancia') {
      await registrarMovimientoHistorial(monto, 'Cobro de Dividendos en Bolsa');
      setBolsaGanancias(prev => { const n = prev + monto; guardarEnFirebase({ bolsaGanancias: n }); return n; });
    } else {
      await registrarMovimientoHistorial(monto, 'Venta de activos en Bolsa');
      setBolsaInvertido(prev => { const n = Math.max(0, prev - monto); guardarEnFirebase({ bolsaInvertido: n }); return n; });
    }
    cargarSaldos();
  };

  const handleEjecutarProyecto = async (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => {
    if (modo === 'comprar') {
      await registrarMovimientoHistorial(-coste, 'Inversión en Proyectos');
      setProyectoInvertido(prev => { const n = prev + coste; guardarEnFirebase({ proyectoInvertido: n }); return n; });
    } else if (modo === 'vender' && venta !== undefined) {
      await registrarMovimientoHistorial(venta, 'Venta de proyecto completada');
      setProyectoGanado(prev => { const n = prev + (venta - coste); guardarEnFirebase({ proyectoGanado: n }); return n; });
      setProyectoInvertido(prev => { const n = Math.max(0, prev - coste); guardarEnFirebase({ proyectoInvertido: n }); return n; });
    } else {
      await registrarMovimientoHistorial(coste, 'Retorno de capital de Proyectos');
      setProyectoInvertido(prev => { const n = Math.max(0, prev - coste); guardarEnFirebase({ proyectoInvertido: n }); return n; });
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
