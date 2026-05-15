interface Position {
  id: string;
  name: string;
  ticker: string;
  compra: number;
  actual: number;
  total: number;
  plPerc: string;
  plVal: string;
  pos: boolean;
  color: string;
}

interface PositionsTableProps {
  posiciones: Position[];
}

export const PositionsTable = ({ posiciones }: PositionsTableProps) => {
  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl overflow-hidden shadow-sm">
      <div className="flex justify-between items-center p-6 border-b border-[#2d2d2d]">
        <h3 className="font-bold text-white">Posiciones</h3>
        <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm px-4 py-2 rounded-lg border border-[#2d2d2d] transition-colors">
          + Agregar transacción
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#1a1a1a] text-gray-400 text-xs">
            <tr>
              <th className="px-6 py-4 font-normal cursor-pointer hover:text-white">Título ↑</th>
              <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">Compra ↑</th>
              <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">Posición ↓</th>
              <th className="px-6 py-4 font-normal text-right cursor-pointer hover:text-white">P/L ↕</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d]">
            {posiciones.map((item, index) => (
              <tr key={index} className="hover:bg-[#1a1a1a] transition-colors group cursor-pointer">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-inner" style={{ backgroundColor: item.color }}>
                    {item.id}
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-gray-500 text-xs">{item.ticker}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-400">
                  {item.compra.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-white font-medium">{item.actual.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                  <div className="text-gray-500 text-xs">{item.total.toLocaleString('es-ES')} EUR</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`font-medium ${item.pos ? 'text-[#10b981]' : 'text-red-500'}`}>
                    {item.plVal} €
                  </div>
                  <div className={`text-xs mt-0.5 ${item.pos ? 'text-[#10b981]' : 'text-red-500'}`}>
                    {item.pos ? '↑' : '↓'} {item.plPerc}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
