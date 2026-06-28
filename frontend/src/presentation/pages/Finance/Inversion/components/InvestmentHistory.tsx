import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, ArrowUpRight, ArrowDownRight, TrendingUp, Briefcase, Trash2 } from 'lucide-react';

// 🚀 AQUÍ LE DECIMOS A TYPESCRIPT QUE ESTE COMPONENTE ACEPTA LOS MOVIMIENTOS Y LA PAPELERA
interface InvestmentHistoryProps {
  movimientos: any[];
  onDelete: (id: string, amount: number, label: string) => void | Promise<void>;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const InvestmentHistory = ({ movimientos, onDelete }: InvestmentHistoryProps) => {
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    [new Date().getFullYear().toString()]: true 
  });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  
  // Modal de Borrado Seguro
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<any>(null);

  const toggleYear = (year: string) => setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  const toggleMonth = (key: string) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));

  // 🎨 LÓGICA DE COLORES E ICONOS DINÁMICOS
  const getStyle = (label: string = '', amount: number) => {
    const lower = label.toLowerCase();
    
    if (lower.includes('bolsa')) {
      return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <TrendingUp size={16} />, tag: 'Bolsa' };
    }
    if (lower.includes('proyecto')) {
      return { color: 'text-teal-400', bg: 'bg-teal-400/10', icon: <Briefcase size={16} />, tag: 'Proyecto' };
    }
    if (lower.includes('retirada') || lower.includes('retorno') || amount < 0) {
      return { color: 'text-red-400', bg: 'bg-red-500/10', icon: <ArrowDownRight size={16} />, tag: 'Salida / Retirada' };
    }
    
    // Por defecto (Aportaciones desde Día a Día)
    return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <ArrowUpRight size={16} />, tag: 'Aportación Entrada' };
  };

  const handleDeleteRequest = (tx: any) => {
    setDeletingTx(tx);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deletingTx) {
      onDelete(deletingTx.id, deletingTx.amount, deletingTx.label);
    }
    setIsDeleteOpen(false);
    setDeletingTx(null);
  };

  const groupedData: Record<string, Record<string, any[]>> = {};

  // Protegemos el mapeo por si movimientos es undefined al principio
  (movimientos || []).forEach(mov => {
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
        <p className="text-sm text-gray-400">Aún no hay movimientos en tu historial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedYears.map(year => {
        const isYearOpen = !!expandedYears[year];
        const monthsInYear = groupedData[year];
        const sortedMonths = Object.keys(monthsInYear).sort((a, b) => MONTH_NAMES.indexOf(b) - MONTH_NAMES.indexOf(a));

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
                {Object.values(monthsInYear).reduce((sum, current) => sum + current.length, 0)} ops.
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
                        <span className="text-[10px] text-gray-500 font-medium">{movements.length} movimientos</span>
                      </button>

                      {isMonthOpen && (
                        <div className="divide-y divide-[#2d2d2d]/30 bg-[#111112]">
                          {movements.map((mov: any, idx: number) => {
                            const formattedDate = mov.dateString ? new Date(mov.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente';
                            
                            // Obtenemos los estilos dinámicos
                            const style = getStyle(mov.label, mov.amount);
                            const prefix = mov.amount > 0 ? '+' : '';

                            return (
                              <div key={mov.id || idx} className="flex justify-between items-center p-4 hover:bg-[#1a1a1c]/40 transition-colors pl-10 group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.color}`}>
                                    {style.icon}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{mov.label}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{formattedDate}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className={`text-sm font-black ${style.color}`}>
                                      {prefix}{mov.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                    </p>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{style.tag}</p>
                                  </div>
                                  
                                  {/* 🚀 BOTÓN DESHACER (PAPELERA) */}
                                  <button 
                                    onClick={() => handleDeleteRequest(mov)}
                                    className="p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Deshacer movimiento"
                                  >
                                    <Trash2 size={16} />
                                  </button>
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

      {/* 🛑 MODAL DE CONFIRMACIÓN DE BORRADO */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Trash2 className="text-red-500" /> Deshacer operación
              </h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Vas a eliminar <strong className="text-white">"{deletingTx?.label}"</strong>. 
                El sistema recalculará el saldo automáticamente. ¿Continuar?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-gray-300 font-bold rounded-xl border border-[#2d2d2d] hover:bg-[#252525] transition-colors cursor-pointer">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors cursor-pointer">Deshacer</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
