import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronRight, Receipt, PiggyBank, TrendingUp, History } from 'lucide-react';

export const Patrimonio = () => {
  const navigate = useNavigate();
  
  // Estado para el filtro de tiempo superior
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('Total');
  const opcionesPeriodo = ['Total', '2025', '2026', 'Jun'];

  // Estados de datos globales (Mocks basados en tus imágenes)
  const [patrimonioTotal, setPatrimonioTotal] = useState(12840);
  const [liquidez, setLiquidez] = useState(2340);
  const [ahorro, setAhorro] = useState(4200);
  const [inversion, setInversion] = useState(6300);

  // Simulación de carga inicial (Aquí irá tu lógica de Firebase en el futuro)
  useEffect(() => {
    // Aquí puedes leer del localStorage o Firebase para unificar los datos reales
    // setLiquidez(Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 2340));
  }, []);

  // Datos mockeados para la gráfica de tendencias con las 5 líneas solicitadas
  const dataTendencias = [
    { name: 'Ene', Saldo: 1200, Ingresos: 2500, Gastos: 1800, Ahorro: 3900, Inversion: 5100 },
    { name: 'Feb', Saldo: 1500, Ingresos: 2600, Gastos: 1700, Ahorro: 4000, Inversion: 5300 },
    { name: 'Mar', Saldo: 1300, Ingresos: 2500, Gastos: 2200, Ahorro: 4050, Inversion: 5600 },
    { name: 'Abr', Saldo: 1800, Ingresos: 2800, Gastos: 1900, Ahorro: 4100, Inversion: 5800 },
    { name: 'May', Saldo: 2100, Ingresos: 2700, Gastos: 1800, Ahorro: 4150, Inversion: 6000 },
    { name: 'Jun', Saldo: 2340, Ingresos: 3000, Gastos: 2100, Ahorro: 4200, Inversion: 6300 },
  ];

  // Tooltip personalizado para la gráfica
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-lg px-4 py-3 shadow-2xl">
          <p className="text-gray-400 text-xs font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-300 text-xs">{entry.name}</span>
              </div>
              <span className="text-white font-bold text-xs">{entry.value} €</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full text-white space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 1. CABECERA: Título y Selector de Tiempo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-black tracking-tight">Resumen<br/>financiero</h1>
        
        <div className="flex bg-[#141416] border border-[#2d2d2d] rounded-xl p-1 w-fit">
          {opcionesPeriodo.map((opcion) => (
            <button
              key={opcion}
              onClick={() => setPeriodoSeleccionado(opcion)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                periodoSeleccionado === opcion 
                  ? 'bg-[#2d2d2d] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TARJETA GIGANTE: Patrimonio Total */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <p className="text-gray-400 font-medium mb-1">Patrimonio total</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-black">{patrimonioTotal.toLocaleString('es-ES')} €</span>
        </div>
        <p className="text-[#10b981] font-bold text-sm mb-6 flex items-center gap-1">
          ↑ +412 € este mes • +3.2%
        </p>

        {/* Sub-bloques de distribución */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
            <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Liquidez</p>
            <p className="text-emerald-400 font-bold text-sm sm:text-lg">{liquidez.toLocaleString('es-ES')} €</p>
          </div>
          <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
            <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Ahorro</p>
            <p className="text-indigo-400 font-bold text-sm sm:text-lg">{ahorro.toLocaleString('es-ES')} €</p>
          </div>
          <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
            <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Inversión</p>
            <p className="text-orange-400 font-bold text-sm sm:text-lg">{inversion.toLocaleString('es-ES')} €</p>
          </div>
        </div>
      </div>

      {/* 3. GRID 2x2: Tarjetas de Navegación Rápida */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tarjeta Día a Día */}
        <div onClick={() => navigate('/finance/diadia')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
          <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
            <Receipt size={16} />
          </div>
          <p className="text-gray-400 text-xs font-medium mb-1">Día a día</p>
          <p className="text-white font-bold text-xl mb-1">-1.240 €</p>
          <p className="text-gray-500 text-[10px]">Gastos del mes</p>
        </div>

        {/* Tarjeta Ahorro */}
        <div onClick={() => navigate('/finance/ahorro')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
          <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
          <p className="text-gray-400 text-xs font-medium mb-1 mt-11">Ahorro</p>
          <p className="text-white font-bold text-xl mb-1">{ahorro.toLocaleString('es-ES')} €</p>
          <p className="text-gray-500 text-[10px]">3 huchas activas</p>
        </div>

        {/* Tarjeta Inversión */}
        <div onClick={() => navigate('/finance/inversion')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
          <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
            <TrendingUp size={16} />
          </div>
          <p className="text-gray-400 text-xs font-medium mb-1">Inversión</p>
          <p className="text-white font-bold text-xl mb-1">{inversion.toLocaleString('es-ES')} €</p>
          <p className="text-gray-500 text-[10px]">+18.4% total</p>
        </div>

        {/* Tarjeta Historial */}
        <div onClick={() => alert('Vista de Historial Global en desarrollo')} className="bg-[#141416] border border-[#2d2d2d] p-5 rounded-2xl cursor-pointer hover:bg-[#1a1a1c] transition-colors group relative">
          <ChevronRight size={16} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-400 mb-3">
            <History size={16} />
          </div>
          <p className="text-gray-400 text-xs font-medium mb-1">Historial</p>
          <p className="text-white font-bold text-xl mb-1">342</p>
          <p className="text-gray-500 text-[10px]">movimientos totales</p>
        </div>
      </div>

      {/* 4. GRÁFICA: Tendencia de Saldo (Avanzada) */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-bold text-white text-lg tracking-tight">Tendencia de saldo</h2>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-xs text-gray-400">Saldo</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div><span className="text-xs text-gray-400">Ingresos</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div><span className="text-xs text-gray-400">Gastos</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></div><span className="text-xs text-gray-400">Ahorro</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div><span className="text-xs text-gray-400">Inversión</span></div>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataTendencias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value}€`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2d2d2d', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {/* Líneas requeridas */}
              <Line type="monotone" dataKey="Saldo" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Ingresos" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Ahorro" stroke="#818cf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Inversion" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
