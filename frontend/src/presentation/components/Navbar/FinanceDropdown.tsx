import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom'; // Importante
import { FINANCE_MENU_ITEMS } from './constants';

interface FinanceDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FinanceDropdown = ({ isOpen, onToggle }: FinanceDropdownProps) => {
  return (
    <div className="relative">
      <button 
        onClick={onToggle}
        className="flex items-center gap-1 text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium"
      >
        <span>Finanzas</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2d2d2d] rounded-md shadow-lg py-1 z-50">
          {FINANCE_MENU_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.href} // Cambiado de href a to
              onClick={onToggle}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#a3a3a3] hover:bg-[#2d2d2d] hover:text-white transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
