interface SavingsHistoryProps {
  transactions: any[];
  vaults: any[];
}
  
export const SavingsHistory = ({ transactions, vaults }: SavingsHistoryProps) => {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-6 shadow-sm mb-6">
      <h2 className="font-bold text-white mb-4">Historial de movimientos</h2>
      
      <div className="flex flex-col">
        {transactions.map((t, i) => {
          const dateStr = t.date ? new Date(t.date.seconds * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          
          let title = '';
          let icon = '';
          let amountColor = '';
          let prefix = '';

          // Lógica para mostrar la etiqueta correcta según el tipo de movimiento
          if (t.type === 'deposit') {
            title = 'Ingreso'; icon = '💰'; amountColor = 'text-[#10b981]'; prefix = '+';
          } else if (t.type === 'withdrawal') {
            title = 'A día a día'; icon = '↑'; amountColor = 'text-[#ef4444]'; prefix = '-';
          } else if (t.type === 'to_vault') {
            const vault = vaults.find(v => v.id === t.vaultId);
            title = vault ? vault.name : 'Hucha'; icon = '→'; amountColor = 'text-[#ef4444]'; prefix = '-';
          } else if (t.type === 'from_vault') {
            const vault = vaults.find(v => v.id === t.vaultId);
            title = vault ? vault.name : 'Hucha'; icon = '←'; amountColor = 'text-[#10b981]'; prefix = '+';
          }

          return (
            <div key={i} className="flex justify-between items-center py-4 border-b border-[#2d2d2d] last:border-0">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="text-base">{icon}</span> {title}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 capitalize">{dateStr}</p>
                </div>
              </div>
              <p className={`font-bold ${amountColor}`}>
                {prefix}{t.amount.toFixed(2)}€
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
