import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';

export const usePatrimonio = () => {
  // --- ESTADOS DE LA INTERFAZ ---
  const [modoFiltro, setModoFiltro] = useState<'Total' | 'Año'>('Año');
  const [yearSeleccionado, setYearSeleccionado] = useState<number>(new Date().getFullYear());

  // --- ESTADOS DE DATOS FINANCIEROS ---
  const [patrimonioTotal, setPatrimonioTotal] = useState(0);
  const [liquidez, setLiquidez] = useState(0);
  const [ahorro, setAhorro] = useState(0);
  const [inversion, setInversion] = useState(0);
  
  const [historialPatrimonio, setHistorialPatrimonio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // MATRIZ MAESTRA PARA LA GRÁFICA Y EL HISTORIAL
        const todosLosMovimientos: any[] = [];

        // ==========================================
        // 1. INVERSIÓN
        // ==========================================
        let invTotal = 0;
        const invRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
        const invSnap = await getDoc(invRef);

        if (invSnap.exists()) {
          const data = invSnap.data();
          invTotal = (Number(data.bolsaInvertido) || 0) + 
                     (Number(data.bolsaDisponible) || 0) + 
                     (Number(data.bolsaGanancias) || 0) + 
                     (Number(data.proyectoInvertido) || 0) + 
                     (Number(data.proyectoDisponible) || 0) + 
                     (Number(data.proyectoGanado) || 0) + 
                     (Number(data.disponibleGlobal) || 0);
        }

        // Rescatamos movimientos de Inversión
        const invTransSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
        let invLoaded = false;
        invTransSnap.docs.forEach(d => {
          invLoaded = true;
          todosLosMovimientos.push({ id: d.id, module: 'inversion', ...d.data() });
        });
        // Si no hay en Firebase, rescata del PC
        if (!invLoaded) {
          const localInv = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
          localInv.forEach((m: any) => todosLosMovimientos.push({ ...m, module: 'inversion' }));
        }

        // ==========================================
        // 2. DÍA A DÍA (LIQUIDEZ)
        // ==========================================
        let diaTotal = 0;
        let diaLoaded = false;
        
        // Rescatamos transacciones de Día a Día
        const txSnap = await getDocs(collection(db, `users/${user.uid}/transactions`));
        txSnap.docs.forEach(d => {
          diaLoaded = true;
          const t = d.data();
          todosLosMovimientos.push({ id: d.id, module: 'diadia', ...t });
          const amt = Number(t.amount) || 0;
          if (t.type === 'income') diaTotal += amt;
          if (t.type === 'expense') diaTotal -= amt;
        });

        // Si no hay en Firebase, rescata del PC
        if (!diaLoaded) {
          const localKeys = ['aio_transactions', 'aio_transactions_v2', 'aio_finance_transactions', 'aio_movimientos'];
          for (const key of localKeys) {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (parsed.length > 0) {
              parsed.forEach((t: any) => {
                todosLosMovimientos.push({ ...t, module: 'diadia' });
                const amt = Number(t.amount) || 0;
                if (t.type === 'income') diaTotal += amt;
                if (t.type === 'expense') diaTotal -= amt;
              });
              break;
            }
          }
          // Si el array local falla, leemos el saldo directamente
          if (diaTotal === 0) {
            const balKeys = ['aio_balance', 'aio_balance_v2', 'aio_finance_balance'];
            for (const k of balKeys) {
              const val = Number(localStorage.getItem(k));
              if (val) { diaTotal = val; break; }
            }
          }
        }

        // ==========================================
        // 3. AHORRO
        // ==========================================
        let ahTotal = 0;
        let savLoaded = false;
        
        // Rescatamos movimientos de Ahorro
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          savLoaded = true;
          const t = d.data();
          todosLosMovimientos.push({ id: d.id, module: 'ahorro', ...t });
          const amt = Number(t.amount) || 0;
          if (t.type === 'deposit') ahTotal += amt;
          if (t.type === 'withdrawal') ahTotal -= amt;
        });

        // Si no hay en Firebase, rescata del PC
        if (!savLoaded) {
          const localSav = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]');
          localSav.forEach((t: any) => {
            todosLosMovimientos.push({ ...t, module: 'ahorro' });
            const amt = Number(t.amount) || 0;
            let type = t.type;
            if (!type) {
              if (amt > 0) type = 'deposit';
              else if (amt < 0) type = 'withdrawal';
            }
            if (type === 'deposit') ahTotal += Math.abs(amt);
            if (type === 'withdrawal') ahTotal -= Math.abs(amt);
          });
          
          if (ahTotal === 0) {
             ahTotal = Number(localStorage.getItem('aio_ahorro_total')) || 0;
          }
        }

        // ==========================================
        // 4. ACTUALIZAR ESTADOS Y PREPARAR GRÁFICA
        // ==========================================
        setInversion(invTotal);
        setLiquidez(diaTotal);
        setAhorro(ahTotal);
        setPatrimonioTotal(invTotal + diaTotal + ahTotal);

        // Formateamos todos los movimientos para que la gráfica los entienda
        const historialOrdenado = todosLosMovimientos.map(m => {
          // Unificamos el formato de la fecha venga del módulo que venga
          const fechaString = m.dateString || (m.date?.seconds ? new Date(m.date.seconds * 1000).toISOString() : null) || m.date || m.createdAt || new Date().toISOString();
          return { ...m, dateString: fechaString, date: fechaString };
        }).sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());

        setHistorialPatrimonio(historialOrdenado);

      } catch (error) {
        console.error("Error cargando patrimonio de Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // --- VARIABLES DERIVADAS PARA LA GRÁFICA ---
  const datosGrafica = useMemo(() => {
    return historialPatrimonio;
  }, [historialPatrimonio, modoFiltro, yearSeleccionado]);

  const totalMovimientos = historialPatrimonio.length;

  return {
    patrimonioTotal,
    liquidez,
    ahorro,
    inversion,
    modoFiltro,
    setModoFiltro,
    yearSeleccionado,
    setYearSeleccionado,
    datosGrafica,
    totalMovimientos,
    historialPatrimonio,
    loading
  };
};
