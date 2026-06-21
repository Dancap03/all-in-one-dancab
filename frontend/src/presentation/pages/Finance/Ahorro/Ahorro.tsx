import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Car, ShieldCheck, MoreVertical } from 'lucide-react';

// Estructura de las huchas (Aquí en el futuro lo conectaremos a tu Firebase)
const mockHuchas = [
  {
    id: '1',
    title: 'Vacaciones Japón',
    subtitle: 'Viaje de 2 semanas en otoño 2026',
    current: 2100,
    target: 3000,
    color: 'emerald',
    icon: <Plane size={20} />
  },
  {
    id: '2',
    title: 'Coche nuevo',
    subtitle: 'Entrada para cambio de vehículo 2027',
    current: 1600,
    target: 5000,
    color: 'rose',
    icon: <Car size={20} />
  },
  {
    id: '3',
    title: 'Fondo emergencias',
    subtitle: '6 meses de gastos cubiertos',
    current: 500,
    target: 6000,
    color: 'amber',
    icon: <ShieldCheck size={20} />
  }
];

export const Ahorro = () => {
  const navigate = useNavigate();

  // Diccionario de colores para los estilos dinámicos de las tarjetas
  const colorStyles: Record<string, { bg: string, text: string, bar: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-400' },
  };

  return (
    <div className="w-full text-white min-h-screen pb-12 animate-in fade-in duration-300">
      
      {/* 1. CABECERA CON FLECHA */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">
          Ahorro
        </h1>
      </div>

      {/* 2. LISTA DE HUCHAS */}
      <div className="space-y-4 max-w-2xl">
        {mockHuchas.map((hucha) => {
          const style = colorStyles[hucha.color] || colorStyles.emerald;
          const percentage = Math.min(Math.round((hucha.current / hucha.target) * 100), 100);
          const remaining = hucha.target - hucha.current;

          return (
            <div key={hucha.id} className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-5 relative">
              
              {/* Botón de opciones (3 puntitos) arriba a la derecha */}
              <button className="absolute top-5 right-4 text-gray-500 hover:text-white transition-colors">
                <MoreVertical size={18} />
              </button>

              <div className="flex items-start gap-4 mb-4">
                {/* Icono de la hucha */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                  {hucha.icon}
                </div>
                
                {/* Títulos */}
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{hucha.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{hucha.subtitle}</p>
                </div>
              </div>

              {/* Información Monetaria */}
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-2xl font-black text-white">{hucha.current.toLocaleString('es-ES')} €</p>
                  <p className="text-xs text-gray-500 font-medium bg-[#1c1c1e] px-2 py-0.5 rounded mt-1 inline-block">
                    de {hucha.target.toLocaleString('es-ES')} € · quedan {remaining.toLocaleString('es-ES')} €
                  </p>
                </div>
                <span className={`text-sm font-bold ${style.text}`}>
                  {percentage}%
                </span>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className={`h-full rounded-full ${style.bar} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
