import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, ArrowRightLeft, Plus } from 'lucide-react';
import { SavingsService, SavingsTransaction } from '../../../../infrastructure/services/SavingsService';
import { auth } from '../../../../infrastructure/firebase/config';

import { SavingsChart } from './components/SavingsChart';
import { VaultsList } from './components/VaultsList';
import { SavingsHistory } from './components/SavingsHistory';
import { VaultModal } from './components/modals/VaultModal';
import { SavingsTransactionModal } from './components/modals/SavingsTransactionModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal'; // IMPORTACIÓN NUEVA
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Ahorro = () => {
  const [available, setAvailable] = useState(0);
  const [inVaults, setInVaults] = useState(0);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Estados para los modales de creación/edición
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [transType, setTransType] = useState<'to_vault' | 'from_vault' | 'withdrawal'>('to_vault');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // NUEVO: Estados para los modales de borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingData, setDeletingData] = useState<{ id: string, type: 'transaction' | 'vault' } | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubTrans = SavingsService.subscribeToSavings(user.uid, (data) => {
      setAvailable(data.available); setInVaults(data.inVaults); setTransactions(data.transactions); setLoading(false);
    });
    const unsubVaults = SavingsService.subscribeToVaults(user.uid, (data) => { setVaults(data); });
    return () => { unsubTrans(); unsubVaults(); };
  }, []);

  const vaultBalances: Record<string, number> = {};
  vaults.forEach(v => vaultBalances[v.id] = 0);
  transactions.forEach(t => {
    if (t.type === 'to_vault' && t.vaultId) vaultBalances[t.vaultId] = (vaultBalances[t.vaultId] || 0) + t.amount;
    if (t.type === 'from_vault' && t.vaultId) vaultBalances[t.vaultId] = (vaultBalances[t.vaultId] || 0) - t.amount;
  });

  // Funciones para Transacciones
  const handleOpenTransModal = (type: 'to_vault' | 'from_vault' | 'withdrawal') => { setTransType(type); setSelectedTransaction(null); setIsTransModalOpen(true); };
  const handleEditTransaction = (t: any) => { setTransType(t.type); setSelectedTransaction(t); setIsTransModalOpen(true); };
  
  // NUEVO: Abre modal en vez de usar window.confirm
  const handleDeleteTransactionRequest = (id: string) => {
    const t = transactions.find(tr => tr.id === id);
    if (!t) return;

    // Validación antifraude (esta se queda)
    if (t.type === 'to_vault' && (vaultBalances[t.vaultId!] || 0) - t.amount < 0) { alert("No puedes borrar este movimiento porque la hucha se quedaría en negativo."); return; }
    if (t.type === 'from_vault' && available - t.amount < 0) { alert("No puedes borrar esta retirada porque tu disponible quedaría en negativo."); return; }

    setDeletingData({ id, type: 'transaction' }); setIsDeleteModalOpen(true);
  };
  
  // Funciones para Huchas
  const handleEditVault = (vault: any) => { setSelectedVault(vault); setIsVaultModalOpen(true); };
  
  // NUEVO: Abre modal en vez de usar window.confirm
  const handleDeleteVaultRequest = (id: string) => { setDeletingData({ id, type: 'vault' }); setIsDeleteModalOpen(true); };

  // NUEVO: Función final que ejecuta el borrado en Firebase
  const handleConfirmDelete = async () => {
    if (!deletingData || !auth.currentUser) return;
    setIsDeleting(true);
    try {
      if (deletingData.type === 'transaction') {
        await SavingsService.deleteSavingsTransaction(auth.currentUser.uid, deletingData.id);
      } else if (deletingData.type === 'vault') {
        await SavingsService.deleteVault(auth.currentUser.uid, deletingData.id);
      }
      setIsDeleteModalOpen(false);
    } catch (e) { console.error(e); } finally { setIsDeleting(false); setDeletingData(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981]"></div></div>;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">
          Ahorro
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">Disponible</p>
          <p className="text-4xl font-bold text-[#10b981]">{available.toFixed(2)}€</p>
        </div>
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">En huchas</p>
          <p className="text-4xl font-bold text-white">{inVaults.toFixed(2)}€</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleOpenTransModal('to_vault')} className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] rounded-lg text-sm font-medium hover:bg-[#10b981]/20 transition-colors"><ArrowDown size={16} /> Mover a hucha</button>
          <button onClick={() => handleOpenTransModal('from_vault')} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors"><ArrowUp size={16} /> Mover de hucha</button>
          <button onClick={() => handleOpenTransModal('withdrawal')} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors"><ArrowRightLeft size={16} /> Pasar a día a día</button>
        </div>
        <button onClick={() => { setSelectedVault(null); setIsVaultModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors ml-auto"><Plus size={16} /> Nueva hucha</button>
      </div>

      <SavingsChart transactions={transactions} />
      
      {/* CORRECCIÓN DE PROPS: Ahora pasamos las funciones de borrado al modal */}
      <VaultsList vaults={vaults} vaultBalances={vaultBalances} onEditVault={handleEditVault} onDeleteVault={handleDeleteVaultRequest} />
      
      <SavingsHistory transactions={transactions} vaults={vaults} onEdit={handleEditTransaction} onDelete={handleDeleteTransactionRequest} />
      
      {/* Inyección de Modales */}
      <VaultModal isOpen={isVaultModalOpen} onClose={() => setIsVaultModalOpen(false)} vault={selectedVault} />
      <SavingsTransactionModal isOpen={isTransModalOpen} onClose={() => setIsTransModalOpen(false)} type={transType} vaults={vaults} transaction={selectedTransaction} available={available} vaultBalances={vaultBalances} />
      
      {/* NUEVO: Modal de Confirmación de Borrado unificado */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isDeleting={isDeleting} 
        title={deletingData?.type === 'vault' ? "Eliminar hucha" : "Eliminar transacción"}
        message={deletingData?.type === 'vault' ? "¿Estás seguro de que quieres eliminar esta hucha? Sus movimientos quedarán huérfanos." : "¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer."}
      />
    </div>
  );
};
