import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SavingsChartProps {
  transactions: any[];
}

export const SavingsChart = ({ transactions }: SavingsChartProps) => {
  const [view, setView] = useState<'month' | 'year' | 'total'>('year');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Algoritmo de "Event Sourcing" para saber el saldo en cualquier fecha del pasado
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      const days = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const endOfDay = new Date(year, month, i, 23, 59, 59);
        data.push({ name: `${i}`, ...getBalancesAtDate(endOfDay) });
      }
    } else if (view === 'year') {
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      for (let i = 0; i < 12; i++) {
        const endOfMonth = new Date(year, i + 1, 0, 23, 59, 59);
        data.push({ name: monthNames[i], ...getBalancesAtDate(endOfMonth) });
      }
    } else if (view === 'total') {
      const currentY = new Date().getFullYear();
      for (let y = currentY - 2; y <= currentY + 2; y++) {
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);
        data.push({ name: `${y}`, ...getBalancesAtDate(endOfYear) });
      }
    }
    return data;
  };

  const data = generateData();

  const handlePrev = () => {
    if (view === 'year') setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()));
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  const handleNext = () => {
    if (view === 'year') setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()));
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const label = view === 'month' ? currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 
                view === 'year' ? `${currentDate.getFullYear()}` : 'Todos los años';

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 text-sm font-medium">
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded-full transition-colors ${view === 'month' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-500 hover:text-white'}`}>Mes</button>
          <button onClick={() => setView('year')} className={`px-3 py-1 rounded-full transition-colors ${view === 'year' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-500 hover:text-white'}`}>Año</button>
          <button onClick={() => setView('total')} className={`px-3 py-1 rounded-full transition-colors ${view === 'total' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-500 hover:text-white'}`}>Total</button>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          {view !== 'total' && <button onClick={handlePrev}><ChevronLeft size={16} className="text-gray-500 hover:text-white" /></button>}
          <span className="capitalize">{label}</span>
          {view !== 'total' && <button onClick={handleNext}><ChevronRight size={16} className="text-gray-500 hover:text-white" /></button>}
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={{ stroke: '#2d2d2d' }} />
            <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#151515', borderColor: '#2d2d2d', color: '#fff' }} formatter={(val: number) => `${val.toFixed(2)}€`} />
            <Bar dataKey="disp" name="Disponible" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="hucha" name="En huchas" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#10b981] rounded-sm"></div> Disponible</div>
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#60a5fa] rounded-sm"></div> En huchas</div>
      </div>
    </div>
  );
};
