import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Wallet, Heart } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isFinanceActive = location.pathname.startsWith('/finance');

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home, active: isActive('/') },
    { label: 'Calendario', path: '/calendar', icon: Calendar, active: isActive('/calendar') },
    { label: 'Finanzas', path: '/finance/patrimonio', icon: Wallet, active: isFinanceActive },
    { label: 'Salud', path: '/health', icon: Heart, active: isActive('/health') },
  ];

  return (
    <>
      {/* NAVBAR SUPERIOR */}
      <header className="w-full bg-[#121212] border-b border-[#2d2d2d] sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center">
        <Link to="/" className="text-white font-black text-lg tracking-wider select-none">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">ALLINONE</span>
        </Link>

        {/* Menú unificado central: 4 Pilares limpios */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  item.active 
                    ? 'bg-[#1e1e1e] text-white' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon size={16} className={item.active ? 'text-blue-400' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Lado derecho vacío: Sin buscar, import, campana ni mejorar */}
        <div className="hidden md:block w-24"></div>

        {/* Cabecera para pantallas móviles */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3d3d3d] flex items-center justify-center text-xs text-gray-300 font-bold">
              D
            </div>
            <span className="text-white font-bold text-base">Finanzas</span>
          </div>
        </div>
      </header>

      {/* NAVBAR INFERIOR (Fijo en Móviles) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-[#2d2d2d] z-50 px-4 py-2.5 flex justify-around items-center shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                item.active ? 'text-white font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${item.active ? 'bg-[#1e1e1e] text-blue-400' : 'text-gray-500'}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};
