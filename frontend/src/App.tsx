import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';
import { Login } from './presentation/pages/Login/Login';
import { Navbar } from './presentation/components/Navbar/Navbar';

const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
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

  if (loading) return <div className="min-h-screen bg-[#0c0c0c]" />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Rutas Protegidas con Navbar Profesional */}
        <Route path="/*" element={
          <ProtectedRoute user={user}>
            <div className="min-h-screen bg-[#0c0c0c]">
              <Navbar />
              <main className="max-w-7xl mx-auto p-6">
                <header className="mb-8">
                  <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
                  <p className="text-gray-400 text-sm">Bienvenido de nuevo a tu Super-App personal.</p>
                </header>
                
                {/* Aquí irán los Widgets de IA, Finanzas y Salud */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-40 flex items-center justify-center text-gray-500 italic">
                    Esperando datos de Firestore...
                  </div>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}
