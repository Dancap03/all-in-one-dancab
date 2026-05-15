import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SavingsChartProps {
  transactions: any[];
}

export const SavingsChart = ({ transactions }: SavingsChartProps) => {
  // CORRECCIÓN: El estado por defecto es 'year', quitamos 'month'
  const [view, setView] = useState<'year' | 'total'>('year');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Algoritmo de "Event Sourcing" para saber el saldo en cualquier fecha del pasado (se queda igual)
  const getBalancesAtDate = (targetDate: Date) => {
    let disp = 0; let hucha = 0;
    transactions.forEach(t => {
      if (t.date && new Date(t.date.seconds * 1000).getTime() <= targetDate.getTime()) {
        if (t.type === 'deposit') disp += t.amount;
        if (t.type === 'withdrawal') disp -= t.amount;
        if (t.type === 'to_vault') { disp -= t.amount; hucha += t.amount; }
        if (t.type === 'from_vault') { disp += t.amount; hucha -= t.amount; }
      }
    });
    return { disp: Math.max(0, disp), hucha: Math.max(0, hucha) };
  };

  const generateData = () => {
    const data = [];
    const currentYear = currentDate.getFullYear();
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    if (view === 'year') {
      // CORRECCIÓN LÓGICA: Data-Driven X-Axis (Eje X basado en datos reales)
      // 1. Buscamos los meses únicos del año actual que tienen transacciones reales
      const distinctActiveMonths = new Set<number>();
      transactions.forEach(t => {
        if (!t.date) return;
        const transDate = new Date(t.date.seconds * 1000);
        if (transDate.getFullYear() === currentYear) { distinctActiveMonths.add(transDate.getMonth()); }
      });

      // 2. Si no hay datos este año, no mostramos barras
      if (distinctActiveMonths.size === 0) return [];

      // 3. Ordenamos los meses cronológicamente y generamos la barra calculando el saldo acumulado a final de ese mes
      const sortedMonths = Array.from(distinctActiveMonths).sort((a, b) => a - b);
      sortedMonths.forEach(m => {
        // Obtenemos el último día de ese mes a última hora
        const endOfActiveMonth = new Date(currentYear, m + 1, 0, 23, 59, 59);
        data.push({ name: `${monthNamesShort[m]} '${currentYear.toString().slice(-2)}`, ...getBalancesAtDate(endOfActiveMonth) });
      });
    } else if (view === 'total') {
      // CORRECCIÓN LÓGICA: También data-driven para total (solo años con datos)
      const distinctActiveYears = new Set<number>();
      transactions.forEach(t => { if (t.date) { distinctActiveYears.add(new Date(t.date.seconds * 1000).getFullYear()); } });
      if (distinctActiveYears.size === 0) return [];

      const sortedYears = Array.from(distinctActiveYears).sort((a, b) => a - b);
      sortedYears.forEach(y => {
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);
        data.push({ name: `${y}`, ...getBalancesAtDate(endOfYear) });
      });
    }
    return data;
  };

  const data = generateData();

  // Navegación (solo para años)
  const handlePrev = () => { if (view === 'year') setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth())); };
  const handleNext = () => { if (view === 'year') setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth())); };

  const label = view === 'year' ? `${currentDate.getFullYear()}` : 'Todos los años';

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm mb-6 relative">
      {/* Cabecera del gráfico */}
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <div className="flex gap-3 text-sm font-medium p-1 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d]">
          {/* CORRECCIÓN: Botones actualizados, quitamos 'month' */}
          <button onClick={() => setView('year')} className={`px-4 py-1.5 rounded-md transition-colors ${view === 'year' ? 'bg-[#10b981]/10 text-[#10b981] font-bold' : 'text-gray-500 hover:text-white'}`}>Año</button>
          <button onClick={() => setView('total')} className={`px-4 py-1.5 rounded-md transition-colors ${view === 'total' ? 'bg-[#10b981]/10 text-[#10b981] font-bold' : 'text-gray-500 hover:text-white'}`}>Total</button>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] px-4 py-1.5">
          {view === 'year' && <button onClick={handlePrev}><ChevronLeft size={16} className="text-gray-500 hover:text-white" /></button>}
          <span className="capitalize w-12 text-center text-gray-200">{label}</span>
          {view === 'year' && <button onClick={handleNext}><ChevronRight size={16} className="text-gray-500 hover:text-white" /></button>}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[200px] w-full z-0 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={0} barCategoryGap="25%">
              <XAxis dataKey="name" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={{ stroke: '#2d2d2d' }} interval={0} />
              <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#151515', borderColor: '#2d2d2d', color: '#fff', borderRadius: '8px' }} formatter={(val: number) => `${val.toFixed(2)}€`} />
              <Bar dataKey="disp" name="Disponible" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="hucha" name="En huchas" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-600 italic text-sm gap-2">
             <div className="w-12 h-12 rounded-full border border-[#2d2d2d] flex items-center justify-center text-2xl">📊</div>
             Aún no hay actividad de ahorro en {currentDate.getFullYear()}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4 border-t border-[#2d2d2d] pt-4">
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#10b981] rounded-sm"></div> Disponible</div>
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#60a5fa] rounded-sm"></div> En huchas</div>
      </div>
    </div>
  );
};
