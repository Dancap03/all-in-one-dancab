import { Pencil, Trash2 } from 'lucide-react';

interface VaultsListProps {
  vaults: any[];
  vaultBalances: Record<string, number>;
  onEditVault: (vault: any) => void; 
  onDeleteVault: (vaultId: string) => void;
}

export const VaultsList = ({ vaults, vaultBalances, onEditVault, onDeleteVault }: VaultsListProps) => {
  if (vaults.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {vaults.map((vault) => (
        <div key={vault.id} className="bg-[#151515] border border-[#2d2d2d] rounded-xl p-5 shadow-sm group">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: vault.color }}></span>
              <h3 className="font-bold text-white">{vault.name}</h3>
            </div>
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEditVault(vault)} className="text-gray-500 hover:text-white transition-colors"><Pencil size={14}/></button>
              <button onClick={() => onDeleteVault(vault.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: vault.color }}>
            {(vaultBalances[vault.id] || 0).toFixed(2)}€
          </p>
        </div>
      ))}
    </div>
  );
};
