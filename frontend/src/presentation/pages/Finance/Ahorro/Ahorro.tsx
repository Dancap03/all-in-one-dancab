import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, ArrowRightLeft, Plus } from 'lucide-react';
import { SavingsService, SavingsTransaction } from '../../../../infrastructure/services/SavingsService';
import { auth } from '../../../../infrastructure/firebase/config';

export const Ahorro = () => {
  const [available, setAvailable] = useState(0);
  const [inVaults, setInVaults] = useState(0);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = SavingsService.subscribeToSavings(user.uid, (data) => {
      setAvailable(data.available);
      setInVaults(data.inVaults);
      setTransactions(data.transactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-6 font-sans">
      
      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Disponible */}
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">Disponible</p>
          <p className="text-4xl font-bold text-[#10b981]">
            {available.toFixed(2)}€
          </p>
        </div>

        {/* En huchas */}
        <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">En huchas</p>
          <p className="text-4xl font-bold text-white">
            {inVaults.toFixed(2)}€
          </p>
        </div>
      </div>

      {/* BOTONERA DE ACCIONES (Diseño de la imagen) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#10b981] text-[#10b981] rounded-lg text-sm font-medium hover:bg-[#10b981]/10 transition-colors">
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

      {/* Aquí irá la gráfica, las huchas y el historial */}
    </div>
  );
};
