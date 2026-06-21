import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../infrastructure/firebase/config';
import { 
  ArrowLeft, ArrowDown, ArrowUp, ArrowRightLeft, Plus, 
  Plane, Car, ShieldCheck, ShoppingBag, GraduationCap, 
  MoreVertical, Calendar, Folder, FolderOpen, Pencil, Trash2 
} from 'lucide-react';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const Ahorro = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [disponible, setDisponible] = useState(0);
  const [huchas, setHuchas] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qué menú de 3 puntitos está abierto
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados para el historial
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({ [new Date().getFullYear().toString()]: true });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Cierra el menú de 3 puntitos si haces clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Cargar saldo disponible (de tu variable real)
        const saldoDisp = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
        setDisponible(saldoDisp);

        // 2. Cargar Huchas (Mockeado para el diseño, aquí conectarías tu DB real de huchas)
        setHuchas([
          { id: '1', title: 'Ahorro emergencia', subtitle: 'Reserva para imprevistos', current: 1800.00, target: 6000, color: 'rose', icon: <ShieldCheck size={20} /> },
          { id: '2', title: 'Leroy Merlin Acciones', subtitle: 'Inversión empresa', current: 1817.96, target: 3000, color: 'emerald', icon: <ShoppingBag size={20} /> },
          { id: '3', title: 'Uni', subtitle: 'Gastos universitarios', current: 1000.00, target: 2000, color: 'blue', icon: <GraduationCap size={20} /> },
          { id: '4', title: 'Viajes', subtitle: 'Fondo para vacaciones', current: 300.00, target: 1500, color: 'blue', icon: <Plane size={20} /> },
          { id: '5', title: 'Coche', subtitle: 'Entrada vehículo nuevo', current: 0.00, target: 5000, color: 'amber', icon: <Car size={20} /> }
        ]);

        // 3. Cargar Historial Real
        const todosLosMovs: any[] = [];
        
        // De Firebase
        const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
        savTransSnap.docs.forEach(d => {
          const t = d.data();
          todosLosMovs.push({
            id: d.id,
            amount: Number(t.amount) || 0,
            title: t.label || (t.type === 'deposit' ? 'Ingreso a hucha' : 'Retiro de hucha'),
            type: t.type === 'deposit' ? 'ingreso' : 'gasto',
            dateString: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString()
          });
        });

        // Del LocalStorage
        const movAhLocal = JSON.parse(localStorage.getItem('aio_ahorro_movimientos') || '[]');
        movAhLocal.forEach((m: any) => {
          todosLosMovs.push({
            id: m.id || Math.random().toString(),
            amount: Math.abs(Number(m.amount)),
            title: m.label || 'Movimiento de ahorro',
            type: Number(m.amount) > 0 ? 'ingreso' : 'gasto',
            dateString: m.dateString || m.date || new Date().toISOString()
          });
        });

        todosLosMovs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
        setMovimientos(todosLosMovs);

      } catch (error) {
        console.error("Error cargando ahorro:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enHuchas = huchas.reduce((acc, h) => acc + h.current, 0);

  // --- AGRUPAR HISTORIAL ---
  const groupedData: Record<string, Record<string, any[]>> = {};
  movimientos.forEach(mov => {
    if (!mov.dateString) return;
    const f = new Date(mov.dateString);
    if (isNaN(f.getTime())) return;
    
    const year = f.getFullYear().toString();
    const monthName = `${MONTH_NAMES[f.getMonth()]}`;

    if (!groupedData[year]) groupedData[year] = {};
    if (!groupedData[year][monthName]) groupedData[year][monthName] = [];
    groupedData[year][monthName].push(mov);
  });
  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  const toggleYear = (y: string) => setExpandedYears(p => ({ ...p, [y]: !p[y] }));
  const toggleMonth = (m: string) => setExpandedMonths(p => ({ ...p, [m]: !p[m] }));

  // --- DICCIONARIO DE COLORES ---
  const colorStyles: Record<string, { bg: string, text: string, bar: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  };

  if (loading) return <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="w-full text-white min-h-screen pb-12 animate-in fade-in duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">Ahorro</h1>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">Disponible</p>
          <p className="text-emerald-400 text-3xl font-black">{disponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">En huchas</p>
          <p className="text-white text-3xl font-black">{enHuchas.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
      </div>

      {/* BOTONERA (Listos para tus funciones modales) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => alert("Abre tu modal de Mover a Hucha")} className="flex items-center gap-2 px-4 py-2 border border-emerald-500 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-colors cursor-pointer">
            <ArrowDown size={16} /> Mover a hucha
          </button>
          <button onClick={() => alert("Abre tu modal de Retirar de Hucha")} className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer">
            <ArrowUp size={16} /> Mover de hucha
          </button>
          <button onClick={() => alert("Abre tu modal de Pasar a Día a Día")} className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer">
            <ArrowRightLeft size={16} /> Pasar a día a día
          </button>
        </div>
        <button onClick={() => alert("Abre tu modal de Crear Hucha")} className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer">
          <Plus size={16} /> Nueva hucha
        </button>
      </div>

      {/* HUCHAS (NUEVO DISEÑO CON DROPDOWN 100% FUNCIONAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12" ref={dropdownRef}>
        {huchas.map((hucha) => {
          const style = colorStyles[hucha.color] || colorStyles.emerald;
          const percentage = hucha.target > 0 ? Math.min(Math.round((hucha.current / hucha.target) * 100), 100) : 0;
          const remaining = hucha.target - hucha.current;
          const isDropdownOpen = dropdownOpen === hucha.id;

          return (
            <div key={hucha.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 relative group">
              
              {/* Botón 3 puntitos */}
              <button 
                onClick={() => setDropdownOpen(isDropdownOpen ? null : hucha.id)}
                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-[#2d2d2d]"
              >
                <MoreVertical size={18} />
              </button>

              {/* Menú Desplegable (Dropdown) */}
              {isDropdownOpen && (
                <div className="absolute top-12 right-4 w-40 bg-[#1c1c1e] border border-[#3d3d3d] rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { alert(`Editar hucha: ${hucha.title}`); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2d2d2d] transition-colors text-left cursor-pointer">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => { alert(`Eliminar hucha: ${hucha.title}`); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer border-t border-[#3d3d3d]">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                  {hucha.icon}
                </div>
                <div className="pr-6">
                  <h3 className="text-lg font-bold text-white leading-tight">{hucha.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{hucha.subtitle}</p>
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-2xl font-black text-white">{hucha.current.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  <p className="text-xs text-gray-500 font-medium bg-[#1c1c1e] px-2 py-0.5 rounded mt-1 inline-block">
                    de {hucha.target.toLocaleString('es-ES')} € · quedan {remaining > 0 ? remaining.toLocaleString('es-ES') : 0} €
                  </p>
                </div>
                <span className={`text-sm font-bold ${style.text}`}>{percentage}%</span>
              </div>

              <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden mt-3">
                <div className={`h-full rounded-full ${style.bar} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HISTORIAL REAL Y FUNCIONAL */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6 border-b border-[#2d2d2d] pb-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold text-white">Historial de movimientos</h2>
          </div>
        </div>

        <div className="space-y-4">
          {sortedYears.map(year => {
            const isYearOpen = !!expandedYears[year];
            const monthsInYear = groupedData[year];
            const totalMovs = Object.values(monthsInYear).flat().length;

            return (
              <div key={year} className="space-y-2">
                <button onClick={() => toggleYear(year)} className="w-full flex items-center justify-between p-2 hover:bg-[#1a1a1c] rounded-lg transition-colors cursor-pointer outline-none">
                  <div className="flex items-center gap-3">
                    {isYearOpen ? <FolderOpen size={18} className="text-emerald-500" /> : <Folder size={18} className="text-emerald-500" />}
                    <span className="font-bold text-white text-lg">{year}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-[#1c1c1e] border border-[#2d2d2d] px-2 py-1 rounded">{totalMovs} movs</span>
                </button>

                {isYearOpen && (
                  <div className="pl-6 pt-2 space-y-3 border-l border-[#2d2d2d] ml-3">
                    {Object.keys(monthsInYear).map(monthName => {
                      const isMonthOpen = !!expandedMonths[`${year}-${monthName}`];
                      const movs = monthsInYear[monthName];

                      return (
                        <div key={monthName} className="space-y-2">
                          <button onClick={() => toggleMonth(`${year}-${monthName}`)} className="w-full flex items-center justify-between p-2 hover:bg-[#1a1a1c] rounded-lg transition-colors cursor-pointer outline-none">
                            <div className="flex items-center gap-3">
                              {isMonthOpen ? <ArrowDown size={14} className="text-gray-500" /> : <ArrowRightLeft size={14} className="text-gray-500" />}
                              <span className="text-sm font-bold text-gray-300">{monthName}</span>
                            </div>
                            <span className="text-xs text-gray-500">{movs.length} transacciones</span>
                          </button>

                          {isMonthOpen && (
                            <div className="pl-6 pt-1 space-y-3 pb-3">
                              {movs.map((mov, idx) => (
                                <div key={mov.id || idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mov.type === 'gasto' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                      <ArrowRightLeft size={14} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">{mov.title}</p>
                                      <p className="text-xs text-gray-500">{new Date(mov.dateString).toLocaleDateString('es-ES')}</p>
                                    </div>
                                  </div>
                                  <span className={`text-sm font-black ${mov.type === 'gasto' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {mov.type === 'ingreso' ? '+' : '-'}{Math.abs(mov.amount).toLocaleString('es-ES')} €
                                  </span>
                                </div>
                              ))}
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
            <div className="text-center py-6 text-gray-500 text-sm">No hay movimientos registrados.</div>
          )}
        </div>
      </div>

    </div>
  );
};
