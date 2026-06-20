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
        // 1. SALDOS ACTUALES REALES
        const currentAhorro = Number(localStorage.getItem('aio_ahorro_total') || 0);
        
        const invBalanceGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
        const invBolsaInv = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
        const invBolsaDisp = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
        const invProyInv = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
        const invProyDisp = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
        const currentInversion = invBalanceGlobal + invBolsaInv + invBolsaDisp + invProyInv + invProyDisp;

        const todosLosMovimientos: any[] = [];

        // 2. RECOPILACIÓN DE MOVIMIENTOS
        // - Inversión
        const movInv = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
        movInv.forEach((m: any) => {
          todosLosMovimientos.push({ ...m, categoria: 'Inversión', netAmount: Number(m.amount) });
        });

        // - Ahorro
        const movAh = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]');
        movAh.forEach((m: any) => {
          // Confiamos en el signo del importe para saber si sumó o restó al ahorro total
          todosLosMovimientos.push({ dateString: m.dateString || m.date, amount: Number(m.amount), netAmount: Number(m.amount), categoria: 'Ahorro' });
        });

        // - Día a Día (Firebase)
        let currentLiquidez = 0;
        const monthsSnap = await getDocs(collection(db, `users/${user.uid}/finance_months`));
        
        for (const monthDoc of monthsSnap.docs) {
          const transSnap = await getDocs(collection(db, `users/${user.uid}/finance_months/${monthDoc.id}/transactions`));
          transSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount) || 0;
            const isIncome = t.type === 'income' || t.type === 'savings_return';
            const isExpense = t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer';
            
            if (isIncome) currentLiquidez += amt;
            if (isExpense) currentLiquidez -= amt;
            
            todosLosMovimientos.push({
              dateString: t.dateString,
              amount: isIncome ? amt : -amt,
              netAmount: isIncome ? amt : -amt,
              in: isIncome ? amt : 0,
              out: isExpense ? amt : 0,
              categoria: 'Día a Día'
            });
          });
        }

        // 3. ACTUALIZAR TARJETAS
        setAhorro(currentAhorro);
        setInversion(currentInversion);
        setLiquidez(currentLiquidez);
        setPatrimonioTotal(currentLiquidez + currentAhorro + currentInversion);
        setTotalMovimientos(todosLosMovimientos.length);

        // 4. AGRUPAR FLUJOS POR MES Y BUSCAR EL INICIO DE LOS TIEMPOS
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

        // 5. CALCULAR SALDO INICIAL E IR HACIA ADELANTE (Fórmula infalible)
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

        // 6. FILTRAR SEGÚN LO QUE ELIJA EL USUARIO
        if (modoFiltro === 'Año') {
          const yearData = [];
          for (let i = 0; i < 12; i++) {
            const dp = dataPoints.find(d => d.year === yearSeleccionado && d.month === i);
            if (dp) {
              yearData.push(dp);
            } else {
              // Si es un mes del futuro, dejamos las líneas en null para que no caigan a 0
              if (yearSeleccionado === targetY && i > targetM) {
                yearData.push({ name: MONTHS[i], Saldo: null, Ahorro: null, Inversion: null, Ingresos: null, Gastos: null });
              } else {
                yearData.push({ name: MONTHS[i], Saldo: null, Ahorro: null, Inversion: null, Ingresos: null, Gastos: null });
              }
            }
          }
          setDatosGrafica(yearData);
        } else {
          // 'Total': Muestra todo el historial disponible sin cortes
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
