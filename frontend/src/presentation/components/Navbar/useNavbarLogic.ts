import { useState } from 'react';
import { auth } from '../../../infrastructure/firebase/config';

export const useNavbarLogic = () => {
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleFinance = () => setIsFinanceOpen(!isFinanceOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen); 

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return {
    isFinanceOpen,
    isUserMenuOpen,
    toggleFinance,
    toggleUserMenu,
    handleLogout
  };
};
