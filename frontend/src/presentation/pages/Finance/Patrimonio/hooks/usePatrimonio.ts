import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export const usePatrimonio = () => {
  // Eliminamos el filtro de mes, solo nos quedamos con Total y Año
  const [modoFiltro, setModoFiltro] = useState<'Total' | 'Año'>('Total');
  const [yearSeleccionado, setYearSeleccionado] = useState(new Date().getFullYear());

  const [patrimonioTotal, setPatrimonioTotal] = useState(0);
  const [liquidez, setLiquidez] = useState(0);
  const [ahorro, setAhorro] = useState(0);
  const [inversion, setInversion] = useState(0);
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);
  const [totalMovimientos, setTotalMovimientos] = useState(0);

  useEffect(() => {
    const loadRealData = async (user: any) => {
      try {
        // 1. INVERSIÓN (CORRECCIÓN: Sumamos tanto el dinero invertido como el disponible en liquidez)
        const invBolsaInv = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
        const invBolsaDisp = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
        
        const invProyInv = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
        const invProyDisp = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
        
        const saldoInversion = invBolsaInv + invBolsaDisp + invProyInv + invProyDisp;
        setInversion(saldoInversion);
        
        const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');

        // 2. DÍA A DÍA
        let saldoLiquidez = 0;
        let movDiaADia: any[] = [];
        const monthsRef = collection(db, `users/${user.uid}/finance_months`);
        const monthsSnap = await getDocs(monthsRef);
        
        for (const monthDoc of monthsSnap.docs) {
          const transRef = collection(db, `users/${user.uid}/finance_months/${monthDoc.id}/transactions`);
          const transSnap = await getDocs(transRef);
          
          transSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount) || 0;
            
            if (t.type === 'income' || t.type === 'savings_return') saldoLiquidez += amt;
            if (t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer') saldoLiquidez -= amt;
            
            movDiaADia.push({
              dateString: t.dateString,
              amount: t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer' ? -amt : amt
            });
          });
        }
        setLiquidez(saldoLiquidez);

        // 3. AHORRO
        let saldoAhorro = 0;
        let movAhorro: any[] = [];
        const savTransRef = collection(db, `users/${user.uid}/savings_transactions`);
        const savTransSnap = await getDocs(savTransRef);
        
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount) || 0;
          
          if (t.type === 'deposit') saldoAhorro += amt;
          if (t.type === 'withdrawal') saldoAhorro -= amt;
          
          movAhorro.push({
            dateString: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString(),
            amount: t.type === 'withdrawal' || t.type === 'to_vault' ? -amt : amt
          });
        });
        setAhorro(saldoAhorro);

        // 4. CÁLCULO DE PATRIMONIO TOTAL
        setPatrimonioTotal(saldoLiquidez + saldoAhorro + saldoInversion);

        // 5. UNIFICACIÓN PARA LA GRÁFICA Y CONTADOR
        const todosLosMovimientos = [...movInversion, ...movDiaADia, ...movAhorro];
        setTotalMovimientos(todosLosMovimientos.length);

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const graficaBase = meses.map(m => ({ name: m, Saldo: 0, Ingresos: 0, Gastos: 0, Ahorro: 0, Inversion: 0 }));

        todosLosMovimientos.forEach(mov => {
          if (!mov.dateString) return;
          const fecha = new Date(mov.dateString);
          if (fecha.getFullYear() === yearSeleccionado) {
            const mesIndex = fecha.getMonth();
            if (mov.amount > 0) graficaBase[mesIndex].Ingresos += mov.amount;
            if (mov.amount < 0) graficaBase[mesIndex].Gastos += Math.abs(mov.amount);
          }
        });

        let saldoAcumulado = saldoLiquidez;
        for (let i = 11; i >= 0; i--) {
          graficaBase[i].Saldo = saldoAcumulado;
          graficaBase[i].Ahorro = saldoAhorro;
          graficaBase[i].Inversion = saldoInversion;
          const flujoNeto = graficaBase[i].Ingresos - graficaBase[i].Gastos;
          saldoAcumulado -= flujoNeto;
        }

        setDatosGrafica(graficaBase);

      } catch (error) {
        console.error("Error al cargar los datos del patrimonio:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) loadRealData(user);
    });

    return () => unsubscribe();
  }, [modoFiltro, yearSeleccionado]);

  return {
    modoFiltro, setModoFiltro,
    yearSeleccionado, setYearSeleccionado,
    patrimonioTotal, liquidez, ahorro, inversion,
    datosGrafica, totalMovimientos
  };
};
