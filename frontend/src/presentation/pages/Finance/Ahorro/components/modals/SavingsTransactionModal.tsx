import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SavingsService } from '../../../../../../infrastructure/services/SavingsService';
import { auth } from '../../../../../../infrastructure/firebase/config';

interface SavingsTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'to_vault' | 'from_vault' | 'withdrawal';
  vaults: any[];
  transaction?: any;
}

const TITLES = {
  to_vault: 'Mover a hucha',
  from_vault: 'Mover de hucha',
  withdrawal: 'Pasar a día a día'
};

export const SavingsTransactionModal = ({ isOpen, onClose, type, vaults, transaction }: SavingsTransactionModalProps) => {
  const [vaultId, setVaultId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setVaultId(transaction.vaultId || ''); setAmount(transaction.amount.toString());
      setDate(transaction.date ? new Date(transaction.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    } else if (isOpen) {
      setVaultId(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !amount || (type !== 'withdrawal' && !vaultId)) return;
    setIsSaving(true);
    
    // Convertir el string de fecha (YYYY-MM-DD) a un objeto Date para Firestore
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);

    const data: any = { type, amount: Number(amount), date: dateObj };
    
    if (type !== 'withdrawal') {
      data.vaultId = vaultId;
      data.label = 'Transferencia de hucha'; // Se mostrará esto en el historial si no encontramos la hucha
    } else {
      data.label = 'Retiro a día a día';
    }

    try {
      if (transaction?.id) await SavingsService.updateSavingsTransaction(user.uid, transaction.id, data);
      else await SavingsService.addSavingsTransaction(user.uid, data);
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
        <h2 className="text-xl font-bold text-white mb-6">{TITLES[type]}</h2>
        
        <div className="space-y-4 mb-8">
          {type !== 'withdrawal' && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">Hucha</label>
              <select value={vaultId} onChange={(e) => setVaultId(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none appearance-none">
                <option value="" disabled>Seleccionar hucha...</option>
                {vaults.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1">Cantidad (€)</label>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none color-scheme-dark" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525]">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving || !amount || (type !== 'withdrawal' && !vaultId)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] disabled:opacity-50">Confirmar</button>
        </div>
      </div>
    </div>
  );
};
