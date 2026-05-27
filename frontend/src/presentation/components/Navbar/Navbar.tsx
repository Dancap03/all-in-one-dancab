import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Wallet, CreditCard, PiggyBank, BarChart3, Heart } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isFinanceActive = location.pathname.startsWith('/finance');

  // 1. LISTA COMPLETA PARA ESCRITORIO (Mantiene todos tus accesos de finanzas)
  const desktopNavItems = [
    { label: 'Inicio', path: '/', icon: Home, active: isActive('/') },
    { label: 'Calendario', path: '/calendar', icon: Calendar, active: isActive('/calendar') },
    { label: 'Patrimonio', path: '/finance/patrimonio', icon: Wallet, active: isActive('/finance/patrimonio') },
    { label: 'Día a Día', path: '/finance/diadia', icon: CreditCard, active: isActive('/finance/diadia') },
    { label: 'Ahorro', path: '/finance/ahorro', icon: PiggyBank, active: isActive('/finance/ahorro') },
    { label: 'Inversión', path: '/finance/inversion', icon: BarChart3, active: location.pathname.startsWith('/finance/inversion') },
    { label: 'Salud', path: '/health', icon: Heart, active: isActive('/health') },
  ];

  // 2. LISTA REDUCIDA PARA MÓVIL (Estilo getquin: 4 botones esenciales)
  const mobileNavItems = [
    { label: 'Inicio', path: '/', icon: Home, active: isActive('/') },
    { label: 'Calendario', path: '/calendar', icon: Calendar, active: isActive('/calendar') },
    { label: 'Finanzas', path: '/finance/patrimonio', icon: Wallet, active: isFinanceActive },
    { label: 'Salud', path: '/health', icon: Heart, active: isActive('/health') },
  ];

  return (
    <>
      {/* NAVBAR SUPERIOR (Escritorio / Tablet) */}
      <header className="w-full bg-[#121212] border-b border-[#2d2d2d] sticky top-0 z-50 px-4 md:px-8 py-3.5 flex justify-between items-center">
        {/* Logo a la izquierda */}
        <Link to="/" className="flex items-center gap-2 text-white font-black text-lg tracking-wider select-none">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">ALLINONE</span>
        </Link>

        {/* Menú central en escritorio: Muestra la lista completa sin recortar nada */}
        <nav className="hidden md:flex items-center gap-1">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
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

        {/* Lado derecho en escritorio: Totalmente vacío, limpio de utilidades */}
        <div className="hidden md:block w-32"></div>

        {/* Vista móvil: Cabecera minimalista limpia sin botones */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3d3d3d] flex items-center justify-center text-xs text-gray-300 font-bold">
              D
            </div>
            <span className="text-white font-bold text-base">Inicio</span>
          </div>
        </div>
      </header>

      {/* NAVBAR INFERIOR (Fijo en móviles - 4 Pilares) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-[#2d2d2d] z-50 px-4 py-2.5 flex justify-around items-center shadow-2xl">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                item.active 
                  ? 'text-white font-bold' 
                  : 'text-gray-500 font-medium'
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
