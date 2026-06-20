import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export const usePatrimonio = () => {
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
        const todosLosMovimientos: any[] = [];

        // 1. INVERSIÓN
        const invBalanceGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
        const invBolsaInv = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
        const invBolsaDisp = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
        const invProyInv = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
        const invProyDisp = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
        const currentInversion = invBalanceGlobal + invBolsaInv + invBolsaDisp + invProyInv + invProyDisp;

        const movInv = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
        movInv.forEach((m: any) => {
          todosLosMovimientos.push({ dateString: m.dateString, amount: Number(m.amount), netAmount: Number(m.amount), categoria: 'Inversión' });
        });

        // 2. AHORRO (Lectura directa desde Firebase + LocalStorage para no perder nada)
        let currentAhorro = 0;
        
        // A) Datos de Firebase
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount) || 0;
          let net = 0;
          
          // Depósitos suman al global, retiros restan (to_vault / from_vault son internos y no cambian el saldo neto global)
          if (t.type === 'deposit') net = amt;
          else if (t.type === 'withdrawal') net = -amt;
          
          currentAhorro += net;

          // Extraer fecha con seguridad
          let dString = new Date().toISOString();
          if (t.date?.seconds) dString = new Date(t.date.seconds * 1000).toISOString();
          else if (t.dateString) dString = t.dateString;
          else if (t.date) dString = t.date;

          todosLosMovimientos.push({
            dateString: dString,
            amount: amt,
            netAmount: net,
            categoria: 'Ahorro'
          });
        });

        // B) Datos Antiguos Locales (Por si metiste datos el año pasado)
        const movAhLocal = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]');
        movAhLocal.forEach((m: any) => {
          const amt = Number(m.amount) || 0;
          currentAhorro += amt; 
          todosLosMovimientos.push({
            dateString: m.dateString || m.date || new Date().toISOString(),
            amount: Math.abs(amt),
            netAmount: amt,
            categoria: 'Ahorro'
          });
        });

        // 3. DÍA A DÍA (Lectura directa desde Firebase)
        let currentLiquidez = 0;
        const monthsSnap = await getDocs(collection(db, `users/${user.uid}/finance_months`));
        
        for (const monthDoc of monthsSnap.docs) {
          const transSnap = await getDocs(collection(db, `users/${user.uid}/finance_months/${monthDoc.id}/transactions`));
          transSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount) || 0;
            const isIncome = t.type === 'income' || t.type === 'savings_return';
            const isExpense = t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer';
            
            let net = 0;
            if (isIncome) net = amt;
            else if (isExpense) net = -amt;

            currentLiquidez += net;
            
            todosLosMovimientos.push({
              dateString: t.dateString,
              amount: amt,
              netAmount: net,
              in: isIncome ? amt : 0,
              out: isExpense ? amt : 0,
              categoria: 'Día a Día'
            });
          });
        }

        // 4. ACTUALIZAR TARJETAS FRONTEND
        setAhorro(currentAhorro);
        setInversion(currentInversion);
        setLiquidez(currentLiquidez);
        setPatrimonioTotal(currentLiquidez + currentAhorro + currentInversion);
        setTotalMovimientos(todosLosMovimientos.length);

        // 5. CÁLCULO DE GRÁFICA (Matemática Inversa Precisa)
        const now = new Date();
        let minYear = now.getFullYear();
        let minMonth = now.getMonth();
        const flujosPorMes: Record<string, { lq: number, ah: number, inv: number, in: number, out: number }> = {};

        todosLosMovimientos.forEach(mov => {
          if (!mov.dateString) return;
          const f = new Date(mov.dateString);
          if (isNaN(f.getTime())) return;

          const y = f.getFullYear();
          const m = f.getMonth();
          const key = `${y}-${m}`;

          if (y < minYear || (y === minYear && m < minMonth)) {
            minYear = y;
            minMonth = m;
          }

          if (!flujosPorMes[key]) flujosPorMes[key] = { lq: 0, ah: 0, inv: 0, in: 0, out: 0 };

          if (mov.categoria === 'Día a Día') {
            flujosPorMes[key].lq += mov.netAmount;
            flujosPorMes[key].in += mov.in || 0;
            flujosPorMes[key].out += mov.out || 0;
          } else if (mov.categoria === 'Ahorro') {
            flujosPorMes[key].ah += mov.netAmount;
          } else if (mov.categoria === 'Inversión') {
            flujosPorMes[key].inv += mov.netAmount;
          }
        });

        // 6. DIBUJAR LA GRÁFICA HACIA ADELANTE
        let sumLq = 0, sumAh = 0, sumInv = 0;
        Object.values(flujosPorMes).forEach(f => { sumLq += f.lq; sumAh += f.ah; sumInv += f.inv; });

        let runningLq = currentLiquidez - sumLq;
        let runningAh = currentAhorro - sumAh;
        let runningInv = currentInversion - sumInv;

        const dataPoints = [];
        let currY = minYear;
        let currM = minMonth;
        const targetY = now.getFullYear();
        const targetM = now.getMonth();
        const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        while (currY < targetY || (currY === targetY && currM <= targetM)) {
          const key = `${currY}-${currM}`;
          const f = flujosPorMes[key] || { lq: 0, ah: 0, inv: 0, in: 0, out: 0 };

          runningLq += f.lq;
          runningAh += f.ah;
          runningInv += f.inv;

          dataPoints.push({
            year: currY,
            month: currM,
            name: modoFiltro === 'Total' ? `${MONTHS[currM]} ${currY.toString().slice(-2)}` : MONTHS[currM],
            Saldo: runningLq,
            Ahorro: runningAh,
            Inversion: runningInv,
            Ingresos: f.in,
            Gastos: f.out
          });

          currM++;
          if (currM > 11) { currM = 0; currY++; }
        }

        // 7. APLICAR FILTRO DE VISTA (Total o Año)
        if (modoFiltro === 'Año') {
          const yearData = [];
          for (let i = 0; i < 12; i++) {
            const dp = dataPoints.find(d => d.year === yearSeleccionado && d.month === i);
            if (dp) {
              yearData.push(dp);
            } else {
              yearData.push({ name: MONTHS[i], Saldo: null, Ahorro: null, Inversion: null, Ingresos: null, Gastos: null });
            }
          }
          setDatosGrafica(yearData);
        } else {
          setDatosGrafica(dataPoints);
        }

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
