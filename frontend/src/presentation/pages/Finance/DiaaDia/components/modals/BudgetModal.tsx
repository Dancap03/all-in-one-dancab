import { useState } from 'react';
import { X } from 'lucide-react';
import { FinanceService } from '../../../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../../../infrastructure/firebase/config';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthId: string;
  currentBudget: number;
}

export const BudgetModal = ({ isOpen, onClose, monthId, currentBudget }: BudgetModalProps) => {
  const [amount, setAmount] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !amount) return;
    
    setIsSaving(true);
    try {
      await FinanceService.updateBudget(user.uid, monthId, Number(amount));
      onClose();
    } catch (error) {
      console.error("Error al guardar presupuesto", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Presupuesto mensual</h2>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-white mb-2">Cantidad (€)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
