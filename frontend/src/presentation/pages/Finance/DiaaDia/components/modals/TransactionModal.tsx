import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FinanceService } from '../../../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../../../infrastructure/firebase/config';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthId: string; 
  type: 'income' | 'expense';
  transaction?: any; // <-- NUEVO: Recibe los datos si estamos editando
}

const EXPENSE_CATEGORIES = ['Comida', 'Transporte', 'Ocio', 'Salud', 'Ropa', 'Hogar', 'Suscripciones', 'Educación', 'Otros'];
const INCOME_CATEGORIES = ['Nómina', 'Intereses', 'Dividendos', 'Venta', 'Freelance', 'Otros ingresos'];

export const TransactionModal = ({ isOpen, onClose, monthId, type, transaction }: TransactionModalProps) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isIncome = type === 'income';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // NUEVO: Si hay datos, rellenamos los campos
  useEffect(() => {
    if (transaction && isOpen) {
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.label === transaction.category ? '' : transaction.label);
      setDate(transaction.dateString || new Date().toISOString().split('T')[0]);
    } else if (isOpen) {
      setAmount(''); setCategory(''); setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !amount || !category) return;
    
    setIsSaving(true);
    const data = {
      amount: Number(amount),
      category,
      label: description || category,
      type,
      dateString: date
    };

    try {
      if (transaction?.id) {
        await FinanceService.updateTransaction(user.uid, monthId, transaction.id, data);
      } else {
        await FinanceService.addTransaction(user.uid, monthId, data);
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* ... El resto de la vista HTML (divs, inputs, selects, botones) queda EXACTAMENTE IGUAL que en el código que ya tienes ... */}
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">
          {transaction ? 'Editar' : 'Añadir'} {isIncome ? 'ingreso' : 'gasto'}
        </h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Cantidad (€)</label>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none appearance-none">
              <option value="" disabled>Selecciona...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Descripción (opcional)</label>
            <input type="text" placeholder="Nota..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2d2d2d] focus:border-[#10b981] rounded-lg px-4 py-2.5 text-white outline-none color-scheme-dark" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving || !amount || !category} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#3b82f6] hover:bg-blue-600 transition-colors disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
