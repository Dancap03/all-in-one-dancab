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
      const docRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};

      const localGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);

      const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
      const firebaseTxs: any[] = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      firebaseTxs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
      setMovimientos(firebaseTxs);

      setDisponibleGlobal(data.disponibleGlobal !== undefined ? data.disponibleGlobal : localGlobal);
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
      else { nGlob += amount; nBInv -= amount; } 
    } 
    else if (lower.includes('proyecto')) {
      if (lower.includes('venta')) { nGlob -= amount; nPGan -= amount; } 
      else { nGlob += amount; nPInv -= amount; }
    } 
    else {
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
    movimientos, eliminarMovimiento
  };
};
