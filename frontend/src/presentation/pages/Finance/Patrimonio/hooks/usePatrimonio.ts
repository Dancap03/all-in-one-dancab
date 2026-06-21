import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';

export const usePatrimonio = () => {
  // --- ESTADOS DE LA INTERFAZ (Filtros de tu gráfica) ---
  // CORRECCIÓN 1: Forzamos a que el tipo sea exactamente "Total" o "Año"
  const [modoFiltro, setModoFiltro] = useState<'Total' | 'Año'>('Año');
  
  // CORRECCIÓN 2: Le pasamos el año como un NÚMERO, no como texto
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
        // 1. OBTENER INVERSIÓN Y LÍQUIDEZ (DÍA A DÍA) DESDE FIREBASE
        let invTotal = 0;
        let diaTotal = 0;
        const invRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
        const invSnap = await getDoc(invRef);

        if (invSnap.exists()) {
          const data = invSnap.data();
          // Inversión = Bolsa Invertida + Proyecto Invertido
          invTotal = (Number(data.bolsaInvertido) || 0) + (Number(data.proyectoInvertido) || 0);
          // Liquidez = Disponible Global (Día a Día)
          diaTotal = Number(data.disponibleGlobal) || 0;
        }

        // 2. OBTENER AHORRO DESDE FIREBASE
        let ahTotal = 0;
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount) || 0;
          if (t.type === 'deposit') ahTotal += amt;
          if (t.type === 'withdrawal') ahTotal -= amt;
        });

        // 3. ASIGNAR VALORES A LAS VARIABLES EXACTAS QUE PIDE TU COMPONENTE
        setInversion(invTotal);
        setLiquidez(diaTotal);
        setAhorro(ahTotal);
        
        // El Patrimonio Total es la suma de los 3 pilares
        const total = invTotal + diaTotal + ahTotal;
        setPatrimonioTotal(total);

        // 4. HISTORIAL DE LA GRÁFICA
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
