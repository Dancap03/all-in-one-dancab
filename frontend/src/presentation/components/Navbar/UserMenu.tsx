import { USER_MENU_ITEMS } from './constants';

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const UserMenu = ({ isOpen, onToggle }: UserMenuProps) => {
  return (
    <div className="relative">
      <button onClick={onToggle} className="flex items-center gap-2 focus:outline-none">
        <img 
          src="/default-avatar.png" 
          alt="Usuario" 
          className="w-8 h-8 rounded-full border border-gray-600 hover:border-gray-400 transition-colors"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-4 right-0 w-48 bg-[#1e1e1e] border border-gray-800 rounded-md shadow-xl py-2 z-50">
          {USER_MENU_ITEMS.map((item) => (
            <button key={item.id} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
