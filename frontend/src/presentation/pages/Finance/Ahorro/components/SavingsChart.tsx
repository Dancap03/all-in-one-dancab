import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
 
export const SavingsChart = () => { 
  // Datos simulados para representar la gráfica de tu imagen
  const data = [
    { name: 'ene', disp: 0, hucha: 0 }, { name: 'feb', disp: 0, hucha: 0 },
    { name: 'mar', disp: 0, hucha: 0 }, { name: 'abr', disp: 0, hucha: 0 },
    { name: 'may', disp: 10, hucha: 250 }, { name: 'jun', disp: 0, hucha: 0 },
    { name: 'jul', disp: 0, hucha: 0 }, { name: 'ago', disp: 0, hucha: 0 },
    { name: 'sep', disp: 0, hucha: 0 }, { name: 'oct', disp: 0, hucha: 0 },
    { name: 'nov', disp: 0, hucha: 0 }, { name: 'dic', disp: 0, hucha: 0 },
  ];

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm mb-6">
      {/* Cabecera del gráfico */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-gray-500 cursor-pointer hover:text-white">Mes</span>
          <span className="bg-[#10b981]/10 text-[#10b981] px-3 py-1 rounded-full cursor-pointer">Año</span>
          <span className="text-gray-500 cursor-pointer hover:text-white">Total</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          <ChevronLeft size={16} className="text-gray-500 cursor-pointer hover:text-white" />
          <span>2026</span>
          <ChevronRight size={16} className="text-gray-500 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={{ stroke: '#2d2d2d' }} />
            <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#151515', borderColor: '#2d2d2d', color: '#fff' }} />
            <Bar dataKey="disp" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="hucha" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#10b981] rounded-sm"></div> Disponible</div>
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 bg-[#60a5fa] rounded-sm"></div> En huchas</div>
      </div>
    </div>
  );
};
