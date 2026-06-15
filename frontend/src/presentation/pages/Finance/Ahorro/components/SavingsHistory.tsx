import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Folder, FolderOpen, Pencil, Trash2 } from 'lucide-react';

// Definición estricta de Props para solucionar definitivamente el error de compilación
interface SavingsHistoryProps {
  transactions: any[];
  vaults: any[];
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SavingsHistory = ({ transactions = [], vaults = [], onEdit, onDelete }: SavingsHistoryProps) => {
  // Estado para controlar qué años y qué meses específicos están expandidos
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    [new Date().getFullYear().toString()]: true // El año actual viene expandido por defecto
  });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (yearMonthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [yearMonthKey]: !prev[yearMonthKey] }));
  };

  if (transactions.length === 0) return null;

  // =======================================================================
  // 📊 AGRUPACIÓN DINÁMICA UTILIZANDO TU TIMESTAMP DE FIREBASE (seconds)
  // =======================================================================
  const groupedData: Record<string, Record<string, any[]>> = {};

  transactions.forEach(t => {
    // Verificación de seguridad para evitar que rompa si viene algún registro sin fecha
    if (!t.date || typeof t.date.seconds !== 'number') return;
    
    const jsDate = new Date(t.date.seconds * 1000);
    const year = jsDate.getFullYear().toString();
    const monthIdx = jsDate.getMonth(); // 0 - 11
    const monthName = MONTH_NAMES[monthIdx] || 'Otros';

    if (!groupedData[year]) {
      groupedData[year] = {};
    }
    if (!groupedData[year][monthName]) {
      groupedData[year][monthName] = [];
    }
    groupedData[year][monthName].push(t);
  });

  // Ordenar años de más nuevo a más antiguo
  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm mb-6 space-y-4">
      
      {/* CABECERA */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#2d2d2d]">
        <Calendar size={18} className="text-[#10b981]" />
        <h2 className="font-bold text-white tracking-wide">Historial de movimientos</h2>
      </div>

      {/* ÁRBOL DE FECHAS DESPLEGABLE */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedYears.map(year => {
          const isYearOpen = !!expandedYears[year];
          const monthsInYear = groupedData[year];
          
          // Ordenar los meses de este año de forma cronológica inversa (de Diciembre a Enero)
          const sortedMonths = Object.keys(monthsInYear).sort(
            (a, b) => MONTH_NAMES.indexOf(b) - MONTH_NAMES.indexOf(a)
          );

          return (
            <div key={year} className="border border-[#2d2d2d]/60 rounded-xl overflow-hidden bg-[#1a1a1a]/40">
              
              {/* FILA DEL AÑO (NIVEL 1) */}
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between p-4 bg-[#151515] hover:bg-[#1c1c1e] transition-colors text-left font-black text-sm tracking-wider text-gray-300 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2.5">
                  {isYearOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                  {isYearOpen ? <FolderOpen size={16} className="text-[#10b981]" /> : <Folder size={16} className="text-[#10b981]/70" />}
                  <span>{year}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-[#222] px-2 py-0.5 rounded-full">
                  {Object.values(monthsInYear).reduce((sum, current) => sum + current.length, 0)} movs
                </span>
              </button>

              {/* BLOQUE DE MESES DEL AÑO */}
              {isYearOpen && (
                <div className="p-3 space-y-2 bg-black/10 border-t border-[#2d2d2d]/30">
                  {sortedMonths.map(month => {
                    const yearMonthKey = `${year}-${month}`;
                    const isMonthOpen = !!expandedMonths[yearMonthKey];
                    const movements = monthsInYear[month];

                    return (
                      <div key={month} className="rounded-lg overflow-hidden border border-[#2d2d2d]/30">
                        
                        {/* FILA DEL MES (NIVEL 2) */}
                        <button
                          onClick={() => toggleMonth(yearMonthKey)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#1b1b1d] hover:bg-[#222224] transition-colors text-left text-xs font-bold text-gray-400 cursor-pointer outline-none"
                        >
                          <div className="flex items-center gap-2 pl-2">
                            {isMonthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="capitalize text-gray-300 font-bold">{month}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {movements.length} transacciones
                          </span>
                        </button>

                        {/* LISTA DE MOVIMIENTOS HISTÓRICOS (NIVEL 3) */}
                        {isMonthOpen && (
                          <div className="divide-y divide-[#2d2d2d]/40 bg-[#121212]/50">
                            {movements.map((t: any, idx: number) => {
                              const dateStr = t.date ? new Date(t.date.seconds * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
                              
                              let title = ''; let icon = ''; let amountColor = ''; let prefix = '';

                              // Conservamos tu mapeo exacto de base de datos
                              if (t.type === 'deposit') { title = 'Ingreso'; icon = '💰'; amountColor = 'text-[#10b981]'; prefix = '+'; } 
                              else if (t.type === 'withdrawal') { title = 'A día a día'; icon = '↑'; amountColor = 'text-[#ef4444]'; prefix = '-'; } 
                              else if (t.type === 'to_vault') { const vault = vaults.find(v => v.id === t.vaultId); title = vault ? vault.name : 'Hucha eliminada'; icon = '→'; amountColor = 'text-[#ef4444]'; prefix = '-'; } 
                              else if (t.type === 'from_vault') { const vault = vaults.find(v => v.id === t.vaultId); title = vault ? vault.name : 'Hucha eliminada'; icon = '←'; amountColor = 'text-[#10b981]'; prefix = '+'; }

                              return (
                                <div key={t.id || idx} className="flex justify-between items-center p-4 hover:bg-[#1a1a1c]/40 transition-colors pl-10 group">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                        <span className="text-base">{icon}</span> {title}
                                      </p>
                                      <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <p className={`font-mono text-sm font-bold ${amountColor}`}>
                                      {prefix}{t.amount.toFixed(2)}€
                                    </p>
                                    
                                    {/* Botones de acción vinculados perfectamente con tu Ahorro.tsx */}
                                    {t.type !== 'deposit' && (
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => onEdit(t)} 
                                          className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        <button 
                                          onClick={() => onDelete(t.id)} 
                                          className="text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    )}
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

    </div>
  );
};
