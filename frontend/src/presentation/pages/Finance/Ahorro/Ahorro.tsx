import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../../../infrastructure/firebase/config';
import { 
  ArrowLeft, ArrowDown, ArrowUp, ArrowRightLeft, Plus, 
  MoreVertical, Pencil, Trash2, PiggyBank 
} from 'lucide-react';

// --- IMPORTAMOS TUS COMPONENTES REALES ---
import { VaultModal } from './components/modals/VaultModal';
import { SavingsTransactionModal } from './components/modals/SavingsTransactionModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { SavingsHistory } from './components/SavingsHistory';

export const Ahorro = () => {
  const navigate = useNavigate();

  // --- ESTADOS DE DATOS ---
  const [disponible, setDisponible] = useState(0);
  const [huchas, setHuchas] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE TUS MODALES ---
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'to_vault' | 'from_vault' | 'withdrawal'>('to_vault');
  const [vaultToEdit, setVaultToEdit] = useState<any>(null);

  // --- ESTADO DEL DROPDOWN DE 3 PUNTITOS ---
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- CARGA DE DATOS REAL DE FIREBASE ---
  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Saldo disponible
      const saldoDisp = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      setDisponible(saldoDisp);

      // Huchas reales
      const vaultsSnap = await getDocs(collection(db, `users/${user.uid}/vaults`));
      const vaultsData = vaultsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setHuchas(vaultsData);

      // Historial para pasárselo a tu SavingsHistory
      const todosLosMovs: any[] = [];
      const savTransSnap = await getDocs(collection(db, `users/${user.uid}/savings_transactions`));
      savTransSnap.docs.forEach(d => {
        const t = d.data();
        todosLosMovs.push({
          id: d.id,
          ...t,
          amount: Number(t.amount) || 0,
          dateString: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString()
        });
      });
      todosLosMovs.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
      setMovimientos(todosLosMovs);

    } catch (error) {
      console.error("Error cargando ahorro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNCIÓN PARA ELIMINAR HUCHA ---
  const handleDeleteVault = async () => {
    if (!vaultToEdit) return;
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, `users/${user.uid}/vaults`, vaultToEdit.id));
        fetchData();
      }
    } catch (error) {
      console.error("Error al eliminar la hucha:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setVaultToEdit(null);
    }
  };

  const enHuchas = huchas.reduce((acc, h) => acc + (Number(h.currentAmount) || Number(h.current) || 0), 0);

  const vaultBalances = huchas.reduce((acc, h) => {
    acc[h.id] = Number(h.currentAmount) || Number(h.current) || 0;
    return acc;
  }, {} as Record<string, number>);

  // --- DICCIONARIO DE COLORES ---
  const colorStyles: Record<string, { bg: string, text: string, bar: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  };

  if (loading) return <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="w-full text-white min-h-screen pb-12 animate-in fade-in duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">Ahorro</h1>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">Disponible</p>
          <p className="text-emerald-400 text-3xl font-black">{disponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">En huchas</p>
          <p className="text-white text-3xl font-black">{enHuchas.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
      </div>

      {/* BOTONERA */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => { setTransactionType('to_vault'); setIsTransactionModalOpen(true); }} 
            className="flex items-center gap-2 px-4 py-2 border border-emerald-500 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-colors cursor-pointer"
          >
            <ArrowDown size={16} /> Mover a hucha
          </button>
          <button 
            onClick={() => { setTransactionType('from_vault'); setIsTransactionModalOpen(true); }} 
            className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer"
          >
            <ArrowUp size={16} /> Mover de hucha
          </button>
          <button 
            onClick={() => { setTransactionType('withdrawal'); setIsTransactionModalOpen(true); }} 
            className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer"
          >
            <ArrowRightLeft size={16} /> Pasar a día a día
          </button>
        </div>
        <button 
          onClick={() => { setVaultToEdit(null); setIsVaultModalOpen(true); }} 
          className="flex items-center gap-2 px-4 py-2 border border-[#3d3d3d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors cursor-pointer"
        >
          <Plus size={16} /> Nueva hucha
        </button>
      </div>

      {/* LISTA DE HUCHAS REALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12" ref={dropdownRef}>
        {huchas.map((hucha) => {
          const current = Number(hucha.currentAmount) || Number(hucha.current) || 0;
          const target = Number(hucha.targetAmount) || Number(hucha.target) || 0;
          const title = hucha.title || hucha.name || 'Hucha';
          const subtitle = hucha.subtitle || hucha.description || 'Fondo de ahorro';
          
          const style = colorStyles[hucha.color] || colorStyles.emerald;
          const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
          const remaining = target - current;
          const isDropdownOpen = dropdownOpen === hucha.id;

          return (
            <div key={hucha.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 relative group">
              
              <button 
                onClick={() => setDropdownOpen(isDropdownOpen ? null : hucha.id)}
                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-[#2d2d2d]"
              >
                <MoreVertical size={18} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-12 right-4 w-40 bg-[#1c1c1e] border border-[#3d3d3d] rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button 
                    onClick={() => { alert('Para editar, añade soporte en VaultModalProps'); setDropdownOpen(null); }} 
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2d2d2d] transition-colors text-left cursor-pointer"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => { setVaultToEdit(hucha); setIsDeleteModalOpen(true); setDropdownOpen(null); }} 
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer border-t border-[#3d3d3d]"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                  <PiggyBank size={20} />
                </div>
                <div className="pr-6">
                  <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-2xl font-black text-white">{current.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  {target > 0 && (
                    <p className="text-xs text-gray-500 font-medium bg-[#1c1c1e] px-2 py-0.5 rounded mt-1 inline-block">
                      de {target.toLocaleString('es-ES')} € · quedan {remaining > 0 ? remaining.toLocaleString('es-ES') : 0} €
                    </p>
                  )}
                </div>
                {target > 0 && <span className={`text-sm font-bold ${style.text}`}>{percentage}%</span>}
              </div>

              {target > 0 && (
                <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden mt-3">
                  <div className={`h-full rounded-full ${style.bar} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}></div>
                </div>
              )}
            </div>
          );
        })}
        {huchas.length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center py-10 text-gray-500 text-sm border border-dashed border-[#2d2d2d] rounded-2xl">
            No tienes ninguna hucha creada aún.
          </div>
        )}
      </div>

      <SavingsHistory 
        transactions={movimientos}
        vaults={huchas}
        onEdit={(tx) => console.log('Editar transaccion', tx)}
        onDelete={(tx) => console.log('Eliminar transaccion', tx)}
      />

      {/* RENDERIZADO DE MODALES */}
      {isVaultModalOpen && (
        <VaultModal 
          isOpen={isVaultModalOpen} 
          onClose={() => { setIsVaultModalOpen(false); setVaultToEdit(null); fetchData(); }} 
        />
      )}

      {isTransactionModalOpen && (
        <SavingsTransactionModal 
          isOpen={isTransactionModalOpen} 
          onClose={() => { setIsTransactionModalOpen(false); fetchData(); }} 
          type={transactionType} 
          vaults={huchas} 
          available={disponible}
          vaultBalances={vaultBalances}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => { setIsDeleteModalOpen(false); setVaultToEdit(null); }} 
          onConfirm={handleDeleteVault} 
          title="Eliminar hucha" 
          message={`¿Seguro que quieres eliminar la hucha "${vaultToEdit?.title || vaultToEdit?.name}"?`} 
        />
      )}

    </div>
  );
};
