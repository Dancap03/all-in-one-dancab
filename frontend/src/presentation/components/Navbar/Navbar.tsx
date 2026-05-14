import { Link } from 'react-router-dom';
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
      
      {/* LADO IZQUIERDO */}
      <div className="flex-1 flex justify-start">
        <NavLogo />
      </div>
      
      {/* CENTRO: Menú centrado */}
      <div className="hidden md:flex flex-none items-center justify-center gap-8">
        {NAV_ITEMS.map((item) => {
          // El desplegable de Finanzas ya lo gestiona su propio componente
          if (item.label === 'Finanzas') {
            return (
              <FinanceDropdown 
                key={item.label} 
                isOpen={isFinanceOpen} 
                onToggle={toggleFinance} 
              />
            );
          }
          
          // Uso de <Link> en lugar de <a> para evitar recargas y errores 404
          return (
            <Link 
              key={item.label} 
              to={item.href} 
              className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* LADO DERECHO */}
      <div className="flex-1 flex justify-end">
        <UserMenu isOpen={isUserMenuOpen} onToggle={toggleUserMenu} />
      </div>

    </nav>
  );
};
