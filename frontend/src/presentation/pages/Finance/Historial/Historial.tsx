import { useState, useEffect } from 'react';
import { History, ArrowLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';

export const Historial = () => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      let todos: any[] = [];

      try {
        // 1. Inversión (LocalStorage)
        const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]').map((m: any) => ({ ...m, categoria: 'Inversión' }));
        todos = [...todos, ...movInversion];

        // 2. Día a Día (Firebase)
        const monthsRef = collection(db, `users/${user.uid}/finance_months`);
        const monthsSnap = await getDocs(monthsRef);
        for (const monthDoc of monthsSnap.docs) {
          const transRef = collection(db, `users/${user.uid}/finance_months/${monthDoc.id}/transactions`);
          const transSnap = await getDocs(transRef);
          transSnap.docs.forEach(d => {
            const t = d.data();
            todos.push({
              id: d.id,
              amount: t.type === 'expense' || t.type === 'other_expense' || t.type === 'transfer' ? -Number(t.amount) : Number(t.amount),
              label: t.label || t.category,
              categoria: 'Día a Día',
              dateString: t.dateString
            });
          });
        }

        // 3. Ahorro (Firebase)
        const savTransRef = collection(db, `users/${user.uid}/savings_transactions`);
        const savTransSnap = await getDocs(savTransRef);
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          todos.push({
            id: d.id,
            amount: t.type === 'withdrawal' || t.type === 'to_vault' ? -Number(t.amount) : Number(t.amount),
            label: t.label || t.type,
            categoria: 'Ahorro',
            dateString: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
        });

        // Ordenar por fecha (Más recientes primero)
        todos.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
        setMovimientos(todos);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full text-white space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#2d2d2d] rounded-lg transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <History className="text-gray-400" />
          Historial Global
        </h1>
      </div>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm italic">
            No hay movimientos registrados en tu cuenta.
          </div>
        ) : (
          <div className="space-y-3">
            {movimientos.map((mov, idx) => (
              <div key={mov.id || idx} className="flex items-center justify-between p-4 bg-[#1a1a1c] border border-[#2d2d2d]/50 rounded-xl hover:bg-[#202022] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.amount < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {mov.amount < 0 ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm capitalize">{mov.label}</p>
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
