import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface PortfolioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: any;
  onUpdate: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export const PortfolioSettingsModal = ({ isOpen, onClose, portfolio, onUpdate, onDelete }: PortfolioSettingsModalProps) => {
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (portfolio) {
      setNombre(portfolio.nombre);
    }
  }, [portfolio]);

  if (!isOpen || !portfolio) return null;

  const handleSave = () => {
    if (!nombre.trim()) return;
    onUpdate(portfolio.id, nombre);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cartera? Esta acción no se puede deshacer.')) {
      onDelete(portfolio.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Ajustes de cartera</h2>
        
        <div className="space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de la cartera</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#10b981] transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleSave} 
            disabled={!nombre.trim()}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#2563eb] hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Guardar cambios
          </button>
          
          <button 
            onClick={handleDelete} 
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Eliminar cartera
          </button>
        </div>
      </div>
    </div>
  );
};
