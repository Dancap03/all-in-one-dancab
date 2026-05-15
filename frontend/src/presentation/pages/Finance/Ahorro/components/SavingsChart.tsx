import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SavingsChartProps {
  transactions: any[];
}

export const SavingsChart = ({ transactions }: SavingsChartProps) => {
  const [view, setView] = useState<'year' | 'total'>('year');
  const [currentDate, setCurrentDate] = useState(new Date());

  const realNow = new Date();
  const currentYear = realNow.getFullYear();

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
    const data: any[] = [];
    const viewedYear = currentDate.getFullYear();
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    if (view === 'year') {
      // Mostrar SIEMPRE los 12 meses del año
      for (let i = 0; i < 12; i++) {
        const endOfMonth = new Date(viewedYear, i + 1, 0, 23, 59, 59);
        data.push({ name: monthNamesShort[i], ...getBalancesAtDate(endOfMonth) });
      }
    } else if (view === 'total') {
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

  const isCurrentYear = currentDate.getFullYear() === currentYear;

  const handlePrev = () => { if (view === 'year') setCurrentDate(new Date(currentDate.getFullYear() - 1, 0)); };
  
  // Bloquear navegación al futuro
  const handleNext = () => { if (view === 'year' && !isCurrentYear) setCurrentDate(new Date(currentDate.getFullYear() + 1, 0)); };

  const label = view === 'year' ? `${currentDate.getFullYear()}` : 'Todos los años';
  const yearsList = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm mb-6 relative">
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <div className="flex gap-3 text-sm font-medium p-1 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d]">
          <button onClick={() => setView('year')} className={`px-4 py-1.5 rounded-md transition-colors ${view === 'year' ? 'bg-[#10b981]/10 text-[#10b981] font-bold' : 'text-gray-500 hover:text-white'}`}>Año</button>
          <button onClick={() => setView('total')} className={`px-4 py-1.5 rounded-md transition-colors ${view === 'total' ? 'bg-[#10b981]/10 text-[#10b981] font-bold' : 'text-gray-500 hover:text-white'}`}>Total</button>
        </div>
        
        <div className="flex items-center gap-3 text-sm font-bold bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] px-4 py-1.5">
          {view === 'year' && <button onClick={handlePrev} className="text-gray-500 hover:text-white"><ChevronLeft size={16} /></button>}
          
          <div className="relative flex items-center justify-center w-12 cursor-pointer hover:text-[#10b981] transition-colors group">
            <span className="capitalize text-center block w-full">{label}</span>
            {/* Selector de año nativo invisible */}
            {view === 'year' && (
              <select 
                value={currentDate.getFullYear()} 
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), 0))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {yearsList.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          {view === 'year' && (
            <button onClick={handleNext} disabled={isCurrentYear} className={`transition-colors ${isCurrentYear ? 'text-[#2d2d2d] cursor-not-allowed' : 'text-gray-500 hover:text-white'}`}>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

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
             Aún no hay actividad.
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6 mt-4 border-t border-[#2d2d2d] pt-4">
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#10b981] rounded-sm"></div> Disponible</div>
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#60a5fa] rounded-sm"></div> En huchas</div>
      </div>
    </div>
  );
};
