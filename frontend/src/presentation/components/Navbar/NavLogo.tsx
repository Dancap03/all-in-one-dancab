import { Link } from 'react-router-dom';

export const NavLogo = () => {
  return (
    <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
      <span className="text-white font-bold text-xl tracking-tight">
        AllInOne
      </span>
    </Link>
  );
};
