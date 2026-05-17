import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TransactionModal } from './modals/TransactionModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { FinanceService } from '../../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../../infrastructure/firebase/config';

interface IncomeListProps {
  transactions: any[];
  monthId: string;
  monthLabel: string;
}

export const IncomeList = ({ transactions, monthId, monthLabel }: IncomeListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const incomes = transactions
    .filter(t => t.type === 'income')
    .sort((a, b) => new Date(b.dateString || 0).getTime() - new Date(a.dateString || 0).getTime());

  const handleEdit = (t: any) => { setSelectedTransaction(t); setIsModalOpen(true); };
  const handleAddNew = () => { setSelectedTransaction(null); setIsModalOpen(true); };
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
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-full flex flex-col shadow-sm">
        
        <h2 className="font-bold text-gray-200 mb-6">Ingresos</h2>
        
        {/* SE ADAPTA AL ESPACIO: flex-1 min-h-0 */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 mb-4 pr-2">
          {incomes.length > 0 ? (
            incomes.map((inc, i) => {
              const dateStr = inc.dateString ? new Date(inc.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Recibido';
              return (
                <div key={i} className="flex justify-between items-center p-4 border border-[#2d2d2d] rounded-xl bg-[#151515] group shrink-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{inc.label || inc.category || '—'}</p>
                    <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-green-500 font-bold">+{inc.amount.toFixed(2)}€</p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(inc)} className="text-gray-500 hover:text-white transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteRequest(inc.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 flex justify-center items-center">
              <p className="text-gray-500 italic text-sm">No hay ingresos registrados en {monthLabel.toLowerCase()}.</p>
            </div>
          )}
        </div>

        <button onClick={handleAddNew} className="mt-auto w-full flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
          <Plus size={16} /> Añadir ingreso
        </button>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} monthId={monthId} type="income" transaction={selectedTransaction} />
      <ConfirmDeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} isDeleting={isDeleting} />
    </>
  );
};
