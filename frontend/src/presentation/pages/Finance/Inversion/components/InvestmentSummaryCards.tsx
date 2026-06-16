import { useState, useEffect } from 'react';
import { Globe, BarChart3, Briefcase, Plus } from 'lucide-react';

export const InvestmentSummaryCards = () => {
  // ==========================================
  // 1. ESTADOS DE BALANCE Y DISPONIBLES (PERSISTENTES)
  // ==========================================
  const [disponibleGlobal, setDisponibleGlobal] = useState<number>(() => {
    const saved = localStorage.getItem('aio_inv_disponible_global');
    return saved ? Number(saved) : 1250.00; // Capital inicial de ejemplo
  });

  const [disponibleBolsa, setDisponibleBolsa] = useState<number>(() => {
    const saved = localStorage.getItem('aio_inv_disponible_bolsa');
    return saved ? Number(saved) : 0.00;
  });

  const [disponibleProyectos, setDisponibleProyectos] = useState<number>(() => {
    const saved = localStorage.getItem('aio_inv_disponible_proyectos');
    return saved ? Number(saved) : 0.00;
  });

  // Estados locales para los campos de entrada de texto (Inputs)
  const [montoEnviar, setMontoEnviar] = useState('');
  const [montoAddBolsa, setMontoAddBolsa] = useState('');
  const [montoAddProyectos, setMontoAddProyectos] = useState('');

  // Estados para métricas dinámicas de inversión de fondos
  const [globalTotalInvertido, setGlobalTotalInvertido] = useState(0);
  const [bolsaInvertidoPropio, setBolsaInvertidoPropio] = useState(0);
  const [proyectosInvertido, setProyectosInvertido] = useState(0);

  useEffect(() => {
    // Lectura reactiva de datos reales guardados por la aplicación
    const totalInvertido = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
    setGlobalTotalInvertido(totalInvertido);

    const savedPositions = localStorage.getItem('aio_positions_v2');
    const positions = savedPositions ? JSON.parse(savedPositions) : [];
    const bolsaInvertido = positions.reduce((sum: number, p: any) => sum + (p.total || 0), 0);
    setBolsaInvertidoPropio(bolsaInvertido);

    const savedProyInvertido = localStorage.getItem('aio_proyectos_invertido_v2');
    setProyectosInvertido(savedProyInvertido ? Number(savedProyInvertido) : 0);
  }, []);

  // Acción: Enviar fondos desde el Balance Global
  const handleEnviarGlobal = (destino: 'diadia' | 'bolsa' | 'proyecto') => {
    const valor = Number(montoEnviar);
    if (!valor || valor <= 0 || valor > disponibleGlobal) {
      alert("Introduce un importe válido que no supere el Disponible Global.");
      return;
    }

    const nuevoGlobal = disponibleGlobal - valor;
    setDisponibleGlobal(nuevoGlobal);
    localStorage.setItem('aio_inv_disponible_global', nuevoGlobal.toString());

    if (destino === 'bolsa') {
      const nuevoBolsa = disponibleBolsa + valor;
      setDisponibleBolsa(nuevoBolsa);
      localStorage.setItem('aio_inv_disponible_bolsa', nuevoBolsa.toString());
    } else if (destino === 'proyecto') {
      const nuevoProy = disponibleProyectos + valor;
      setDisponibleProyectos(nuevoProy);
      localStorage.setItem('aio_inv_disponible_proyectos', nuevoProy.toString());
    } else if (destino === 'diadia') {
      const currentDiaDia = Number(localStorage.getItem('aio_total_invertido_diadia_v2') || 0);
      const updatedInvertido = Math.max(0, currentDiaDia - valor);
      localStorage.setItem('aio_total_invertido_diadia_v2', updatedInvertido.toString());
      setGlobalTotalInvertido(updatedInvertido);
      alert(`Traspasados ${valor}€ con éxito al Disponible de tu cuenta del Día a Día.`);
    }

    setMontoEnviar('');
  };

  // Acción: Añadir fondos directos al Disponible de Bolsa
  const handleAddBolsaDirecto = () => {
    const valor = Number(montoAddBolsa);
    if (!valor || valor <= 0) return;
    const nuevoBolsa = disponibleBolsa + valor;
    setDisponibleBolsa(nuevoBolsa);
    localStorage.setItem('aio_inv_disponible_bolsa', nuevoBolsa.toString());
    setMontoAddBolsa('');
  };

  // Acción: Añadir fondos directos al Disponible de Proyectos Personales
  const handleAddProyectosDirecto = () => {
    const valor = Number(montoAddProyectos);
    if (!valor || valor <= 0) return;
    const nuevoProy = disponibleProyectos + valor;
    setDisponibleProyectos(nuevoProy);
    localStorage.setItem('aio_inv_disponible_proyectos', nuevoProy.toString());
    setMontoAddProyectos('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* BLOQUE 1: BALANCE GLOBAL */}
      <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">Disponible</span>
            <span className="text-base font-black text-white">{disponibleGlobal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Total Invertido</span>
            <span className="text-base font-black text-gray-400">{globalTotalInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <Globe size={11} className="text-emerald-400" /> Enviar Capital
            </span>
            <input 
              type="number" 
              placeholder="0.00 €" 
              value={montoEnviar} 
              onChange={(e) => setMontoEnviar(e.target.value)}
              className="w-20 bg-transparent text-right font-bold text-xs text-white outline-none border-b border-gray-700 focus:border-emerald-400 pb-0.5"
            />
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button onClick={() => handleEnviarGlobal('diadia')} className="bg-[#222] hover:bg-[#2e2e30] text-[9px] font-black uppercase py-1.5 rounded transition-colors cursor-pointer text-gray-300">Día a Día</button>
            <button onClick={() => handleEnviarGlobal('bolsa')} className="bg-[#222] hover:bg-blue-950/40 border border-transparent hover:border-blue-500/30 text-[9px] font-black uppercase py-1.5 rounded transition-colors cursor-pointer text-blue-400">A Bolsa</button>
            <button onClick={() => handleEnviarGlobal('proyecto')} className="bg-[#222] hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 text-[9px] font-black uppercase py-1.5 rounded transition-colors cursor-pointer text-purple-400">A Proy.</button>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: INVERSIÓN EN BOLSA */}
      <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Disponible</span>
            <span className="text-base font-black text-white">{disponibleBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Invertido Bolsa</span>
            <span className="text-base font-black text-gray-400">{bolsaInvertidoPropio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl flex items-center justify-between mt-2">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
            <BarChart3 size={11} className="text-blue-400" /> Añadir a Bolsa
          </span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="0.00 €" 
              value={montoAddBolsa}
              onChange={(e) => setMontoAddBolsa(e.target.value)}
              className="w-16 bg-transparent text-right font-bold text-xs text-white outline-none border-b border-gray-700 focus:border-blue-500 pb-0.5"
            />
            <button onClick={handleAddBolsaDirecto} className="p-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded transition-all cursor-pointer">
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: PROYECTOS PERSONALES */}
      <div className="space-y-3 bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">Disponible</span>
            <span className="text-base font-black text-white">{disponibleProyectos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Dinero Invertido</span>
            <span className="text-base font-black text-gray-400">{proyectosInvertido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>

        <div className="bg-[#1b1b1d] border border-[#262628] p-3 rounded-xl flex items-center justify-between mt-2">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
            <Briefcase size={11} className="text-purple-400" /> Añadir a Proy.
          </span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="0.00 €" 
              value={montoAddProyectos}
              onChange={(e) => setMontoAddProyectos(e.target.value)}
              className="w-16 bg-transparent text-right font-bold text-xs text-white outline-none border-b border-gray-700 focus:border-purple-500 pb-0.5"
            />
            <button onClick={handleAddProyectosDirecto} className="p-1 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded transition-all cursor-pointer">
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
