import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';

// Importación de Páginas y Componentes
import { Login } from './presentation/pages/Login/Login';
import { Navbar } from './presentation/components/Navbar/Navbar';
import { Home } from './presentation/pages/Home/Home';
import { DiaDia } from './presentation/pages/Finance/DiaaDia/DiaaDia';
import { Patrimonio } from './presentation/pages/Finance/Patrimonio/Patrimonio';
import { Ahorro } from './presentation/pages/Finance/Ahorro/Ahorro';
import { Inversion } from './presentation/pages/Finance/Inversion/Inversion';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar el estado de sesión de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Spinner de carga inicial
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
        {/* Ruta Pública */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Ecosistema Privado */}
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <div className="min-h-screen bg-[#0c0c0c]">
                {/* Navbar persistente y centrado */}
                <Navbar />
                
                <main className="max-w-7xl mx-auto p-4 md:p-6">
                  <Routes>
                    {/* HOME: Ahora es la página inicial al pulsar el logo o entrar */}
                    <Route path="/" element={<Home />} />
                    
                    {/* FINANZAS: Cada sección en su ruta específica */}
                    <Route path="/finance/diadia" element={<DiaDia />} />
                    <Route path="/finance/patrimonio" element={<Patrimonio />} />
                    <Route path="/finance/ahorro" element={<Ahorro />} />
                    <Route path="/finance/inversion" element={<Inversion />} />

                    {/* SECCIONES ADICIONALES (Placeholders) */}
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

                    {/* Redirección por defecto para rutas no encontradas */}
                    <Route path="*" element={<Navigate to="/" replace />} />
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
