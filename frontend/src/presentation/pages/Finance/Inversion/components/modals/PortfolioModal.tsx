import { useState } from 'react';
import { X } from 'lucide-react';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (portfolio: any) => void;
}

export const PortfolioModal = ({ isOpen, onClose, onSave }: PortfolioModalProps) => {
  const [nombre, setNombre] = useState('');
  const [broker, setBroker] = useState('');
  const [perfil, setPerfil] = useState('Moderada');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({
      id: Date.now().toString(), // Simulación de ID generado por BD
      nombre,
      broker,
      perfil
    });
    setNombre('');
    setBroker('');
    setPerfil('Moderada');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Nueva cartera</h2>
        
        <div className="space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
            <input 
              type="text" 
              placeholder="Mi Cartera Principal..." 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none focus:shadow-[0_0_0_1px_#10b981]"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Broker (opcional)</label>
            <input 
              type="text" 
              placeholder="DEGIRO, Trade Republic..." 
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Perfil de riesgo</label>
            <select 
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none appearance-none transition-colors"
            >
              <option value="Conservadora">Conservadora (Bajo riesgo, renta fija)</option>
              <option value="Moderada">Moderada (Equilibrio, ETFs indexados)</option>
              <option value="Agresiva">Agresiva (Alto riesgo, Crypto, Stock picking)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525] transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={!nombre.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#2563eb] hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Crear cartera
          </button>
        </div>
      </div>
    </div>
  );
};
