import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, CreditCard, PiggyBank, TrendingUp } from 'lucide-react';

export const FinanceSubNav = () => {
  const location = useLocation();

  const bubbles = [
    { label: 'Resumen', path: '/finance/patrimonio', icon: LayoutGrid },
    { label: 'Día a día', path: '/finance/diadia', icon: CreditCard },
    { label: 'Ahorro', path: '/finance/ahorro', icon: PiggyBank },
    { label: 'Inversión', path: '/finance/inversion', icon: TrendingUp },
  ];

  return (
    <div className="w-full bg-[#0c0c0c] pt-2 pb-4 sticky top-[65px] z-40">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar snap-x">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        
        {bubbles.map((bubble) => {
          const Icon = bubble.icon;
          const isActive = location.pathname === bubble.path;

          return (
            <Link
              key={bubble.label}
              to={bubble.path}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 snap-start border ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                  : 'bg-[#151515] text-gray-400 border-[#2d2d2d] hover:text-gray-200'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
              <span>{bubble.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
