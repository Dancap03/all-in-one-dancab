interface Props {
  patrimonioTotal: number;
  liquidez: number;
  ahorro: number;
  inversion: number;
}

export const PatrimonioSummaryCard = ({ patrimonioTotal, liquidez, ahorro, inversion }: Props) => {
  return (
    <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <p className="text-gray-400 font-medium mb-1">Patrimonio total</p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-5xl font-black text-white">{patrimonioTotal.toLocaleString('es-ES')} €</span>
      </div>
      <p className="text-[#10b981] font-bold text-sm mb-6 flex items-center gap-1">
        Flujo de saldos basado en datos locales
      </p>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
          <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Liquidez</p>
          <p className="text-emerald-400 font-bold text-sm sm:text-lg">{liquidez.toLocaleString('es-ES')} €</p>
        </div>
        <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
          <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Ahorro</p>
          <p className="text-indigo-400 font-bold text-sm sm:text-lg">{ahorro.toLocaleString('es-ES')} €</p>
        </div>
        <div className="bg-[#1a1a1c] border border-[#2d2d2d]/50 p-3 sm:p-4 rounded-xl">
          <p className="text-gray-400 text-[11px] sm:text-xs font-medium mb-1">Inversión</p>
          <p className="text-orange-400 font-bold text-sm sm:text-lg">{inversion.toLocaleString('es-ES')} €</p>
        </div>
      </div>
    </div>
  );
};
