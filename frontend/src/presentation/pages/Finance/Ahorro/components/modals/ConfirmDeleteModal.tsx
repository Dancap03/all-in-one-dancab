import { X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
}

export const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false,
  title = "Eliminar",
  message = "¿Estás seguro? Esta acción no se puede deshacer."
}: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#151515] border border-[#2d2d2d] rounded-xl w-full max-w-xs p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
        
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-[#2d2d2d] hover:bg-[#252525]">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
            ) : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
