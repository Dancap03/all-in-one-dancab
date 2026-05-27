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

// Importación de las subcapas de Finanzas e IA
import { FinanceSubNav } from './presentation/components/FinanceSubNav/FinanceSubNav';
import { AiChatDock } from './presentation/components/AiChatDock/AiChatDock';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Sub-workspace para manejar hooks de navegación dentro del contexto del Router
const MainWorkspace = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const isFinancePage = location.pathname.startsWith('/finance');

  return (
    <ProtectedRoute user={user}>
      <div className="min-h-screen bg-[#0c0c0c]">
        {/* Navbar persistente limpio */}
        <Navbar />
        
        <main className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Muestra las burbujas superiores solo en el módulo de finanzas */}
          {isFinancePage && <FinanceSubNav />}

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/finance/diadia" element={<DiaaDia />} />
            <Route path="/finance/patrimonio" element={<Patrimonio />} />
            <Route path="/finance/ahorro" element={<Ahorro />} />
            <Route path="/finance/inversion" element={<Inversion />} />

            <Route path="/calendar" element={
              <div className="text-white p-10 text-center opacity-50 italic">
                Sección de Calendario en desarrollo...
              </div>
            } />
            <Route path="/health" element={
              <div className="text-white p-10 text-center opacity-50 italic">
                Sección de Salud en desarrollo...
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* El dock flotante del agente te acompaña en la zona inferior de finanzas */}
        {isFinancePage && <AiChatDock />}
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
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route path="/*" element={<MainWorkspace user={user} />} />
      </Routes>
    </HashRouter>
  );
}
