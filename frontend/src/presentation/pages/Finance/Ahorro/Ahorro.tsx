import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowDown, ArrowUp, ArrowRightLeft, Plus, 
  Plane, Car, ShieldCheck, ShoppingBag, GraduationCap, 
  MoreVertical, Calendar, Folder, FolderOpen 
} from 'lucide-react';

export const Ahorro = () => {
  const navigate = useNavigate();

  // --- DATOS MOCK BASADOS EN TUS CAPTURAS (A conectar con Firebase) ---
  const disponible = 0.00;
  const enHuchas = 4917.96;

  const huchas = [
    { id: '1', title: 'Ahorro emergencia', subtitle: 'Reserva para imprevistos', current: 1800.00, target: 6000, color: 'rose', icon: <ShieldCheck size={20} /> },
    { id: '2', title: 'Leroy Merlin Acciones', subtitle: 'Inversión empresa', current: 1817.96, target: 3000, color: 'emerald', icon: <ShoppingBag size={20} /> },
    { id: '3', title: 'Uni', subtitle: 'Gastos universitarios', current: 1000.00, target: 2000, color: 'blue', icon: <GraduationCap size={20} /> },
    { id: '4', title: 'Viajes', subtitle: 'Fondo para vacaciones', current: 300.00, target: 1500, color: 'blue', icon: <Plane size={20} /> },
    { id: '5', title: 'Coche', subtitle: 'Entrada vehículo nuevo', current: 0.00, target: 5000, color: 'amber', icon: <Car size={20} /> }
  ];

  const colorStyles: Record<string, { bg: string, text: string, bar: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  };

  // Estados para el historial desplegable
  const [is2026Open, setIs2026Open] = useState(true);
  const [isJunioOpen, setIsJunioOpen] = useState(false);

  return (
    <div className="w-full text-white min-h-screen pb-12 animate-in fade-in duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">
          Ahorro
        </h1>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">Disponible</p>
          <p className="text-emerald-400 text-3xl font-black">{disponible.toFixed(2)} €</p>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-1">En huchas</p>
          <p className="text-white text-3xl font-black">{enHuchas.toFixed(2)} €</p>
        </div>
      </div>

      {/* BOTONERA DE ACCIÓN */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-colors">
            <ArrowDown size={16} /> Mover a hucha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors">
            <ArrowUp size={16} /> Mover de hucha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#2d2d2d] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors">
            <ArrowRightLeft size={16} /> Pasar a día a día
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] text-white rounded-lg text-sm font-medium hover:bg-[#3d3d3d] transition-colors">
          <Plus size={16} /> Nueva hucha
        </button>
      </div>

      {/* NUEVO DISEÑO DE HUCHAS (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
        {huchas.map((hucha) => {
          const style = colorStyles[hucha.color] || colorStyles.emerald;
          const percentage = Math.min(Math.round((hucha.current / hucha.target) * 100), 100);
          const remaining = hucha.target - hucha.current;

          return (
            <div key={hucha.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 relative group hover:border-[#3d3d3d] transition-colors">
              <button className="absolute top-5 right-4 text-gray-500 hover:text-white transition-colors">
                <MoreVertical size={18} />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                  {hucha.icon}
                </div>
                <div className="pr-6">
                  <h3 className="text-lg font-bold text-white leading-tight">{hucha.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{hucha.subtitle}</p>
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-2xl font-black text-white">{hucha.current.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                  <p className="text-xs text-gray-500 font-medium bg-[#1c1c1e] px-2 py-0.5 rounded mt-1 inline-block">
                    de {hucha.target.toLocaleString('es-ES')} € · quedan {remaining.toLocaleString('es-ES')} €
                  </p>
                </div>
                <span className={`text-sm font-bold ${style.text}`}>{percentage}%</span>
              </div>

              <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden mt-3">
                <div className={`h-full rounded-full ${style.bar} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HISTORIAL (Mantenido visualmente como lo tenías) */}
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-6 border-b border-[#2d2d2d] pb-4">
          <Calendar className="text-emerald-500" size={20} />
          <h2 className="text-lg font-bold text-white">Historial de movimientos</h2>
        </div>

        <div className="space-y-2">
          {/* Año */}
          <button onClick={() => setIs2026Open(!is2026Open)} className="w-full flex items-center justify-between p-2 hover:bg-[#1a1a1c] rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              {is2026Open ? <FolderOpen size={18} className="text-emerald-500" /> : <Folder size={18} className="text-emerald-500" />}
              <span className="font-bold text-white">2026</span>
            </div>
            <span className="text-xs text-gray-500 bg-[#1c1c1e] px-2 py-1 rounded">11 movs</span>
          </button>

          {/* Meses */}
          {is2026Open && (
            <div className="pl-6 pt-2">
              <button onClick={() => setIsJunioOpen(!isJunioOpen)} className="w-full flex items-center justify-between p-2 hover:bg-[#1a1a1c] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft size={14} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-300">Junio</span>
                </div>
                <span className="text-xs text-gray-500">6 transacciones</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
