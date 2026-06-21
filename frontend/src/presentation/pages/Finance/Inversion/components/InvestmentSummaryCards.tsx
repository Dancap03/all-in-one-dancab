import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, X } from 'lucide-react';

interface InvestmentSummaryCardsProps {
  disponibleGlobal: number;
  totalInvertido: number;
  bolsaDisponible: number;
  bolsaInvertido: number;
  bolsaGanancias: number;
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onTransferirGlobal: (monto: number, destino: 'bolsa' | 'proyecto' | 'diadia') => void;
  onEjecutarBolsa: (monto: number, tipo: 'propio' | 'ganancia' | 'diadia') => void;
  onEjecutarProyecto: (modo: 'comprar' | 'vender' | 'diadia', coste: number, venta?: number) => void;
  onNavigate: (page: 'global' | 'bolsa' | 'proyecto') => void;
}

export const InvestmentSummaryCards = ({
  disponibleGlobal, totalInvertido, bolsaInvertido, proyectoInvertido,
  onTransferirGlobal, onNavigate
}: InvestmentSummaryCardsProps) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  const handleGlobal = (destino: 'bolsa' | 'proyecto' | 'diadia') => {
    const val = Number(inputAmount);
    if (!val || val <= 0) return;
    if (destino !== 'diadia' && val > disponibleGlobal) return alert('Saldo insuficiente.');
    onTransferirGlobal(val, destino);
    setIsModalOpen(false);
    setInputAmount('');
  };

  // Cálculos para el Donut Chart dinámico
  const total = bolsaInvertido + proyectoInvertido;
  const pctBolsa = total > 0 ? (bolsaInvertido / total) * 100 : 0;
  const pctProyectos = total > 0 ? (proyectoInvertido / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 mb-8">
      
      {/* 1. TARJETA PRINCIPAL (Cartera Total) */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-gray-400 font-medium text-sm mb-1">Cartera total</p>
            <h2 className="text-4xl font-black text-white tracking-tight">{totalInvertido.toLocaleString('es-ES')} €</h2>
            {/* Como aún no tenemos base de datos histórica de rentabilidad, pongo un placeholder estético o se puede dejar calculable a futuro */}
            <p className="text-emerald-400 text-sm font-bold mt-2">
              ↑ +0.0% · +0 € <span className="text-emerald-400/70 font-medium">desde el inicio</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 font-medium text-sm mb-1">Este mes</p>
            <p className="text-emerald-400 font-bold text-lg">+0 €</p>
          </div>
        </div>

        {/* Gráfica SVG Decorativa Naranja */}
        <div className="w-full h-24 mt-6 mb-6">
          <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 80 Q 50 75, 100 70 T 200 65 T 300 40 T 400 30 L 400 100 L 0 100 Z" fill="url(#gradOrange)" />
            <path d="M0 80 Q 50 75, 100 70 T 200 65 T 300 40 T 400 30" fill="none" stroke="#f59e0b" strokeWidth="3" />
          </svg>
        </div>

        {/* Botones / Resumen Inferior */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => onNavigate('bolsa')} 
            className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3 text-left hover:border-amber-500/50 hover:bg-[#222224] transition-all cursor-pointer group"
          >
            <p className="text-gray-500 font-bold text-xs mb-1 group-hover:text-amber-500 transition-colors">Bolsa</p>
            <p className="text-amber-500 font-black text-lg truncate">{bolsaInvertido.toLocaleString('es-ES')} €</p>
          </button>
          
          <button 
            onClick={() => onNavigate('proyecto')} 
            className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3 text-left hover:border-teal-400/50 hover:bg-[#222224] transition-all cursor-pointer group"
          >
            <p className="text-gray-500 font-bold text-xs mb-1 group-hover:text-teal-400 transition-colors">Proyectos</p>
            <p className="text-teal-400 font-black text-lg truncate">{proyectoInvertido.toLocaleString('es-ES')} €</p>
          </button>

          <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl p-3 text-left">
            <p className="text-gray-500 font-bold text-xs mb-1">Rentab. total</p>
            <p className="text-emerald-400 font-black text-lg">0.0%</p>
          </div>
        </div>
      </div>

      {/* 2. TARJETA SALDO DISPONIBLE */}
      <div className="bg-[#1a140a] border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
        <div>
          <p className="text-amber-500 font-bold text-sm mb-1">Saldo disponible para invertir</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-500">{disponibleGlobal.toLocaleString('es-ES')} €</h3>
          </div>
          <p className="text-gray-500 text-xs mt-1 font-medium">Enviado desde Día a día · sin asignar</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-transparent border border-amber-500/30 hover:bg-amber-500/10 text-amber-500 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto shrink-0"
        >
          <ArrowRightLeft size={16} /> Gestionar Saldo
        </button>
      </div>

      {/* 3. DISTRIBUCIÓN DE CARTERA */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 md:p-6 shadow-xl">
        <h3 className="text-white font-bold text-lg mb-6 tracking-tight">Distribución de cartera</h3>
        
        <div className="flex items-center gap-8">
          {/* Donut Chart (SVG 100% nativo) */}
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {/* Fondo (Gris) */}
              <path
                className="text-[#2d2d2d]"
                strokeWidth="6" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Proyectos (Teal) */}
              <path
                className="text-teal-400 drop-shadow-md transition-all duration-1000 ease-out"
                strokeDasharray={`${pctProyectos} ${100 - pctProyectos}`}
                strokeDashoffset="0"
                strokeWidth="6" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Bolsa (Amber) - Se dibuja encima desfasado */}
              <path
                className="text-amber-500 drop-shadow-md transition-all duration-1000 ease-out"
                strokeDasharray={`${pctBolsa} ${100 - pctBolsa}`}
                strokeDashoffset={-pctProyectos}
                strokeWidth="6" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">total</span>
              <span className="text-sm font-black text-white">{(totalInvertido / 1000).toFixed(1)}k</span>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                <span className="text-sm text-gray-400 font-medium">Bolsa</span>
              </div>
              <span className="text-sm font-bold text-white">{bolsaInvertido.toLocaleString('es-ES')} €</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-teal-400"></div>
                <span className="text-sm text-gray-400 font-medium">Proyectos</span>
              </div>
              <span className="text-sm font-bold text-white">{proyectoInvertido.toLocaleString('es-ES')} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          MODAL DE GESTIÓN DEL SALDO DISPONIBLE
      ================================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <h3 className="text-base font-bold text-white tracking-tight">Gestionar Saldo Global</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-500/70 font-bold uppercase mb-1">Disponible actual</p>
                <p className="text-2xl font-black text-amber-500">{disponibleGlobal.toLocaleString('es-ES')} €</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Cantidad a mover</label>
                <input 
                  type="number" 
                  placeholder="Ej: 500" 
                  value={inputAmount} 
                  onChange={(e) => setInputAmount(e.target.value)} 
                  className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-amber-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">¿A dónde quieres enviar el dinero?</label>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => handleGlobal('bolsa')} className="w-full bg-[#1c1c1e] hover:bg-amber-500/10 text-white hover:text-amber-500 border border-[#2d2d2d] hover:border-amber-500/30 text-sm font-bold py-3.5 rounded-xl transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                    <span>A Bolsa</span> <ChevronRight size={16} />
                  </button>
                  <button onClick={() => handleGlobal('proyecto')} className="w-full bg-[#1c1c1e] hover:bg-teal-500/10 text-white hover:text-teal-400 border border-[#2d2d2d] hover:border-teal-500/30 text-sm font-bold py-3.5 rounded-xl transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                    <span>A Proyectos</span> <ChevronRight size={16} />
                  </button>
                  <button onClick={() => handleGlobal('diadia')} className="w-full bg-[#1c1c1e] hover:bg-emerald-500/10 text-white hover:text-emerald-400 border border-[#2d2d2d] hover:border-emerald-500/30 text-sm font-bold py-3.5 rounded-xl transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                    <span><ArrowLeft size={14} className="inline mr-1"/> Devolver a Día a Día</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
