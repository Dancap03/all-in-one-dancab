import { NavLogo } from './NavLogo';
import { FinanceDropdown } from './FinanceDropdown';
import { UserMenu } from './UserMenu';
import { NAV_ITEMS } from './constants';
import { useNavbarLogic } from './useNavbarLogic';

export const Navbar = () => {
  // Ahora traemos las variables correctas del controlador
  const { 
    isFinanceOpen, 
    isUserMenuOpen, 
    toggleFinance, 
    toggleUserMenu 
  } = useNavbarLogic();

  return (
    <nav className="bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <NavLogo />
        
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            // Si es el botón de Finanzas, renderizamos nuestro Dropdown especial
            if (item.label === 'Finanzas') {
              return (
                <FinanceDropdown 
                  key={item.label} 
                  isOpen={isFinanceOpen} 
                  onToggle={toggleFinance} 
                />
              );
            }
            
            // Para el resto (Calendario, Salud...), renderizamos enlaces normales
            return (
              <a 
                key={item.label} 
                href={item.href} 
                className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Renderizamos el menú de usuario con sus variables correctas */}
        <UserMenu isOpen={isUserMenuOpen} onToggle={toggleUserMenu} />
      </div>
    </nav>
  );
};
