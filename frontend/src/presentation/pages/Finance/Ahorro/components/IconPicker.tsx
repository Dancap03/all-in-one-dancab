import { Plane, Car, Home, ShoppingBag, GraduationCap, Laptop, PiggyBank, ShieldCheck, Heart, Coffee, Gift, Wallet, Smartphone, Palmtree, Baby } from 'lucide-react';

// Diccionario de iconos disponibles
export const iconMap = {
  PiggyBank: <PiggyBank size={20} />,
  Plane: <Plane size={20} />,
  Car: <Car size={20} />,
  Home: <Home size={20} />,
  ShoppingBag: <ShoppingBag size={20} />,
  GraduationCap: <GraduationCap size={20} />,
  Laptop: <Laptop size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  Heart: <Heart size={20} />,
  Coffee: <Coffee size={20} />,
  Gift: <Gift size={20} />,
  Wallet: <Wallet size={20} />,
  Smartphone: <Smartphone size={20} />,
  Palmtree: <Palmtree size={20} />,
  Baby: <Baby size={20} />
};

interface Props {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const IconPicker = ({ selectedIcon, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-5 gap-2 mt-2">
      {Object.keys(iconMap).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            selectedIcon === key 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
              : 'bg-[#1c1c1e] text-gray-400 border border-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-white'
          }`}
        >
          {iconMap[key as keyof typeof iconMap]}
        </button>
      ))}
    </div>
  );
};
