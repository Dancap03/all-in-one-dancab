import { ChevronDown, LineChart } from 'lucide-react';
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
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
      >
        <LineChart size={18} />
        <span>Finanzas</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-4 left-0 w-56 bg-[#1e1e1e] border border-gray-800 rounded-md shadow-xl py-2 z-50">
          {FINANCE_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
