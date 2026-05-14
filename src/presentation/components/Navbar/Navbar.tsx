import { Calendar, Heart } from 'lucide-react';
import { NavLogo } from './NavLogo';
import { FinanceDropdown } from './FinanceDropdown';
import { UserMenu } from './UserMenu';
import { useNavbarLogic } from './useNavbarLogic';

export const Navbar = () => {
  // Inyección de dependencias: El componente consume la lógica, no la define.
  const { activeDropdown, toggleDropdown } = useNavbarLogic();

  return (
    <nav className="w-full bg-[#121212] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      {/* Zona Izquierda: Logo */}
      <NavLogo />

      {/* Zona Central: Enlaces de Navegación Principales */}
      <div className="hidden md:flex items-center gap-8">
        <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <Calendar size={18} />
          <span>Calendario</span>
        </button>

        <FinanceDropdown 
          isOpen={activeDropdown === 'finance'} 
          onToggle={() => toggleDropdown('finance')} 
        />

        <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <Heart size={18} />
          <span>Salud</span>
        </button>
      </div>

      {/* Zona Derecha: Usuario */}
      <UserMenu 
        isOpen={activeDropdown === 'user'} 
        onToggle={() => toggleDropdown('user')} 
      />
    </nav>
  );
};
