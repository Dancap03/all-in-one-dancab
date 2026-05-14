import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  User, 
  Settings, 
  LogOut, 
  BarChart2, 
  PieChart, 
  Wallet 
} from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Finanzas', icon: TrendingUp, href: '/finance' },
  { label: 'Salud', icon: Heart, href: '/health' },
];

// Este es el que faltaba y causaba el error TS2305
export const FINANCE_MENU_ITEMS = [
  { label: 'Inversiones', icon: BarChart2, href: '/finance/investments' },
  { label: 'Patrimonio', icon: PieChart, href: '/finance/wealth' },
  { label: 'Cripto', icon: Wallet, href: '/finance/crypto' },
];

export const USER_MENU_ITEMS = [
  { label: 'Perfil', icon: User, href: '/profile' },
  { label: 'Configuración', icon: Settings, href: '/settings' },
  { label: 'Cerrar Sesión', icon: LogOut, href: '/logout' },
];
