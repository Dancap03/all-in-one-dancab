import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, ArrowRightLeft, Plus } from 'lucide-react';
import { SavingsService, SavingsTransaction } from '../../../../infrastructure/services/SavingsService';
import { auth } from '../../../../infrastructure/firebase/config';
 
import { SavingsChart } from './components/SavingsChart';
import { VaultsList } from './components/VaultsList';
import { SavingsHistory } from './components/SavingsHistory';
 
export const Ahorro = () => {
  const [available, setAvailable] = useState(0);
  const [inVaults, setInVaults] = useState(0);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Suscripción a movimientos
    const unsubTrans = SavingsService.subscribeToSavings(user.uid, (data) => {
      setAvailable(data.available);
      setInVaults(data.inVaults);
      setTransactions(data.transactions);
      setLoading(false);
    });

    // Suscripción a Huchas
    const unsubVaults = SavingsService.subscribeToVaults(user.uid, (data) => {
      setVaults(data);
    });

    return () => { unsubTrans(); unsubVaults(); };
  }, []);

  // Calculamos el saldo de cada hucha al vuelo mediante Event Sourcing
  const vaultBalances: Record<string, number> = {};
  vaults.forEach(v => vaultBalances[v.id] = 0);
  transactions.forEach(t => {
    if (t.type === 'to_vault' && t.vaultId) vaultBalances[t.vaultId] = (vaultBalances[t.vaultId] || 0) + t.amount;
    if (t.type === 'from_vault' && t.vaultId) vaultBalances[t.vaultId] = (vaultBalances[t.vaultId] || 0) - t.amount;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6 font-sans">
      
      {/* 1. TARJETAS SUPERIORES */}
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

      {/* 2. BOTONERA DE ACCIONES */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] rounded-lg text-sm font-medium hover:bg-[#10b981]/20 transition-colors">
            <ArrowDown size={16} /> Mover a hucha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors">
            <ArrowUp size={16} /> Mover de hucha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors">
            <ArrowRightLeft size={16} /> Pasar a día a día
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors ml-auto">
          <Plus size={16} /> Nueva hucha
        </button>
      </div>

      {/* 3. GRÁFICO */}
      <SavingsChart />

      {/* 4. LISTA DE HUCHAS */}
      <VaultsList vaults={vaults} vaultBalances={vaultBalances} />

      {/* 5. HISTORIAL DE MOVIMIENTOS */}
      <SavingsHistory transactions={transactions} vaults={vaults} />
      
    </div>
  );
};
