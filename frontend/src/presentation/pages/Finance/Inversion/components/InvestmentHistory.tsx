import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, ArrowUpRight } from 'lucide-react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../../../../infrastructure/firebase/config';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const InvestmentHistory = () => {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    [new Date().getFullYear().toString()]: true 
  });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const todosLosMovs: any[] = [];
        
        // 1. Cargar desde Firebase
        const transSnap = await getDocs(collection(db, `users/${user.uid}/investment_transactions`));
        transSnap.docs.forEach(d => {
          todosLosMovs.push({ id: d.id, ...d.data() });
        });

        // 2. MIGRACIÓN: Rescatar del PC y subir lo que falte a la nube
        const savedMovements = JSON.parse(localStorage.getItem('aio_inversion_movimientos_v2') || '[]');
        
        for (const m of savedMovements) {
          // Comprueba si ese movimiento ya se subió a Firebase para no duplicarlo
          const exists = todosLosMovs.some(tx => tx.label === m.label && tx.amount === m.amount && tx.dateString.split('T')[0] === m.dateString.split('T')[0]);
          if (!exists) {
            const newMov = {
              amount: m.amount,
              label: m.label,
              dateString: m.dateString || new Date().toISOString(),
              createdAt: new Date()
            };
            todosLosMovs.push({ id: m.id || Math.random().toString(), ...newMov });
            // Se envía a Firebase en segundo plano silenciosamente
            setDoc(doc(collection(db, `users/${user.uid}/investment_transactions`)), newMov);
          }
        }

        // Ordenar del más reciente al más antiguo
        todosLosMovs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
        setMovimientos(todosLosMovs);

      } catch (error) {
        console.error("Error cargando historial de inversión:", error);
      }
    };

    fetchHistory();
  }, []);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (yearMonthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [yearMonthKey]: !prev[yearMonthKey] }));
  };

  // =======================================================================
  // 📊 AGRUPACIÓN JERÁRQUICA
  // =======================================================================
  const groupedData: Record<string, Record<string, any[]>> = {};

  movimientos.forEach(mov => {
    if (!mov.dateString) return;
    const dateParts = mov.dateString.split('-'); 
    const year = dateParts[0];
    const monthIdx = parseInt(dateParts[1], 10) - 1; 
    const monthName = MONTH_NAMES[monthIdx] || 'Otros';

    if (!groupedData[year]) groupedData[year] = {};
    if (!groupedData[year][monthName]) groupedData[year][monthName] = [];
    groupedData[year][monthName].push(mov);
  });

  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  if (sortedYears.length === 0) {
    return (
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-12 flex flex-col items-center justify-center text-center opacity-40 italic space-y-2 shadow-sm">
        <span className="text-2xl">⏳</span>
        <p className="text-sm text-gray-400">No se registran aportaciones de inversión en el Día a Día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedYears.map(year => {
        const isYearOpen = !!expandedYears[year];
        const monthsInYear = groupedData[year];
        
        const sortedMonths = Object.keys(monthsInYear).sort(
          (a, b) => MONTH_NAMES.indexOf(b) - MONTH_NAMES.indexOf(a)
        );

        return (
          <div key={year} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => toggleYear(year)}
              className="w-full flex items-center justify-between p-4 bg-[#141416] hover:bg-[#1c1c1e] transition-colors text-left font-black text-sm tracking-wider text-gray-300 cursor-pointer outline-none"
            >
              <div className="flex items-center gap-2.5">
                {isYearOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                {isYearOpen ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-500/70" />}
                <span>AÑO {year}</span>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-[#222] px-2.5 py-0.5 rounded-full">
                {Object.values(monthsInYear).reduce((sum, current) => sum + current.length, 0)} aportaciones
              </span>
            </button>

            {isYearOpen && (
              <div className="p-4 space-y-3 bg-black/10 border-t border-[#2d2d2d]/40">
                {sortedMonths.map(month => {
                  const yearMonthKey = `${year}-${month}`;
                  const isMonthOpen = !!expandedMonths[yearMonthKey];
                  const movements = monthsInYear[month];

                  return (
                    <div key={month} className="rounded-xl overflow-hidden border border-[#2d2d2d]/40 bg-[#161618]/60">
                      <button
                        onClick={() => toggleMonth(yearMonthKey)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#1c1c1e] hover:bg-[#222224] transition-colors text-left text-xs font-bold text-gray-400 cursor-pointer outline-none"
                      >
                        <div className="flex items-center gap-2 pl-1">
                          {isMonthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className="capitalize text-gray-200 font-bold">{month}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {movements.length} movimientos
                        </span>
                      </button>

                      {isMonthOpen && (
                        <div className="divide-y divide-[#2d2d2d]/30 bg-[#111112]">
                          {movements.map((mov: any, idx: number) => {
                            const formattedDate = mov.dateString 
                              ? new Date(mov.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
                              : 'Reciente';

                            return (
                              <div key={mov.id || idx} className="flex justify-between items-center p-4 hover:bg-[#1a1a1c]/40 transition-colors pl-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <ArrowUpRight size={16} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{mov.label}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{formattedDate}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-blue-400">+{mov.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Aportación</p>
                                </div>
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
    </div>
  );
};
