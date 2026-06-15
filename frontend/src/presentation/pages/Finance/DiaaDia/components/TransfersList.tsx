import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { TransactionModal } from './modals/TransactionModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { FinanceService } from '../../../../../infrastructure/services/FinanceService';
import { auth } from '../../../../../infrastructure/firebase/config';

interface TransfersListProps {
  transactions: any[];
  monthId: string;
  monthLabel: string;
}

export const TransfersList = ({ transactions, monthId, monthLabel }: TransfersListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const allTransfers = transactions
    .filter(t => t.type === 'transfer')
    .sort((a, b) => new Date(b.dateString || 0).getTime() - new Date(a.dateString || 0).getTime());

  const uniqueCategories = Array.from(new Set(allTransfers.map(t => t.category || 'Sin categoría')));

  const filteredTransfers = filterCategory === 'Todas' 
    ? allTransfers 
    : allTransfers.filter(t => (t.category || 'Sin categoría') === filterCategory);

  const handleEdit = (t: any) => { setSelectedTransaction(t); setIsModalOpen(true); };
  const handleAddNew = () => { setSelectedTransaction(null); setIsModalOpen(true); };
  const handleDeleteRequest = (id: string) => { setDeletingId(id); setIsDeleteOpen(true); };

  // 🚀 INTERCEPTOR DE ELIMINACIÓN DEFINITIVO
  const confirmDelete = async () => {
    if (!deletingId || !auth.currentUser) return;
    setIsDeleting(true);

    try {
      // 1. Buscamos la transacción en el array de props antes de que sea borrada de Firestore
      const txToDelete = transactions.find(t => t.id === deletingId);

      // 2. Si existía y era de categoría Inversión, la restamos del total acumulado de la otra pantalla
      if (txToDelete && txToDelete.type === 'transfer' && txToDelete.category === 'Inversión') {
        const currentInvertido = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
        localStorage.setItem('aio_total_invertido_diadia_v2', Math.max(0, currentInvertido - Number(txToDelete.amount)).toString());
      }

      // 3. Procedemos con el borrado normal de tu servicio
      await FinanceService.deleteTransaction(auth.currentUser.uid, monthId, deletingId);
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-full flex flex-col shadow-sm">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-200">Transacciones</h2>
            <ArrowRightLeft size={16} className="text-blue-500" />
          </div>
          {uniqueCategories.length > 0 && (
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#151515] border border-[#2d2d2d] text-gray-400 text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:text-white transition-colors"
              style={{ colorScheme: 'dark' }}
            >
              <option value="Todas">Todas</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        
        <div className="overflow-y-auto custom-scrollbar space-y-3 mb-4 pr-2 max-h-[460px]">
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((trans, i) => {
              const dateStr = trans.dateString ? new Date(trans.dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Realizada';
              return (
                <div key={i} className="flex justify-between items-center p-4 border border-[#2d2d2d] rounded-xl bg-[#151515] group shrink-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{trans.label || trans.category || '—'}</p>
                    <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-blue-500 font-bold">{trans.amount.toFixed(2)}€</p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(trans)} className="text-gray-500 hover:text-white transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteRequest(trans.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 flex justify-center items-center">
              <p className="text-gray-500 italic text-sm">No hay transacciones {filterCategory !== 'Todas' && 'de esta categoría'}.</p>
            </div>
          )}
        </div>

        <button onClick={handleAddNew} className="mt-auto w-full flex items-center justify-center gap-2 border border-dashed border-[#3d3d3d] py-3 rounded-xl text-sm text-gray-400 hover:bg-[#252525] hover:border-gray-500 transition-all">
          <Plus size={16} /> Añadir transacción
        </button>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} monthId={monthId} type="transfer" transaction={selectedTransaction} />
      <ConfirmDeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} isDeleting={isDeleting} />
    </>
  );
};
