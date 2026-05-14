import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';

// Importación de Páginas
import { Login } from './presentation/pages/Login/Login';
import { Navbar } from './presentation/components/Navbar/Navbar';
import { DiaDia } from './presentation/pages/finance/diadia/DiaDia';
import { Patrimonio } from './presentation/pages/finance/patrimonio/Patrimonio';
import { Ahorro } from './presentation/pages/finance/ahorro/Ahorro';
import { Inversion } from './presentation/pages/finance/inversion/Inversion';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Pantalla de carga mientras Firebase verifica la sesión
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
        {/* Ruta Pública: Login */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/finance/diadia" replace /> : <Login />} 
        />

        {/* Rutas Privadas: Requieren usuario logueado */}
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <div className="min-h-screen bg-[#0c0c0c]">
                {/* El Navbar es persistente en todas las rutas privadas */}
                <Navbar />
                
                {/* Contenedor principal de contenido */}
                <main className="max-w-7xl mx-auto p-4 md:p-6">
                  <Routes>
                    {/* Redirección por defecto al entrar */}
                    <Route path="/" element={<Navigate to="/finance/diadia" replace />} />
                    
                    {/* Secciones de Finanzas */}
                    <Route path="/finance/patrimonio" element={<Patrimonio />} />
                    <Route path="/finance/diadia" element={<DiaDia />} />
                    <Route path="/finance/ahorro" element={<Ahorro />} />
                    <Route path="/finance/inversion" element={<Inversion />} />

                    {/* Placeholder para otras secciones (Calendario, Salud) */}
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
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
