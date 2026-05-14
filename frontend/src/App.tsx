import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';
import { Login } from './presentation/pages/Login/Login';

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
        <Route path="/*" element={
          <ProtectedRoute user={user}>
            <div className="min-h-screen bg-[#0c0c0c] text-white p-10">
              <h1 className="text-3xl font-bold">Bienvenido, {user?.email}</h1>
              <p className="mt-4 text-gray-400">Dashboard AllInOne publicado vía GitHub Actions.</p>
              <button onClick={() => auth.signOut()} className="mt-6 bg-red-600 px-4 py-2 rounded">Cerrar Sesión</button>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}
