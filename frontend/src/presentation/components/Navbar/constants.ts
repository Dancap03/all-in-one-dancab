import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  User, 
  Settings, 
  LogOut, 
  BarChart3, 
  Wallet, 
  PiggyBank, 
  Layers 
} from 'lucide-react';

export const NAV_ITEMS = [ 
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Finanzas', icon: TrendingUp, href: '/finance' },
  { label: 'Salud', icon: Heart, href: '/health' },
];

// Definición de las cuatro áreas clave de tu ecosistema financiero
export const FINANCE_MENU_ITEMS = [
  { label: 'Patrimonio', icon: Layers, href: '/finance/patrimonio' },    // Visión global (ETFs, Crypto, Cash)
  { label: 'Día a Día', icon: Wallet, href: '/finance/diadia' },        // Gastos corrientes y flujo de caja
  { label: 'Ahorro', icon: PiggyBank, href: '/finance/ahorro' },        // Fondos de emergencia y objetivos
  { label: 'Inversión', icon: BarChart3, href: '/finance/inversion' },  // Estrategias de trading y staking
];

export const USER_MENU_ITEMS = [
  { label: 'Perfil', icon: User, href: '/profile' },
  { label: 'Configuración', icon: Settings, href: '/settings' },
  { label: 'Cerrar Sesión', icon: LogOut, href: '/logout' },
];
