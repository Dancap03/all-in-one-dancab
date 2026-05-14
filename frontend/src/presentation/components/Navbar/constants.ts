import { ChartLine, PieChart, Activity, DollarSign, Briefcase } from 'lucide-react'; // Iconos

export const FINANCE_MENU_ITEMS = [
  { id: 'net-worth', label: 'Patrimonio Neto', icon: ChartLine, path: '/finanzas/patrimonio' },
  { id: 'investments', label: 'Inversiones', icon: PieChart, path: '/finanzas/inversiones' },
  { id: 'cash-flow', label: 'Flujo De Caja', icon: Activity, path: '/finanzas/flujo' },
  { id: 'cash-balance', label: 'Saldo De Caja', icon: DollarSign, path: '/finanzas/saldo' },
  { id: 'liabilities', label: 'Pasivo', icon: Briefcase, path: '/finanzas/pasivo' },
];

export const USER_MENU_ITEMS = [
  { id: 'logout', label: 'Log out' },
  { id: 'dark-mode', label: 'Modo oscuro' },
  { id: 'profile', label: 'Mostrar perfil' },
  { id: 'settings', label: 'Settings' },
];
