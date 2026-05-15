interface Venta {
  id: string;
  name: string;
  ticker: string;
  fecha: string;
  detalles: string;
  totalVenta: number;
  plVal: string;
  plPerc: string;
  pos: boolean;
  color: string;
}

interface VentasTableProps {
  ventas: Venta[];
}

export const VentasTable = ({ ventas }: VentasTableProps) => {
  if (!ventas || ventas.length === 0) return null;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl overflow-hidden shadow-sm mt-6">
      <div className="p-6 border-b border-[#2d2d2d]">
        <h3 className="font-bold text-white">Ventas Realizadas</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#1a1a1a] text-gray-400 text-xs">
            <tr>
              <th className="px-6 py-4 font-normal">Título ↑</th>
              <th className="px-6 py-4 font-normal text-right">Fecha ↓</th>
              <th className="px-6 py-4 font-normal text-right">Detalles</th>
              <th className="px-6 py-4 font-normal text-right">Total Venta</th>
              <th className="px-6 py-4 font-normal text-right">Beneficio (P/L)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d]">
            {ventas.map((item, index) => (
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
                  {item.fecha}
                </td>
                <td className="px-6 py-4 text-right text-gray-400">
                  {item.detalles}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-white font-medium">{item.totalVenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
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
