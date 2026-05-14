import { NavLogo } from './NavLogo';
import { FinanceDropdown } from './FinanceDropdown';
import { UserMenu } from './UserMenu';
import { NAV_ITEMS } from './constants';
import { useNavbarLogic } from './useNavbarLogic';

export const Navbar = () => {
  const { 
    isFinanceOpen, 
    isUserMenuOpen, 
    toggleFinance, 
    toggleUserMenu 
  } = useNavbarLogic();

  return (
    <nav className="bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-3 flex items-center sticky top-0 z-40">
      
      {/* LADO IZQUIERDO: Logo (Ocupa el espacio necesario para empujar el centro) */}
      <div className="flex-1 flex justify-start">
        <NavLogo />
      </div>
      
      {/* CENTRO: Menú de navegación (Totalmente centrado) */}
      <div className="hidden md:flex flex-none items-center justify-center gap-8">
        {NAV_ITEMS.map((item) => {
          if (item.label === 'Finanzas') {
            return (
              <FinanceDropdown 
                key={item.label} 
                isOpen={isFinanceOpen} 
                onToggle={toggleFinance} 
              />
            );
          }
          
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
      
      {/* LADO DERECHO: Menú de Usuario */}
      <div className="flex-1 flex justify-end">
        <UserMenu isOpen={isUserMenuOpen} onToggle={toggleUserMenu} />
      </div>

    </nav>
  );
};
