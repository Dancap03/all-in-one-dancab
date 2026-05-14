import { X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isDeleting: boolean;
}

export const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white mb-2">¿Eliminar transacción?</h2>
        <p className="text-gray-400 text-sm mb-8">Esta acción no se puede deshacer.</p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525] transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
