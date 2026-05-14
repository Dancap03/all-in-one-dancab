import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

export const DiaDia = () => {
  // Datos de ejemplo basados en tu imagen de Mayo 2026
  const dataPie = [{ name: 'Inversión', value: 100 }];
  const dataDonut = [
    { name: 'Ingresos', value: 390.00 },
    { name: 'Gastos', value: 79.15 }
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-6">
      {/* Selector de Fecha */}
      <div className="flex items-center gap-4 mb-8">
        <ChevronLeft className="text-gray-500 cursor-pointer" />
        <h1 className="text-xl font-bold">Mayo 2026</h1>
        <ChevronRight className="text-gray-500 cursor-pointer" />
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-1">Balance</p>
          <p className="text-2xl font-bold text-blue-500">370.85€</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-1">Ingresos</p>
          <p className="text-2xl font-bold text-green-500">+390.00€</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-1">Gastos</p>
          <p className="text-2xl font-bold text-red-500">-79.15€</p>
        </div>
      </div>

      {/* Fila de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-80">
          <h2 className="font-bold mb-4">Distribución de gastos</h2>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={dataPie} innerRadius={0} outerRadius={80} fill="#f59e0b" dataKey="value" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-2 items-center text-xs text-gray-400">
             <div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Inversión
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-80">
          <h2 className="font-bold mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={dataDonut} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                <Cell fill="#3b82f6" />
                <Cell fill="#ef4444" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32">
            <p className="text-xl font-bold">+371€</p>
            <p className="text-xs text-gray-500">balance</p>
          </div>
        </div>
      </div>

      {/* Presupuesto e Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Presupuesto mensual</h2>
            <button className="bg-[#2d2d2d] text-xs px-3 py-1 rounded">Editar</button>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <p className="text-gray-400">Presupuesto: <span className="text-white font-bold">200€</span></p>
            <p className="text-green-500">Restante: 200.00€</p>
          </div>
          <div className="h-24 bg-[#0c0c0c] rounded flex items-end p-4">
             <div className="w-full bg-[#10b981] h-20 rounded-t opacity-80"></div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#2d2d2d] py-2 text-sm text-gray-400">
            <Plus size={16} /> Añadir gasto
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="font-bold mb-4">Ingresos</h2>
          <div className="flex justify-between items-center py-2 border-b border-[#2d2d2d]">
            <div>
              <p className="text-sm font-bold">—</p>
              <p className="text-xs text-gray-500">9 may</p>
            </div>
            <p className="text-green-500 font-bold">+390.00€</p>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#2d2d2d] py-2 text-sm text-gray-400">
            <Plus size={16} /> Añadir ingreso
          </button>
        </div>
      </div>

      {/* Otros y Transferencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="font-bold mb-4">Otros gastos</h2>
          <button className="w-full flex items-center justify-center gap-2 border border-dashed border-[#2d2d2d] py-2 text-sm text-gray-400">
            <Plus size={16} /> Añadir otro gasto
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="font-bold mb-4">Transferencias enviadas</h2>
          <p className="text-xs text-gray-500 mb-2">A inversión</p>
          <div className="space-y-3">
            {[ 
              { label: 'Inversión en INTC', date: '9 may', amount: '-10.00€' },
              { label: 'Inversión en EIMI.MI', date: '10 may', amount: '-5.00€' }
            ].map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#2d2d2d]">
                <div>
                  <p className="text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.date}</p>
                </div>
                <p className="text-red-500 font-bold">{t.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
