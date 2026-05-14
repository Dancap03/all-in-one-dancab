import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SavingsService } from '../../../../../../infrastructure/services/SavingsService';
import { auth } from '../../../../../../infrastructure/firebase/config';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault?: any;
} 

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c', '#f87171', '#e879f9', '#2dd4bf'];

export const VaultModal = ({ isOpen, onClose, vault }: VaultModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [target, setTarget] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vault && isOpen) {
      setName(vault.name); setColor(vault.color); setTarget(vault.target ? vault.target.toString() : '');
    } else if (isOpen) {
      setName(''); setColor(COLORS[0]); setTarget('');
    }
  }, [vault, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !name) return;
    setIsSaving(true);
    const data = { name, color, target: target ? Number(target) : null };
    try {
      if (vault?.id) await SavingsService.updateVault(user.uid, vault.id, data);
      else await SavingsService.addVault(user.uid, data);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h2 className="text-xl font-bold text-white mb-6">{vault ? 'Editar hucha' : 'Nueva hucha'}</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Nombre</label>
            <input type="text" placeholder="Ej: Imprevistos" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Objetivo (€, opcional)</label>
            <input type="number" placeholder="Sin objetivo" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525]">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving || !name} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
};
