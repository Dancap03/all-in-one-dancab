import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Folder, FolderOpen, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface SavingsHistoryProps {
  transactions?: any[]; // Recibe la lista completa de movimientos de ahorro
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SavingsHistory = ({ transactions = [] }: SavingsHistoryProps) => {
  // Estados para controlar qué años y qué meses específicos están expandidos
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    [new Date().getFullYear().toString()]: true // El año actual viene expandido por defecto
  });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Alternar apertura de Año
  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // Alternar apertura de Mes (usamos llave compuesta "Año-Mes" para evitar colisiones)
  const toggleMonth = (yearMonthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [yearMonthKey]: !prev[yearMonthKey] }));
  };

  // =======================================================================
  // 📊 LÓGICA DE AGRUPACIÓN ALGORÍTMICA (De lista plana a Árbol de fechas)
  // =======================================================================
  const groupedData: Record<string, Record<string, any[]>> = {};

  transactions.forEach(tx => {
    // Extraemos año y mes de forma segura del dateString (ej: "2026-06-15")
    if (!tx.dateString) return;
    const dateParts = tx.dateString.split('-');
    const year = dateParts[0];
    const monthIdx = parseInt(dateParts[1], 10) - 1; // 0-based
    const monthName = MONTH_NAMES[monthIdx] || 'Otros';

    if (!groupedData[year]) {
      groupedData[year] = {};
    }
    if (!groupedData[year][monthName]) {
      groupedData[year][monthName] = [];
    }
    groupedData[year][monthName].push(tx);
  });

  // Ordenar años de más nuevo a más antiguo
  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 shadow-xl space-y-4">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#2d2d2d]">
        <Calendar size={18} className="text-emerald-500" />
        <h2 className="text-base font-black tracking-wide text-gray-200">Historial de movimientos</h2>
      </div>

      {/* ÁRBOL DE MOVIMIENTOS DESPLEGABLE */}
      <div className="space-y-3 custom-scrollbar max-h-[600px] overflow-y-auto pr-1">
        {sortedYears.length > 0 ? (
          sortedYears.map(year => {
            const isYearOpen = !!expandedYears[year];
            const monthsInYear = groupedData[year];
            
            // Ordenar los meses de este año de forma cronológica inversa (de Diciembre a Enero)
            const sortedMonths = Object.keys(monthsInYear).sort(
              (a, b) => MONTH_NAMES.indexOf(b) - MONTH_NAMES.indexOf(a)
            );

            return (
              <div key={year} className="border border-[#2d2d2d]/60 rounded-xl overflow-hidden bg-[#141416]/40">
                
                {/* FILA DEL AÑO (NIVEL 1) */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-4 bg-[#141416] hover:bg-[#1c1c1e] transition-colors text-left font-black text-sm tracking-wider text-gray-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isYearOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    {isYearOpen ? <FolderOpen size={16} className="text-emerald-500" /> : <Folder size={16} className="text-emerald-600" />}
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
                            className="w-full flex items-center justify-between px-4 py-3 bg-[#1b1b1d] hover:bg-[#222224] transition-colors text-left text-xs font-bold text-gray-400 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 pl-2">
                              {isMonthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span className="capitalize text-gray-300 font-bold">{month}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {movements.length} transacciones
                            </span>
                          </button>

                          {/* LISTA DE MOVIMIENTOS REALES (NIVEL 3 - IGUAL A TU CAPTURA ORIGINAL) */}
                          {isMonthOpen && (
                            <div className="divide-y divide-[#2d2d2d]/40 bg-[#121212]/50">
                              {movements.map((mov: any, idx: number) => {
                                const isNegative = mov.amount < 0;
                                const formattedDate = mov.dateString 
                                  ? new Date(mov.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
                                  : 'Reciente';

                                return (
                                  <div key={mov.id || idx} className="flex justify-between items-center p-4 hover:bg-[#1a1a1c]/40 transition-colors pl-10">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                        isNegative ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                                      }`}>
                                        {isNegative ? <ArrowDownLeft size={14} /> : '💰'}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-white">{mov.label || mov.category}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{formattedDate}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`font-mono text-sm font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {isNegative ? '' : '+'}{mov.amount.toFixed(2)}€
                                      </p>
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
          })
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center opacity-40 italic space-y-2">
            <span className="text-2xl">📁</span>
            <p className="text-sm text-gray-400">No se registran movimientos en el historial de ahorro.</p>
          </div>
        )}
      </div>

    </div>
  );
};
