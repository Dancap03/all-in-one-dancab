import { useState } from 'react';
import { ArrowLeft, BarChart3, Plus } from 'lucide-react';

interface BolsaDetailsProps {
  bolsaDisponible: number;
  bolsaInvertido: number;
  bolsaGanancias: number;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => void;
  onBack: () => void;
}

export const BolsaDetails = ({ bolsaDisponible, bolsaInvertido, bolsaGanancias, onEjecutarBolsa, onBack }: BolsaDetailsProps) => {
  const [monto, setMonto] = useState('');
  const [selectType, setSelectType] = useState<'propio' | 'ganancia' | 'diadia'>('propio');

  const handleSave = () => {
    const qty = Number(monto);
    if (!qty || qty <= 0) return alert('Introduce un importe válido.');
    if ((selectType === 'propio' || selectType === 'diadia') && qty > bolsaDisponible) {
      return alert('Saldo disponible en bolsa insuficiente.');
    }

    onEjecutarBolsa(qty, selectType);
    setMonto('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <BarChart3 className="text-blue-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Panel Operativo de Bolsa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Disponible para Operar</span>
            <span className="text-xl font-black text-white">{bolsaDisponible.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Invertido Propio</span>
            <span className="text-xl font-black text-gray-400">{bolsaInvertido.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dividendos / Premios</span>
            <span className="text-xl font-black text-blue-400">+{bolsaGanancias.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#2d2d2d] p-5 rounded-xl space-y-4">
          <span className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
            <Plus size={14} className="text-blue-400" /> Colocar Orden Bursátil
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={selectType} onChange={(e) => setSelectType(e.target.value as any)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500">
              <option value="propio">Invertir desde mi Disponible de Bolsa</option>
              <option value="ganancia">Registrar Dividendos / Recompensas externas</option>
              <option value="diadia">Pasar Disponible a Día a Día</option>
            </select>
            <input type="number" placeholder="Cantidad en €" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" />
          </div>
          <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider cursor-pointer">Ejecutar Acción</button>
        </div>
      </div>
    </div>
  );
};
