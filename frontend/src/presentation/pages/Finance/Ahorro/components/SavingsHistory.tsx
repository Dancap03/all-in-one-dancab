import { Pencil, Trash2 } from 'lucide-react';

interface SavingsHistoryProps {
  transactions: any[];
  vaults: any[];
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
}

export const SavingsHistory = ({ transactions, vaults, onEdit, onDelete }: SavingsHistoryProps) => {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm mb-6">
      <h2 className="font-bold text-white mb-4">Historial de movimientos</h2>
      
      <div className="flex flex-col">
        {transactions.map((t, i) => {
          const dateStr = t.date ? new Date(t.date.seconds * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          
          let title = ''; let icon = ''; let amountColor = ''; let prefix = '';

          if (t.type === 'deposit') { title = 'Ingreso'; icon = '💰'; amountColor = 'text-[#10b981]'; prefix = '+'; } 
          else if (t.type === 'withdrawal') { title = 'A día a día'; icon = '↑'; amountColor = 'text-[#ef4444]'; prefix = '-'; } 
          else if (t.type === 'to_vault') { const vault = vaults.find(v => v.id === t.vaultId); title = vault ? vault.name : 'Hucha eliminada'; icon = '→'; amountColor = 'text-[#ef4444]'; prefix = '-'; } 
          else if (t.type === 'from_vault') { const vault = vaults.find(v => v.id === t.vaultId); title = vault ? vault.name : 'Hucha eliminada'; icon = '←'; amountColor = 'text-[#10b981]'; prefix = '+'; }

          return (
            <div key={i} className="flex justify-between items-center py-4 border-b border-[#2d2d2d] last:border-0 group">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5"><span className="text-base">{icon}</span> {title}</p>
                  <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-bold ${amountColor}`}>{prefix}{t.amount.toFixed(2)}€</p>
                {/* Botones de editar y borrar (Ocultos para 'deposit' porque esos vienen de Día a Día) */}
                {t.type !== 'deposit' && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(t)} className="text-gray-500 hover:text-white transition-colors"><Pencil size={14}/></button>
                    <button onClick={() => onDelete(t.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
