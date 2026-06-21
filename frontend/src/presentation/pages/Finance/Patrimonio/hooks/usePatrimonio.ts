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
        // 1. OBTENER INVERSIÓN (Suma TODO el módulo de inversión)
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
                     (Number(data.disponibleGlobal) || 0); // Aquí están tus 20,78 € reales
        }

        // 2. OBTENER DÍA A DÍA (Líquidez Real de tu cuenta)
        let diaTotal = 0;
        const txSnap = await getDocs(collection(db, `users/${user.uid}/transactions`));
        if (!txSnap.empty) {
          txSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') diaTotal += amt;
            if (t.type === 'expense') diaTotal -= amt;
          });
        } else {
          // Si la BD en la nube aún no tiene el Día a Día, rescatamos la memoria del PC
          const localKeys = ['aio_balance', 'aio_balance_v2', 'aio_diadia_balance', 'aio_finance_balance', 'aio_total_diadia'];
          for (const key of localKeys) {
            const val = Number(localStorage.getItem(key));
            if (val) {
              diaTotal = val;
              break;
            }
          }
        }

        // 3. OBTENER AHORRO DESDE FIREBASE
        let ahTotal = 0;
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount) || 0;
          if (t.type === 'deposit') ahTotal += amt;
          if (t.type === 'withdrawal') ahTotal -= amt;
        });

        // 4. ACTUALIZAR LAS TARJETAS (Cada oveja con su pareja)
        setInversion(invTotal);
        setLiquidez(diaTotal);
        setAhorro(ahTotal);
        
        // El Patrimonio Total es la suma exacta de los 3 pilares
        const total = invTotal + diaTotal + ahTotal;
        setPatrimonioTotal(total);

        // 5. HISTORIAL DE LA GRÁFICA
        const historialLocal = JSON.parse(localStorage.getItem('aio_historial_patrimonio') || '[]');
        setHistorialPatrimonio(historialLocal);

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
