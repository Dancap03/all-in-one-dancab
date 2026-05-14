import { User } from 'lucide-react';
import { USER_MENU_ITEMS } from './constants';

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const UserMenu = ({ isOpen, onToggle }: UserMenuProps) => {
  return (
    <div className="relative">
      <button 
        onClick={onToggle}
        className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600 transition-colors border border-gray-600"
      >
        <User size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2d2d2d] rounded-md shadow-lg py-1 z-50">
          {USER_MENU_ITEMS.map((item) => (
            <a
              key={item.label} // Antes decía item.id, por eso fallaba
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#a3a3a3] hover:bg-[#2d2d2d] hover:text-white transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
