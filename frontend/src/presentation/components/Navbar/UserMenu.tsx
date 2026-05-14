import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { USER_MENU_ITEMS } from './constants';
import { auth } from '../../../infrastructure/firebase/config';

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const UserMenu = ({ isOpen, onToggle }: UserMenuProps) => {
  // Lógica para cerrar la sesión en Firebase
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="relative">
      {/* Botón del avatar / usuario */}
      <button 
        onClick={onToggle}
        className="w-8 h-8 rounded-full bg-[#2d2d2d] flex items-center justify-center text-gray-300 hover:bg-[#3d3d3d] transition-colors border border-[#3d3d3d]"
      >
        <User size={18} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2d2d2d] rounded-md shadow-lg py-1 z-50">
          {USER_MENU_ITEMS.map((item) => {
            // Caso especial: Botón de Cerrar Sesión
            if (item.label === 'Cerrar Sesión') {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    handleLogout();
                    onToggle();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-[#2d2d2d] transition-colors"
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              );
            }

            // Enlaces de navegación (Perfil, Configuración, etc.)
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onToggle}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#a3a3a3] hover:bg-[#2d2d2d] hover:text-white transition-colors"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
