import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  datosGrafica: any[];
}

export const PatrimonioChart = ({ datosGrafica }: Props) => {
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
              <span className="text-white font-bold text-xs">{Number(entry.value).toLocaleString('es-ES')} €</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
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
          <LineChart data={datosGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value}€`} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#2d2d2d', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* ÚNICA LÍNEA CONTINUA (Saldo) */}
            <Line type="monotone" dataKey="Saldo" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            
            {/* RESTO DE LÍNEAS PUNTEADAS */}
            <Line type="monotone" dataKey="Ingresos" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Ahorro" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Inversion" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
