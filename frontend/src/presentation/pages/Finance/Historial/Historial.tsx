import { useState, useEffect } from 'react';
import { History, ArrowLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Historial = () => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState<any[]>([]);

  useEffect(() => {
    // Aquí leemos TODOS los historiales de las diferentes secciones y los unificamos
    const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]').map((m: any) => ({ ...m, categoria: 'Inversión' }));
    const movDiaADia = JSON.parse(localStorage.getItem('aio_diadia_movimientos') || '[]').map((m: any) => ({ ...m, categoria: 'Día a Día' }));
    const movAhorro = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]').map((m: any) => ({ ...m, categoria: 'Ahorro' }));

    // Unimos, ordenamos por fecha (más reciente primero)
    const todosLosMovimientos = [...movInversion, ...movDiaADia, ...movAhorro].sort((a, b) => {
      return new Date(b.dateString).getTime() - new Date(a.dateString).getTime();
    });

    setMovimientos(todosLosMovimientos);
  }, []);

  return (
    <div className="w-full text-white space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#2d2d2d] rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <History className="text-gray-400" />
          Historial Global
        </h1>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        {movimientos.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            No hay movimientos registrados en ninguna cuenta.
          </div>
        ) : (
          <div className="space-y-4">
            {movimientos.map((mov, idx) => (
              <div key={mov.id || idx} className="flex items-center justify-between p-4 bg-[#1a1a1c] border border-[#2d2d2d]/50 rounded-xl hover:bg-[#202022] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.amount < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {mov.amount < 0 ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{mov.label}</p>
                    <p className="text-xs text-gray-500 font-medium">{mov.categoria} • {new Date(mov.dateString).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className={`font-black text-lg ${mov.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {mov.amount > 0 ? '+' : ''}{mov.amount.toLocaleString('es-ES')} €
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
