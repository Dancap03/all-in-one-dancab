import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../../../../infrastructure/firebase/config';
import { IconPicker } from '../IconPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vaultToEdit?: any; // Recibe la hucha si vamos a editar
}

const colors = [
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'rose', bg: 'bg-rose-500' },
  { id: 'amber', bg: 'bg-amber-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-500' }
];

export const VaultModal = ({ isOpen, onClose, vaultToEdit }: Props) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [color, setColor] = useState('emerald');
  const [iconName, setIconName] = useState('PiggyBank');
  const [loading, setLoading] = useState(false);

  // Si estamos editando, rellenamos los campos con los datos de la hucha
  useEffect(() => {
    if (vaultToEdit) {
      setTitle(vaultToEdit.title || vaultToEdit.name || '');
      setSubtitle(vaultToEdit.subtitle || vaultToEdit.description || '');
      setTargetAmount(vaultToEdit.targetAmount?.toString() || vaultToEdit.target?.toString() || '');
      setColor(vaultToEdit.color || 'emerald');
      setIconName(vaultToEdit.iconName || 'PiggyBank');
    } else {
      setTitle('');
      setSubtitle('');
      setTargetAmount('');
      setColor('emerald');
      setIconName('PiggyBank');
    }
  }, [vaultToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !title || !targetAmount) return;

    setLoading(true);
    try {
      const vaultData = {
        title,
        subtitle,
        targetAmount: Number(targetAmount),
        color,
        iconName,
        updatedAt: new Date().toISOString()
      };

      if (vaultToEdit) {
        // Editar hucha existente
        await updateDoc(doc(db, `users/${user.uid}/vaults`, vaultToEdit.id), vaultData);
      } else {
        // Crear hucha nueva (empieza con 0€)
        await addDoc(collection(db, `users/${user.uid}/vaults`), {
          ...vaultData,
          currentAmount: 0,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      console.error("Error guardando hucha:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
          <h2 className="text-xl font-bold text-white">
            {vaultToEdit ? 'Editar hucha' : 'Nueva hucha'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nombre de la meta</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Viaje a Japón" className="w-full bg-[#1c1c1e] text-white border border-[#2d2d2d] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Descripción (Opcional)</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ej: Vacaciones de verano 2026" className="w-full bg-[#1c1c1e] text-white border border-[#2d2d2d] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Objetivo a alcanzar (€)</label>
            <input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required placeholder="3000" className="w-full bg-[#1c1c1e] text-white border border-[#2d2d2d] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Color</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <button key={c.id} type="button" onClick={() => setColor(c.id)} className={`w-8 h-8 rounded-full ${c.bg} transition-transform cursor-pointer ${color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141416] scale-110' : 'opacity-50 hover:opacity-100'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Icono</label>
            <IconPicker selectedIcon={iconName} onSelect={setIconName} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-black font-bold py-3.5 rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50">
              {loading ? 'Guardando...' : (vaultToEdit ? 'Guardar cambios' : 'Crear hucha')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
