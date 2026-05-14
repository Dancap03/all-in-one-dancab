import { useLoginLogic } from './useLoginLogic';

export const Login = () => {
  const { email, setEmail, password, setPassword, error, handleEmailLogin, handleGoogleLogin } = useLoginLogic();

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">AllInOne</h2>
          <p className="text-[#a3a3a3] text-sm mt-2">Dashboard Personal Inteligente</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#333333] rounded-md px-4 py-2 text-white focus:border-blue-500 outline-none"
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#333333] rounded-md px-4 py-2 text-white focus:border-blue-500 outline-none"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-all">
            Iniciar Sesión
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#333333]"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1a1a1a] px-2 text-[#a3a3a3]">O</span></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-medium py-2 rounded-md transition-all">
          Continuar con Google
        </button>
        
        {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};
