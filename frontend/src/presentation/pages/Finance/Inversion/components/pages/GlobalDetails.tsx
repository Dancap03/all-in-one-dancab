import { useState } from 'react';
import { ArrowLeft, Globe, ArrowRightLeft } from 'lucide-react';

interface GlobalDetailsProps {
  disponibleGlobal: number;
  totalInvertido: number;
  onTransferir: (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => void;
  onBack: () => void;
}

export const GlobalDetails = ({ disponibleGlobal, totalInvertido, onTransferir, onBack }: GlobalDetailsProps) => {
  const [monto, setMonto] = useState('');

  const handleEjecutar = (destino: 'bolsa' | 'proyecto' | 'diadia') => {
    const valor = Number(monto);
    if (!valor || valor <= 0) return alert('Introduce una cantidad válida.');
    if (destino !== 'diadia' && valor > disponibleGlobal) return alert('Saldo disponible insuficiente.');
    if (destino === 'diadia' && valor > totalInvertido) return alert('No puedes retirar más capital del que tienes invertido total.');

    onTransferir(valor, destino);
    setMonto('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={14} /> Volver al Resumen
      </button>

      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2d2d2d] mb-6">
          <Globe className="text-emerald-400" size={18} />
          <h2 className="text-base font-black uppercase tracking-wider">Operaciones de Balance Global</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Disponible para Asignar</span>
            <span className="text-xl font-black text-white">{disponibleGlobal.toLocaleString('es-ES')} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-4 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Capital Invertido Total</span>
            <span className="text-xl font-black text-gray-300">{totalInvertido.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#2d2d2d] p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-emerald-400" /> Gestionar Flujo de Caja
            </span>
            <input 
              type="number" 
              placeholder="0.00 €" 
              value={monto} 
              onChange={(e) => setMonto(e.target.value)}
              className="w-28 bg-[#141416] border border-[#2d2d2d] rounded-lg px-3 py-1.5 text-right font-bold text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={() => handleEjecutar('bolsa')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider">Enviar a Bolsa</button>
            <button onClick={() => handleEjecutar('proyecto')} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider">Enviar a Proyecto</button>
            <button onClick={() => handleEjecutar('diadia')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider">Pasar a Día a Día</button>
          </div>
        </div>
      </div>
    </div>
  );
};
