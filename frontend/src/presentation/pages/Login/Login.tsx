import { useLoginLogic } from './useLoginLogic';

export const Login = () => {
  const { email, setEmail, password, setPassword, error, handleEmailLogin, handleGoogleLogin } = useLoginLogic();

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-8">AllInOne Login</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#333333] rounded px-4 py-2 text-white outline-none focus:border-blue-500"
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#333333] rounded px-4 py-2 text-white outline-none focus:border-blue-500"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors">
            Entrar
          </button>
        </form>

        <div className="mt-6 border-t border-[#333333] pt-6">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-2 rounded">
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
};
