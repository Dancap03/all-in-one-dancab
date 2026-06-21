import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';

export const usePatrimonio = () => {
  const [patrimonioTotal, setPatrimonioTotal] = useState(0);
  const [ahorroTotal, setAhorroTotal] = useState(0);
  const [inversionTotal, setInversionTotal] = useState(0);
  const [diaADiaTotal, setDiaADiaTotal] = useState(0);
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
        // 1. OBTENER INVERSIÓN Y DÍA A DÍA (Desde la nube de Firebase)
        let invTotal = 0;
        let diaTotal = 0;
        const invRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
        const invSnap = await getDoc(invRef);

        if (invSnap.exists()) {
          const data = invSnap.data();
          // Sumamos lo invertido en Bolsa y en Proyectos
          invTotal = (Number(data.bolsaInvertido) || 0) + (Number(data.proyectoInvertido) || 0);
          // El "disponibleGlobal" de la nube es tu dinero de Día a Día
          diaTotal = Number(data.disponibleGlobal) || 0;
        }

        // 2. OBTENER AHORRO (Desde la nube de Firebase)
        let ahTotal = 0;
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount) || 0;
          // Sumamos ingresos y restamos retiros para calcular el ahorro exacto
          if (t.type === 'deposit') ahTotal += amt;
          if (t.type === 'withdrawal') ahTotal -= amt;
        });

        // 3. ACTUALIZAR TODOS LOS ESTADOS
        setInversionTotal(invTotal);
        setDiaADiaTotal(diaTotal);
        setAhorroTotal(ahTotal);
        
        // El Patrimonio Total es la suma de los 3 pilares
        const total = invTotal + diaTotal + ahTotal;
        setPatrimonioTotal(total);

        // 4. HISTORIAL DE GRÁFICA (Rescatamos lo local para que no se rompa la gráfica)
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

  return {
    patrimonioTotal,
    ahorroTotal,
    inversionTotal,
    diaADiaTotal,
    historialPatrimonio,
    loading
  };
};
