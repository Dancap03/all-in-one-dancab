import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './infrastructure/firebase/config';
import { Navbar } from './presentation/components/Navbar/Navbar';
import { Login } from './presentation/pages/Login/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="bg-[#0c0c0c] min-h-screen" />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/*" element={
          !user ? <Navigate to="/login" /> : (
            <div className="min-h-screen bg-[#0c0c0c]">
              <Navbar />
              <main className="p-6">
                <h1 className="text-xl text-white font-semibold">Dashboard Principal</h1>
              </main>
            </div>
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}
