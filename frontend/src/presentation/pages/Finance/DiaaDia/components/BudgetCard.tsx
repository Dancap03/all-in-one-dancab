import { useState } from 'react';
import { Edit2, Plus, Pencil, Trash2 } from 'lucide-react';
import { BudgetModal } from './modals/BudgetModal';
import { TransactionModal } from './modals/TransactionModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { FinanceService } from '../../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../../infrastructure/firebase/config';

interface BudgetCardProps { 
  budget: number;
  transactions: any[]; 
  monthId: string;
}

export const BudgetCard = ({ budget, transactions, monthId }: BudgetCardProps) => {
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
  const remaining = budget - totalExpenses;
  const percent = budget > 0 ? (totalExpenses / budget) * 100 : 0;

  const handleEdit = (t: any) => { setSelectedTransaction(t); setIsExpenseOpen(true); };
  const handleAddNew = () => { setSelectedTransaction(null); setIsExpenseOpen(true); };
  const handleDeleteRequest = (id: string) => { setDeletingId(id); setIsDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!deletingId || !auth.currentUser) return;
    setIsDeleting(true);
    await FinanceService.deleteTransaction(auth.currentUser.uid, monthId, deletingId);
    setIsDeleting(false);
    setIsDeleteOpen(false);
    setDeletingId(null);
  };

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-fit shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-200">Presupuesto mensual</h2>
          <button onClick={() => setIsBudgetOpen(true)} className="bg-[#2d2d2d] p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
            <Edit2 size={14} />
          </button>
        </div>

        <div className="flex justify-between text-sm mb-3">
          <p className="text-gray-400">Presupuesto: <b className="text-white">{budget}€</b></p>
          <p className={`${remaining >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>Restante: {remaining.toFixed(2)}€</p>
        </div>

        <div className="relative h-16 w-full bg-[#0c0c0c] rounded-lg overflow-hidden border border-[#2d2d2d] mb-6">
          <div className="absolute inset-0 bg-[#10b981] opacity-25"></div>
          <div className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-700 shadow-[0_0_15px_rgba(239,68,68,0.2)]" style={{ width: `${Math.min(percent, 100)}%` }}></div>
        </div>

        {/* NUEVA SECCIÓN: LISTA DE GASTOS */}
        <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar">
          {expenses.length > 0 && expenses.map((exp, i) => {
            const dateStr = exp.dateString ? new Date(exp.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Pagado';
            return (
              <div key={i} className="flex justify-between items-center p-4 border border-[#2d2d2d] rounded-xl bg-[#151515] group">
                <div>
                  <p className="text-sm font-semibold text-white">{exp.label || exp.category || '—'}</p>
                  <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-red-500 font-bold">-{exp.amount.toFixed(2)}€</p>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(exp)} className="text-gray-500 hover:text-white transition-colors"><Pencil size={14}/></button>
                    <button onClick={() => handleDeleteRequest(exp.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleAddNew} className="w-full flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
          <Plus size={16} /> Añadir gasto
        </button>
      </div>

      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} monthId={monthId} currentBudget={budget} />
      <TransactionModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} monthId={monthId} type="expense" transaction={selectedTransaction} />
      <ConfirmDeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} isDeleting={isDeleting} />
    </>
  );
};
