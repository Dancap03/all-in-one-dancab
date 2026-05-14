import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Plus, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { FinanceService } from '../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../infrastructure/firebase/config';

export const DiaADia = () => {
  // Estados para datos y UI
  const [data, setData] = useState({ budget: 0, transactions: [] as any[] });
  const [loading, setLoading] = useState(true);
  const currentMonth = "2026-05"; // Esto podría ser dinámico con un selector

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Suscripción en tiempo real a Firestore
    const unsubscribe = FinanceService.subscribeToMonthData(
      user.uid, 
      currentMonth, 
      (newData) => {
        setData(newData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentMonth]);

  // --- LÓGICA DE CÁLCULO ---
  const incomes = data.transactions.filter(t => t.type === 'income');
  const expenses = data.transactions.filter(t => t.type === 'expense');

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Balance = Ingresos - Gastos
  const balance = totalIncomes - totalExpenses;
  
  // Presupuesto
  const presupuestoRestante = data.budget - totalExpenses;
  const porcentajeGasto = data.budget > 0 ? (totalExpenses / data.budget) * 100 : 0;

  // Datos para gráficas
  const hasIncomesOrExpenses = data.transactions.length > 0;
  
  const dataDonut = [
    { name: 'Ingresos', value: totalIncomes },
    { name: 'Gastos', value: totalExpenses }
  ];

  if (loading) return <div className="p-10 text-center text-white">Cargando datos...</div>;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6">
      {/* Selector de Mes */}
      <div className="flex items-center gap-4 mb-8">
        <ChevronLeft className="text-gray-500 cursor-pointer hover:text-white" />
        <h1 className="text-xl font-bold">Mayo 2026</h1>
        <ChevronRight className="text-gray-500 cursor-pointer hover:text-white" />
      </div>

      {/* 1. RESUMEN SUPERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm mb-1 font-medium">Balance</p>
          <p className="text-2xl font-bold text-blue-500">{balance.toFixed(2)}€</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm mb-1 font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-green-500">+{totalIncomes.toFixed(2)}€</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm mb-1 font-medium">Gastos</p>
          <p className="text-2xl font-bold text-red-500">-{totalExpenses.toFixed(2)}€</p>
        </div>
      </div>

      {/* 2. FILA DE GRÁFICAS (Solo si hay datos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px] flex flex-col">
          <h2 className="font-bold text-gray-200 mb-4">Distribución de gastos</h2>
          {hasIncomesOrExpenses ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={expenses.length > 0 ? expenses : [{name: 'Sin gastos', amount: 1}]} 
                  innerRadius={0} 
                  outerRadius={80} 
                  fill="#f59e0b" 
                  dataKey="amount"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
              No hay gastos registrados
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 min-h-[350px] flex flex-col">
          <h2 className="font-bold text-gray-200 mb-4">Ingresos vs Gastos</h2>
          {hasIncomesOrExpenses ? (
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataDonut} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>
                  {balance >= 0 ? `+${balance.toFixed(0)}€` : `${balance.toFixed(0)}€`}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">balance</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 italic text-sm">
              Esperando transacciones...
            </div>
          )}
        </div>
      </div>

      {/* 3. PRESUPUESTO Y TRANSACCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Presupuesto Mensual */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-200">Presupuesto mensual</h2>
            <button className="text-gray-400 hover:text-white bg-[#2d2d2d] p-1.5 rounded-md transition-colors">
              <Edit2 size={14} />
            </button>
          </div>
          
          <div className="flex justify-between text-sm mb-3">
            <p className="text-gray-400">Presupuesto: <span className="text-white font-bold">{data.budget}€</span></p>
            <p className={`${presupuestoRestante >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
              Restante: {presupuestoRestante.toFixed(2)}€
            </p>
          </div>

          {/* BARRA DE PROGRESO BICOLOR */}
          <div className="relative h-16 w-full bg-[#0c0c0c] rounded-lg overflow-hidden border border-[#2d2d2d]">
            {/* Fondo Verde (Presupuesto) */}
            <div className="absolute inset-0 bg-[#10b981] opacity-30"></div>
            {/* Barra Roja (Gastos Reales) */}
            <div 
              className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
              style={{ width: `${Math.min(porcentajeGasto, 100)}%` }}
            ></div>
          </div>

          <button className="w-full mt-6 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
            <Plus size={16} /> Añadir gasto
          </button>
        </div>

        {/* Ingresos Recientes */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 flex flex-col">
          <h2 className="font-bold text-gray-200 mb-4">Ingresos</h2>
          <div className="flex-1 space-y-4">
            {incomes.length > 0 ? incomes.map((inc, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#262626] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{inc.label || 'Ingreso'}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-tighter">9 may</p>
                </div>
                <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
              </div>
            )) : (
              <p className="text-center text-gray-600 text-sm py-4 italic">No hay ingresos registrados</p>
            )}
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
            <Plus size={16} /> Añadir ingreso
          </button>
        </div>

      </div>
    </div>
  );
};
