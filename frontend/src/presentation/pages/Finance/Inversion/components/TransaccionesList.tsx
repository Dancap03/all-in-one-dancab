import React from 'react';
import { Search, ChevronDown, MoreVertical, ArrowRight } from 'lucide-react';

export interface Transaccion {
  id: string;
  fechaDia: string;
  tipoIcono: 'buy' | 'sell';
  asset: string;
  detalles: string;
  total: number;
  logoInitial: string;
  logoColor?: string;
  portfolioId?: string;
}

interface TransaccionesListProps {
  transacciones: Transaccion[];
  mesLabel: string;
  onAddTransaction: () => void;
}

export const TransaccionesList = ({ transacciones, mesLabel, onAddTransaction }: TransaccionesListProps) => {
  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm mt-6">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white text-lg">Transacciones</h3>
        <button onClick={onAddTransaction} className="bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm px-4 py-2 rounded-lg border border-[#2d2d2d] transition-colors flex items-center gap-2">
          <span>+ Agregar transacción</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Filtro */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search asset type, ISIN, .." 
            className="w-full bg-[#1a1a1a] border border-[#2d2d2d] text-white text-sm rounded-lg focus:border-[#10b981] outline-none block pl-10 p-2.5 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 text-sm text-white px-4 py-2 hover:bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] transition-colors">
          Todos <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Lista de transacciones */}
      <div>
        <p className="text-gray-500 text-xs font-medium mb-4 uppercase">{mesLabel}</p>
        
        <div className="flex flex-col">
          {transacciones.length === 0 ? (
            <div className="py-8 text-center text-gray-500 italic text-sm">
              No hay transacciones registradas en esta cartera.
            </div>
          ) : (
            transacciones.map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-4 border-l-2 border-transparent hover:bg-[#1a1a1a] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
                
                <div className="w-12 flex flex-col items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{t.fechaDia}</span>
                  <ArrowRight size={14} className="text-gray-500 mt-0.5" />
                </div>

                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-[#2d2d2d]"
                  style={t.logoColor ? { backgroundColor: t.logoColor } : {}}
                >
                  {t.logoInitial}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{t.asset}</p>
                  <p className="text-gray-400 text-sm truncate mt-0.5">{t.detalles}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <p className="text-white font-bold text-sm">
                    {t.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </p>
                  <button className="text-gray-500 hover:text-white transition-colors p-1 opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
