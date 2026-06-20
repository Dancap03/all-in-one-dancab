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
        // 1. INVERSIÓN
        const invBalanceGlobal = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
        const invBolsaInv = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
        const invBolsaDisp = Number(localStorage.getItem('aio_inv_bolsa_disponible') || 0);
        const invProyInv = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
        const invProyDisp = Number(localStorage.getItem('aio_inv_proyecto_disponible') || 0);
        
        const saldoInversion = invBalanceGlobal + invBolsaInv + invBolsaDisp + invProyInv + invProyDisp;
        setInversion(saldoInversion);
        
        const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]').map((m: any) => ({
          ...m, 
          categoria: 'Inversión',
          netAmount: m.amount // Asumimos que los movimientos guardados son flujo neto
        }));

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
              amount: t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer' ? -amt : amt,
              categoria: 'Día a Día'
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
            amount: t.type === 'withdrawal' || t.type === 'to_vault' ? -amt : amt,
            netAmount: t.type === 'deposit' ? amt : (t.type === 'withdrawal' ? -amt : 0), // El cambio real en el balance total
            categoria: 'Ahorro'
          });
        });
        setAhorro(saldoAhorro);

        // 4. PATRIMONIO TOTAL
        setPatrimonioTotal(saldoLiquidez + saldoAhorro + saldoInversion);

        // 5. CÁLCULO DE GRÁFICA (Matemática Inversa Precisa)
        const todosLosMovimientos = [...movInversion, ...movDiaADia, ...movAhorro];
        setTotalMovimientos(todosLosMovimientos.length);

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const graficaBase = meses.map(m => ({ name: m, Saldo: 0, Ingresos: 0, Gastos: 0, Ahorro: 0, Inversion: 0 }));

        // Agrupar flujos netos por "Año-Mes"
        const flujosPorMes: Record<string, { lq: number, ah: number, inv: number, in: number, out: number }> = {};
        
        todosLosMovimientos.forEach(mov => {
          if (!mov.dateString) return;
          const f = new Date(mov.dateString);
          const key = `${f.getFullYear()}-${f.getMonth()}`;
          if (!flujosPorMes[key]) flujosPorMes[key] = { lq: 0, ah: 0, inv: 0, in: 0, out: 0 };

          if (mov.categoria === 'Día a Día') {
            flujosPorMes[key].lq += mov.amount;
            if (mov.amount > 0) flujosPorMes[key].in += mov.amount;
            else flujosPorMes[key].out += Math.abs(mov.amount);
          } else if (mov.categoria === 'Ahorro') {
            flujosPorMes[key].ah += mov.netAmount || 0;
          } else if (mov.categoria === 'Inversión') {
            flujosPorMes[key].inv += mov.amount;
          }
        });

        // Retroceder en el tiempo desde el balance de HOY hacia atrás
        let runningLq = saldoLiquidez;
        let runningAh = saldoAhorro;
        let runningInv = saldoInversion;

        const now = new Date();
        let currY = now.getFullYear();
        let currM = now.getMonth();

        // Bucle temporal inverso (Desde el mes actual hasta Enero del año seleccionado)
        while (currY > yearSeleccionado || (currY === yearSeleccionado && currM >= 0)) {
          const key = `${currY}-${currM}`;
          const flow = flujosPorMes[key] || { lq: 0, ah: 0, inv: 0, in: 0, out: 0 };

          if (currY === yearSeleccionado) {
            graficaBase[currM].Saldo = runningLq;
            graficaBase[currM].Ahorro = runningAh;
            graficaBase[currM].Inversion = runningInv;
            graficaBase[currM].Ingresos = flow.in;
            graficaBase[currM].Gastos = flow.out;
          }

          // Restar el flujo de este mes para obtener el balance del mes anterior
          runningLq -= flow.lq;
          runningAh -= flow.ah;
          runningInv -= flow.inv;

          currM--;
          if (currM < 0) {
            currM = 11;
            currY--;
          }
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
