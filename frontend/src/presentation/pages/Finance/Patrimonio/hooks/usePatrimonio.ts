import { useState, useEffect } from 'react';

export const usePatrimonio = () => {
  const [modoFiltro, setModoFiltro] = useState<'Total' | 'Año' | 'Mes'>('Total');
  const [yearSeleccionado, setYearSeleccionado] = useState(new Date().getFullYear());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());

  const [patrimonioTotal, setPatrimonioTotal] = useState(0);
  const [liquidez, setLiquidez] = useState(0);
  const [ahorro, setAhorro] = useState(0);
  const [inversion, setInversion] = useState(0);
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);
  const [totalMovimientos, setTotalMovimientos] = useState(0);

  useEffect(() => {
    // 1. LECTURA DE SALDOS ACTUALES
    const saldoLiquidez = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
    const saldoAhorro = Number(localStorage.getItem('aio_ahorro_total') || 0);
    const invBolsa = Number(localStorage.getItem('aio_inv_bolsa_invertido') || 0);
    const invProy = Number(localStorage.getItem('aio_inv_proyecto_invertido') || 0);
    const saldoInversion = invBolsa + invProy;

    // 2. LECTURA DE HISTORIALES
    const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
    const movDiaADia = JSON.parse(localStorage.getItem('aio_diadia_movimientos') || '[]');
    const movAhorro = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]');
    
    const todosLosMovimientos = [...movInversion, ...movDiaADia, ...movAhorro];
    setTotalMovimientos(todosLosMovimientos.length);

    // 3. ACTUALIZACIÓN DE TARJETAS
    setLiquidez(saldoLiquidez);
    setAhorro(saldoAhorro);
    setInversion(saldoInversion);
    setPatrimonioTotal(saldoLiquidez + saldoAhorro + saldoInversion);

    // 4. CONSTRUCCIÓN DE LA GRÁFICA
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const graficaBase = meses.map(m => ({ name: m, Saldo: 0, Ingresos: 0, Gastos: 0, Ahorro: 0, Inversion: 0 }));

    todosLosMovimientos.forEach(mov => {
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
  }, [modoFiltro, yearSeleccionado, mesSeleccionado]);

  return {
    modoFiltro, setModoFiltro,
    yearSeleccionado, setYearSeleccionado,
    mesSeleccionado, setMesSeleccionado,
    patrimonioTotal, liquidez, ahorro, inversion,
    datosGrafica, totalMovimientos
  };
};
