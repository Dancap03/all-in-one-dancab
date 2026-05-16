import { PositionsTable } from '../PositionsTable';
import { VentasTable } from '../VentasTable';
import { TransaccionesList } from '../TransaccionesList';

interface PosicionesTabProps {
  currentPositions: any[];
  currentVentas: any[];
  currentTransacciones: any[];
  onAddTransaction: () => void;
}

export const PosicionesTab = ({ currentPositions, currentVentas, currentTransacciones, onAddTransaction }: PosicionesTabProps) => {
  return (
    <div className="flex flex-col pb-10">
      <PositionsTable posiciones={currentPositions} onAddTransaction={onAddTransaction} />
      <VentasTable ventas={currentVentas} />
      <TransaccionesList transacciones={currentTransacciones} mesLabel="mayo 2026" onAddTransaction={onAddTransaction} />
    </div>
  );
};
