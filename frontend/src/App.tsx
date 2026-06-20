import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';

// Importación de Páginas y Componentes
import { Login } from './presentation/pages/Login/Login';
import { Navbar } from './presentation/components/Navbar/Navbar';
import { Home } from './presentation/pages/Home/Home';
import { DiaaDia } from './presentation/pages/Finance/DiaaDia/DiaaDia';
import { Patrimonio } from './presentation/pages/Finance/Patrimonio/Patrimonio';
import { Ahorro } from './presentation/pages/Finance/Ahorro/Ahorro';
import { Inversion } from './presentation/pages/Finance/Inversion/Inversion';
import { Historial } from './presentation/pages/Finance/Historial/Historial'; // <-- IMPORTACIÓN CLAVE AÑADIDA

import { FinanceSubNav } from './presentation/components/FinanceSubNav/FinanceSubNav';

const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const MainWorkspace = ({ user }: { user: User | null }) => {
  const location = useLocation();
  // El Historial no tiene sub-menú, así que solo mostramos el subnav en las 4 principales
  const isFinanceMainPage = ['/finance/patrimonio', '/finance/diadia', '/finance/ahorro', '/finance/inversion'].includes(location.pathname);

  return (
    <ProtectedRoute user={user}>
      <div className="min-h-screen bg-[#0c0c0c]">
        <Navbar />
        
        <main className="max-w-7xl mx-auto p-4 md:p-6">
          {isFinanceMainPage && <FinanceSubNav />}

          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route path="/finance/diadia" element={<DiaaDia />} />
            <Route path="/finance/patrimonio" element={<Patrimonio />} />
            <Route path="/finance/ahorro" element={<Ahorro />} />
            <Route path="/finance/inversion" element={<Inversion />} />
            <Route path="/finance/historial" element={<Historial />} /> {/* <-- RUTA CLAVE AÑADIDA */}

            <Route path="/calendar" element={<div className="text-white p-10 text-center opacity-50 italic">Sección de Calendario en desarrollo...</div>} />
            <Route path="/health" element={<div className="text-white p-10 text-center opacity-50 italic">Sección de Salud en desarrollo...</div>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={<MainWorkspace user={user} />} />
      </Routes>
    </HashRouter>
  );
}
