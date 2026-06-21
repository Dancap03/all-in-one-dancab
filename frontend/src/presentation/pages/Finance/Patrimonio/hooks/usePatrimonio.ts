import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export const usePatrimonio = () => {
  const [modoFiltro, setModoFiltro] = useState<'Total' | 'Año'>('Año');
  const [yearSeleccionado, setYearSeleccionado] = useState<number>(new Date().getFullYear());

  const [patrimonioTotal, setPatrimonioTotal] = useState(0);
  const [liquidez, setLiquidez] = useState(0);
  const [ahorro, setAhorro] = useState(0);
  const [inversion, setInversion] = useState(0);
  
  const [datosGraficaMaestra, setDatosGraficaMaestra] = useState<any[]>([]);
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealData = async (user: any) => {
      try {
        const todosLosMovimientos: any[] = [];
        let currentLiquidez = 0;
        let currentAhorro = 0;
        let currentInversion = 0;

        // ==========================================
        // 1. INVERSIÓN (Suma exacta de todo el módulo)
        // ==========================================
        const invRef = doc(db, `users/${user.uid}/investment_balances`, 'data');
        const invSnap = await getDoc(invRef);

        if (invSnap.exists()) {
          const data = invSnap.data();
          currentInversion = (Number(data.bolsaInvertido) || 0) + 
                             (Number(data.bolsaDisponible) || 0) + 
                             (Number(data.bolsaGanancias) || 0) + 
                             (Number(data.proyectoInvertido) || 0) + 
                             (Number(data.proyectoDisponible) || 0) + 
                             (Number(data.proyectoGanado) || 0) + 
                             (Number(data.disponibleGlobal) || 0);
        }

        const invTransSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
        if (!invTransSnap.empty) {
           invTransSnap.docs.forEach(d => {
             const t = d.data();
             todosLosMovimientos.push({
               dateString: t.dateString || t.createdAt || new Date().toISOString(),
               amount: Number(t.amount) || 0,
               netAmount: Number(t.amount) || 0,
               categoria: 'Inversión'
             });
           });
        }

        // ==========================================
        // 2. AHORRO
        // ==========================================
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        if (!savTransSnap.empty) {
          savTransSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount) || 0;
            let net = 0;
            
            if (t.type === 'deposit') net = amt;
            else if (t.type === 'withdrawal') net = -amt;
            
            currentAhorro += net;

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
        }

        // ==========================================
        // 3. DÍA A DÍA (Lectura real de finance_months)
        // ==========================================
        let diaLoaded = false;
        const monthsSnap = await getDocs(collection(db, `users/${user.uid}/finance_months`));
        
        if (!monthsSnap.empty) {
          diaLoaded = true;
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
                dateString: t.dateString || t.date || new Date().toISOString(),
                amount: amt,
                netAmount: net,
                in: isIncome ? amt : 0,
                out: isExpense ? amt : 0,
                categoria: 'Día a Día'
              });
            });
          }
        }

        // Si la nube está vacía temporalmente, forzamos lectura del balance local para que no veas 0€
        if (!diaLoaded || currentLiquidez === 0) {
           const balLocal = Number(localStorage.getItem('aio_balance') || localStorage.getItem('aio_finance_balance') || localStorage.getItem('aio_balance_v2') || 0);
           if (balLocal !== 0) currentLiquidez = balLocal;
        }

        // ==========================================
        // 4. ACTUALIZAR LAS TARJETAS PRINCIPALES
        // ==========================================
        setAhorro(currentAhorro);
        setInversion(currentInversion);
        setLiquidez(currentLiquidez);
        setPatrimonioTotal(currentLiquidez + currentAhorro + currentInversion);
        setTotalMovimientos(todosLosMovimientos.length);

        // ==========================================
        // 5. CONSTRUCCIÓN MATEMÁTICA DE LA GRÁFICA
        // ==========================================
        const now = new Date();
        let minYear = now.getFullYear();
        let minMonth = now.getMonth();
        const flujosPorMes: Record<string, { lq: number, ah: number, inv: number, in: number, out: number }> = {};

        // Agrupamos el dinero que se ha movido cada mes
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

        // Restamos todo el historial al saldo actual para averiguar con cuánto dinero empezaste el año
        let sumLq = 0, sumAh = 0, sumInv = 0;
        Object.values(flujosPorMes).forEach(f => { sumLq += f.lq; sumAh += f.ah; sumInv += f.inv; });

        let runningLq = currentLiquidez - sumLq;
        let runningAh = currentAhorro - sumAh;
        let runningInv = currentInversion - sumInv;

        // Construimos la línea de tiempo mes a mes
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
            name: `${MONTHS[currM]} ${currY.toString().slice(-2)}`,
            Saldo: runningLq,
            Ahorro: runningAh,
            Inversion: runningInv,
            Ingresos: f.in,
            Gastos: f.out
          });

          currM++;
          if (currM > 11) { currM = 0; currY++; }
        }

        setDatosGraficaMaestra(dataPoints);

      } catch (error) {
        console.error("Error al cargar los datos del patrimonio:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) loadRealData(user);
      else setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 6. FILTRO DE VISTA DE LA GRÁFICA ---
  const datosGrafica = useMemo(() => {
    if (!datosGraficaMaestra || datosGraficaMaestra.length === 0) return [];

    if (modoFiltro === 'Año') {
      const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const yearData = [];
      const now = new Date();
      
      // Rescatar los balances del año anterior para no empezar la gráfica a 0
      let lastLq = 0, lastAh = 0, lastInv = 0;
      const preYearData = datosGraficaMaestra.filter(d => d.year < yearSeleccionado);
      if (preYearData.length > 0) {
         const last = preYearData[preYearData.length - 1];
         lastLq = last.Saldo; lastAh = last.Ahorro; lastInv = last.Inversion;
      }

      for (let i = 0; i < 12; i++) {
        const dp = datosGraficaMaestra.find(d => d.year === yearSeleccionado && d.month === i);
        if (dp) {
          yearData.push({ ...dp, name: MONTHS[i] });
          lastLq = dp.Saldo; lastAh = dp.Ahorro; lastInv = dp.Inversion;
        } else {
          // Si estamos en un mes que aún no ha llegado, dejamos la gráfica en blanco
          if (yearSeleccionado > now.getFullYear() || (yearSeleccionado === now.getFullYear() && i > now.getMonth())) {
             yearData.push({ name: MONTHS[i], Saldo: null, Ahorro: null, Inversion: null, Ingresos: null, Gastos: null });
          } else {
             // Si es un mes pasado en el que no hubo movimientos, arrastramos el saldo del mes anterior
             yearData.push({ name: MONTHS[i], Saldo: lastLq, Ahorro: lastAh, Inversion: lastInv, Ingresos: 0, Gastos: 0 });
          }
        }
      }
      return yearData;
    }
    
    return datosGraficaMaestra;
  }, [datosGraficaMaestra, modoFiltro, yearSeleccionado]);

  return {
    modoFiltro, setModoFiltro,
    yearSeleccionado, setYearSeleccionado,
    patrimonioTotal, liquidez, ahorro, inversion,
    datosGrafica, totalMovimientos,
    loading
  };
};
