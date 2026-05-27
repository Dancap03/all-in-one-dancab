import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Wallet, Heart, Search, PlusCircle, Bell, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  // Rutas activas para iluminar los botones correctos
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
      {/* 1. NAVBAR SUPERIOR (Para pantallas de ordenador/tablet) */}
      <header className="w-full bg-[#121212] border-b border-[#2d2d2d] sticky top-0 z-50 px-4 md:px-8 py-3.5 flex justify-between items-center">
        {/* Identificador / Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-black text-lg tracking-wider">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">ALLINONE</span>
        </Link>

        {/* Menú Central: Visible en escritorio, oculto en móvil */}
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

        {/* Botones de acción de la derecha: OCULTOS EN MÓVIL (hidden md:flex) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Buscar */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors cursor-pointer">
            <Search size={18} />
          </button>

          {/* Importar */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] hover:border-[#444] rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer">
            <PlusCircle size={14} />
            <span>Import</span>
          </button>

          {/* Campana */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors relative cursor-pointer">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          {/* Mejorar Premium */}
          <button className="bg-white hover:bg-gray-200 text-black text-xs font-extrabold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Sparkles size={14} className="fill-black" />
            <span>Mejorar</span>
          </button>
        </div>

        {/* Pequeña barra superior para móvil que solo muestra tu perfil/título, libre de botones molestos */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3d3d3d] flex items-center justify-center text-xs text-gray-300 font-bold">
              U
            </div>
            <span className="text-white font-bold text-base">Dashboard</span>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE NAVEGACIÓN INFERIOR (Fija en móviles, idéntica a tu captura) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-[#2d2d2d] z-50 px-4 py-2.5 flex justify-around items-center shadow-2xl">
        {navItems.map((item) => {
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
