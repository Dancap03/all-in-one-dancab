import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Folder, FolderOpen, ShoppingCart, Landmark, Wallet, TrendingUp, CircleDollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../infrastructure/firebase/config';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type FilterType = 'Todos' | 'Gastos' | 'Ingresos' | 'Ahorro' | 'Inversión';

export const Historial = () => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({ [new Date().getFullYear().toString()]: true });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      let todos: any[] = [];

      try {
        // 1. Inversión
        const movInversion = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
        movInversion.forEach((m: any) => {
          todos.push({
            id: m.id,
            amount: m.amount,
            title: m.label,
            subtitle: 'Bolsa / Proyectos',
            type: 'inversión',
            dateString: m.dateString
          });
        });

        // 2. Día a Día
        const monthsRef = collection(db, `users/${user.uid}/finance_months`);
        const monthsSnap = await getDocs(monthsRef);
        for (const monthDoc of monthsSnap.docs) {
          const transRef = collection(db, `users/${user.uid}/finance_months/${monthDoc.id}/transactions`);
          const transSnap = await getDocs(transRef);
          transSnap.docs.forEach(d => {
            const t = d.data();
            const amt = Number(t.amount);
            const isIncome = t.type === 'income' || t.type === 'savings_return';
            todos.push({
              id: d.id,
              amount: isIncome ? amt : -amt,
              title: t.label || t.category,
              subtitle: t.category || 'Categoría general',
              type: isIncome ? 'ingreso' : 'gasto',
              dateString: t.dateString
            });
          });
        }

        // 3. Ahorro
        const savTransRef = collection(db, `users/${user.uid}/savings_transactions`);
        const savTransSnap = await getDocs(savTransRef);
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          const amt = Number(t.amount);
          const isDeposit = t.type === 'deposit' || t.type === 'from_vault';
          todos.push({
            id: d.id,
            amount: isDeposit ? amt : -amt,
            title: t.label || t.type,
            subtitle: 'Transferencia',
            type: 'ahorro',
            dateString: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
        });

        todos.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
        setMovimientos(todos);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // FILTRADO DINÁMICO
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(mov => {
      const matchSearch = (mov.title + ' ' + mov.subtitle).toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      if (activeFilter === 'Todos') return true;
      if (activeFilter === 'Gastos') return mov.type === 'gasto';
      if (activeFilter === 'Ingresos') return mov.type === 'ingreso';
      if (activeFilter === 'Ahorro') return mov.type === 'ahorro';
      if (activeFilter === 'Inversión') return mov.type === 'inversión';
      return true;
    });
  }, [movimientos, searchTerm, activeFilter]);

  // AGRUPACIÓN JERÁRQUICA
  const groupedData: Record<string, Record<string, any[]>> = {};
  filteredMovimientos.forEach(mov => {
    if (!mov.dateString) return;
    const [y, m, d] = mov.dateString.split('-');
    const year = y;
    const monthName = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${year}`;

    if (!groupedData[year]) groupedData[year] = {};
    if (!groupedData[year][monthName]) groupedData[year][monthName] = [];
    groupedData[year][monthName].push(mov);
  });

  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  const toggleYear = (y: string) => setExpandedYears(p => ({ ...p, [y]: !p[y] }));
  const toggleMonth = (m: string) => setExpandedMonths(p => ({ ...p, [m]: !p[m] }));

  // ASIGNADOR DE ESTILOS VISUALES
  const getStyles = (type: string) => {
    if (type === 'gasto') return { badge: 'bg-red-500/20 text-red-500', amount: 'text-red-400', icon: <ShoppingCart size={16}/> };
    if (type === 'ingreso') return { badge: 'bg-emerald-500/20 text-emerald-500', amount: 'text-emerald-400', icon: <Landmark size={16}/> };
    if (type === 'ahorro') return { badge: 'bg-indigo-500/20 text-indigo-400', amount: 'text-indigo-400', icon: <Wallet size={16}/> };
    if (type === 'inversión') return { badge: 'bg-orange-500/20 text-orange-400', amount: 'text-orange-400', icon: <TrendingUp size={16}/> };
    return { badge: 'bg-gray-500/20 text-gray-400', amount: 'text-gray-400', icon: <CircleDollarSign size={16}/> };
  };

  if (loading) return <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="w-full text-white min-h-screen bg-[#0c0c0c] pb-12 font-sans animate-in fade-in duration-300">
      
      {/* CABECERA (Idéntica a la imagen) */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold tracking-tight">Historial de movimientos</h1>
      </div>

      {/* BUSCADOR */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar movimiento..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1c1c1e] text-white border border-[#2d2d2d] rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-500"
        />
      </div>

      {/* FILTROS (Pills) */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {['Todos', 'Gastos', 'Ingresos', 'Ahorro', 'Inversión'].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter as FilterType)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === filter 
                ? 'bg-[#f59e0b] text-black' 
                : 'bg-transparent border border-[#3d3d3d] text-gray-400 hover:text-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ESTRUCTURA DE CARPETAS */}
      <div className="space-y-4">
        {sortedYears.map(year => {
          const isYearOpen = !!expandedYears[year];
          const monthsInYear = groupedData[year];
          const totalMovs = Object.values(monthsInYear).flat().length;

          // Cálculo aproximado de suma para la carpeta del año (Ignorando transferencias internas para no ensuciar)
          const sumYear = Object.values(monthsInYear).flat().reduce((acc, mov) => acc + (mov.type === 'ingreso' || mov.type === 'gasto' ? mov.amount : 0), 0);

          return (
            <div key={year} className="space-y-1">
              {/* CARPETA DE AÑO */}
              <button onClick={() => toggleYear(year)} className="w-full flex justify-between items-center py-2 text-left cursor-pointer outline-none">
                <div className="flex items-center gap-3">
                  {isYearOpen ? <FolderOpen size={20} className="text-[#f59e0b]" /> : <Folder size={20} className="text-[#f59e0b]" />}
                  <span className="text-lg font-bold text-white">{year}</span>
                </div>
                <span className="text-sm font-medium text-gray-400">
                  {sumYear.toLocaleString('es-ES')} € · {totalMovs} mov.
                </span>
              </button>

              {/* MESES DEL AÑO */}
              {isYearOpen && (
                <div className="pl-2 pt-2 space-y-4">
                  {Object.keys(monthsInYear).map(monthName => {
                    const isMonthOpen = !!expandedMonths[monthName];
                    const movs = monthsInYear[monthName];

                    return (
                      <div key={monthName} className="space-y-1">
                        {/* CARPETA DE MES */}
                        <button onClick={() => toggleMonth(monthName)} className="w-full flex justify-between items-center py-2 text-left cursor-pointer outline-none">
                          <div className="flex items-center gap-3">
                            {isMonthOpen ? <FolderOpen size={18} className="text-[#f59e0b]" strokeWidth={1.5} /> : <Folder size={18} className="text-[#f59e0b]" strokeWidth={1.5} />}
                            <span className="text-base text-gray-200">{monthName}</span>
                          </div>
                          <span className="text-xs text-gray-500">{movs.length} movimientos</span>
                        </button>

                        {/* LISTA DE TRANSACCIONES DEL MES */}
                        {isMonthOpen && (
                          <div className="pl-6 pt-1 space-y-4 pb-3">
                            {movs.map((mov, idx) => {
                              const style = getStyles(mov.type);
                              const day = mov.dateString.split('-')[2];
                              const shortMonth = monthName.split(' ')[0].substring(0, 3).toLowerCase();
                              const prefix = mov.amount > 0 ? '+' : '';

                              return (
                                <div key={mov.id || idx} className="flex items-center justify-between group">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-[#1c1c1e] border border-[#2d2d2d] flex items-center justify-center text-gray-400`}>
                                      {style.icon}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white leading-none capitalize">{mov.title}</h3>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider leading-none ${style.badge}`}>
                                          {mov.type}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {day} {shortMonth} · <span className="capitalize">{mov.subtitle}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-base font-black ${style.amount}`}>
                                    {prefix}{mov.amount.toLocaleString('es-ES')} €
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {sortedYears.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">No se encontraron movimientos.</div>
        )}
      </div>
    </div>
  );
};
