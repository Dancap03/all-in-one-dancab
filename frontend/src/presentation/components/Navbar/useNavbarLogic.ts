import { useState } from 'react';

type DropdownState = 'finance' | 'user' | null;

export const useNavbarLogic = () => {
  const [activeDropdown, setActiveDropdown] = useState<DropdownState>(null);

  const toggleDropdown = (menuName: DropdownState) => {
    setActiveDropdown((prev) => (prev === menuName ? null : menuName));
  };

  const closeAll = () => setActiveDropdown(null);

  return {
    activeDropdown,
    toggleDropdown,
    closeAll,
  };
};
