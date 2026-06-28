import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Code, RefreshCw, MoreVertical, X, Trash2 } from 'lucide-react';
import { db, auth } from '../../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Project {
  id: string;
  name: string;
  type: 'software' | 'compraventa' | 'otro';
  activeInvested: number;     // Dinero actualmente bloqueado en el proyecto (Stock activo)
  historicalInvested: number; // Total gastado en toda la vida del proyecto
  historicalRevenue: number;  // Total ingresado en toda la vida del proyecto
  createdAt: string;
}

interface ProyectoDetailsProps {
  proyectoDisponible: number;
  proyectoInvertido: number;
  proyectoGanado: number;
  onEjecutarProyecto: (modo: 'comprar' | 'vender' | 'diadia' | 'balance', coste: number, venta?: number) => Promise<void> | any;
  onBack: () => void;
}

export const ProyectoDetails = ({
  proyectoDisponible,
  onEjecutarProyecto,
  onBack
}: ProyectoDetailsProps) => {

  const [projects, setProjects] = useState<Project[]>([]);
  
  // Modales
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'software' | 'compraventa'>('software');

  const [txModal, setTxModal] = useState<{isOpen: boolean, project: Project | null, type: 'ingreso' | 'gasto' | 'venta' | 'compra'}>({ isOpen: false, project: null, type: 'ingreso' });
  const [txAmount, setTxAmount] = useState('');
  const [txCost, setTxCost] = useState('');

  // 🚀 CARGAR PROYECTOS DE FIREBASE
  useEffect(() => {
    const loadProjects = async () => {
      const local = JSON.parse(localStorage.getItem('aio_proyectos_lista_v2') || '[]');
      setProjects(local);

      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, `users/${user.uid}/investment_balances`, 'proyectos_lista'));
        if (docSnap.exists()) {
          const data = docSnap.data().proyectos || [];
          setProjects(data);
          localStorage.setItem('aio_proyectos_lista_v2', JSON.stringify(data));
        }
      } catch (e) {}
    };
    loadProjects();
  }, []);

  const saveProjects = async (newProjs: Project[]) => {
    setProjects(newProjs);
    localStorage.setItem('aio_proyectos_lista_v2', JSON.stringify(newProjs));
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'proyectos_lista'), { proyectos: newProjs });
    } catch(e) {}
  };

  // --- CREAR PROYECTO ---
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      type: newProjectType,
      activeInvested: 0,
      historicalInvested: 0,
      historicalRevenue: 0,
      createdAt: new Date().toISOString()
    };
    saveProjects([...projects, newProj]);
    setIsNewProjectOpen(false);
    setNewProjectName('');
  };

  // --- ELIMINAR PROYECTO ---
  const handleDeleteProject = (proj: Project) => {
    if(confirm(`¿Estás seguro de eliminar el proyecto "${proj.name}"?\nSi tienes stock o capital activo (${proj.activeInvested} €) se devolverá a tu saldo disponible.`)) {
      if (proj.activeInvested > 0) {
        onEjecutarProyecto('balance', proj.activeInvested); // Devuelve el dinero atrapado
      }
      saveProjects(projects.filter(p => p.id !== proj.id));
    }
  };

  // --- TRANSACCIONES (INGRESO / GASTO / COMPRA / VENTA) ---
  const openTxModal = (project: Project, type: 'ingreso' | 'gasto' | 'venta' | 'compra') => {
    setTxModal({ isOpen: true, project, type });
    setTxAmount('');
    setTxCost('');
  };

  const handleConfirmTx = () => {
    const p = txModal.project;
    if (!p) return;
    
    const amount = Number(txAmount);
    const cost = Number(txCost);

    if (amount <= 0) {
      alert("El monto debe ser mayor que 0"); return;
    }

    let updatedProjects = [...projects];
    const pIndex = updatedProjects.findIndex(proj => proj.id === p.id);

    if (txModal.type === 'gasto' || txModal.type === 'compra') {
      if (amount > proyectoDisponible) {
        alert(`Saldo insuficiente. Dispones de ${proyectoDisponible.toLocaleString('es-ES')} €.`); return;
      }
      // GASTAR DINERO (Saca de disponible, lo mete en el proyecto)
      onEjecutarProyecto('comprar', amount);
      updatedProjects[pIndex].activeInvested += amount;
      updatedProjects[pIndex].historicalInvested += amount;

    } else if (txModal.type === 'ingreso') {
      // INGRESO SOFTWARE (Coste 0, todo es beneficio limpio)
      onEjecutarProyecto('vender', 0, amount);
      updatedProjects[pIndex].historicalRevenue += amount;

    } else if (txModal.type === 'venta') {
      // VENTA FÍSICA (Requiere saber el coste del artículo para restarlo del stock)
      if (cost < 0 || cost > p.activeInvested) {
        alert(`El coste del artículo vendido no puede superar el Stock Activo (${p.activeInvested} €)`); return;
      }
      onEjecutarProyecto('vender', cost, amount);
      updatedProjects[pIndex].activeInvested = Math.max(0, updatedProjects[pIndex].activeInvested - cost);
      updatedProjects[pIndex].historicalRevenue += amount;
    }

    saveProjects(updatedProjects);
    setTxModal({ isOpen: false, project: null, type: 'ingreso' });
  };


  // --- CÁLCULOS GLOBALES PARA LAS TARJETAS SUPERIORES ---
  const totalBeneficio = projects.reduce((sum, p) => sum + (p.historicalRevenue - p.historicalInvested), 0);
  const totalCapitalHistorico = projects.reduce((sum, p) => sum + p.historicalInvested, 0);
  const totalIngresos = projects.reduce((sum, p) => sum + p.historicalRevenue, 0);
  const roiMedio = totalCapitalHistorico > 0 ? (totalBeneficio / totalCapitalHistorico) * 100 : 0;

  return (
    <div className="w-full mx-auto pb-12 animate-in fade-in duration-300 relative">
      
      {/* 🚀 CABECERA */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Proyectos personales</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Dinero disponible: <strong className="text-amber-500">{proyectoDisponible.toLocaleString('es-ES')} €</strong></p>
          </div>
        </div>
        <button onClick={() => setIsNewProjectOpen(true)} className="bg-[#f59e0b] hover:bg-[#ca8a04] text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/10">
          <Plus size={18} strokeWidth={3} /> Nuevo proyecto
        </button>
      </div>

      {/* 📊 TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Beneficio neto total</p>
          <div>
            <p className={`text-2xl font-black ${totalBeneficio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalBeneficio >= 0 ? '+' : ''}{totalBeneficio.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">entre todos los proyectos</p>
          </div>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Capital invertido</p>
          <div>
            <p className="text-2xl font-black text-white">{totalCapitalHistorico.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">coste base acumulado</p>
          </div>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">Ingresos totales</p>
          <div>
            <p className="text-2xl font-black text-teal-400">{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">ventas y retornos</p>
          </div>
        </div>
        <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28">
          <p className="text-xs font-bold text-gray-500">ROI medio</p>
          <div>
            <p className={`text-2xl font-black ${roiMedio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">proyectos activos</p>
          </div>
        </div>
      </div>

      {/* 🚀 CUADRÍCULA DE PROYECTOS REALES */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(proj => {
            const beneficio = proj.historicalRevenue - proj.historicalInvested;
            const roi = proj.historicalInvested > 0 ? (beneficio / proj.historicalInvested) * 100 : 0;
            const isSoftware = proj.type === 'software';

            return (
              <div key={proj.id} className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-5 hover:border-[#3d3d3d] transition-colors group relative">
                
                {/* BOTÓN ELIMINAR (Oculto hasta hacer hover) */}
                <button 
                  onClick={() => handleDeleteProject(proj)} 
                  className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Eliminar proyecto"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-start justify-between mb-6 pr-10">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSoftware ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isSoftware ? <Code size={24} /> : <RefreshCw size={24} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white leading-tight mb-2">{proj.name}</h3>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSoftware ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                          {proj.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* BOTONERA DE ACCIÓN */}
                <div className="flex items-center gap-2 mb-6">
                  {isSoftware ? (
                    <>
                      <button onClick={() => openTxModal(proj, 'ingreso')} className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Plus size={14} /> Ingreso
                      </button>
                      <button onClick={() => openTxModal(proj, 'gasto')} className="px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <div className="w-3 h-[2px] bg-rose-400 rounded-full"></div> Gasto
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openTxModal(proj, 'venta')} className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Plus size={14} /> Venta
                      </button>
                      <button onClick={() => openTxModal(proj, 'compra')} className="px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <div className="w-3 h-[2px] bg-rose-400 rounded-full"></div> Compra
                      </button>
                    </>
                  )}
                </div>

                {/* GRÁFICO ESTÉTICO */}
                <div className="w-full h-16 mb-6">
                  <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`grad-${proj.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isSoftware ? "#f59e0b" : "#10b981"} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={isSoftware ? "#f59e0b" : "#10b981"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 80 Q 100 75, 200 60 T 400 20 L 400 100 L 0 100 Z" fill={`url(#grad-${proj.id})`} />
                    <path d="M0 80 Q 100 75, 200 60 T 400 20" fill="none" stroke={isSoftware ? "#f59e0b" : "#10b981"} strokeWidth="2.5" />
                  </svg>
                </div>

                {/* MÉTRICAS DEL PROYECTO */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
                    <p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Capital Histórico' : 'Total Compras'}</p>
                    <p className="text-sm font-black text-rose-400">-{proj.historicalInvested.toLocaleString()} €</p>
                  </div>
                  <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
                    <p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Ingresos Acum.' : 'Ventas Totales'}</p>
                    <p className="text-sm font-black text-teal-400">+{proj.historicalRevenue.toLocaleString()} €</p>
                  </div>
                  <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]">
                    <p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Beneficio Neto' : 'Stock Activo (Coste)'}</p>
                    {isSoftware ? (
                      <p className={`text-sm font-black ${beneficio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{beneficio > 0 ? '+' : ''}{beneficio.toLocaleString()} €</p>
                    ) : (
                      <p className="text-sm font-black text-amber-500">{proj.activeInvested.toLocaleString()} €</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-medium text-gray-500 border-t border-[#2d2d2d] pt-3 mt-4">
                  <p>Iniciado el {new Date(proj.createdAt).toLocaleDateString()}</p>
                  <p className={`${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{roi > 0 ? '+' : ''}{roi.toFixed(1)}% ROI</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#141416] border border-[#2d2d2d] rounded-3xl">
          <BriefcaseIcon size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 font-bold text-lg mb-2">No tienes proyectos creados</p>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">Crea un proyecto para empezar a registrar tus ingresos de software, compras, ventas e inversiones independientes.</p>
          <button onClick={() => setIsNewProjectOpen(true)} className="bg-[#f59e0b] hover:bg-[#ca8a04] text-black px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer inline-flex items-center gap-2">
            <Plus size={18} strokeWidth={3} /> Empezar mi primer proyecto
          </button>
        </div>
      )}

      {/* 🟢 MODAL: NUEVO PROYECTO */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <h3 className="text-lg font-bold text-white tracking-tight">Nuevo Proyecto</h3>
              <button onClick={() => setIsNewProjectOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del proyecto</label>
                <input type="text" placeholder="Ej: Venta de Zapatillas" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de negocio</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setNewProjectType('software')} className={`py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${newProjectType === 'software' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-[#1c1c1e] border-[#2d2d2d] text-gray-400 hover:text-white'}`}>Software / SaaS</button>
                  <button onClick={() => setNewProjectType('compraventa')} className={`py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${newProjectType === 'compraventa' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-[#1c1c1e] border-[#2d2d2d] text-gray-400 hover:text-white'}`}>Compraventa</button>
                </div>
              </div>
              <button onClick={handleCreateProject} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">Crear Proyecto</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 MODAL: TRANSACCIONES (INGRESO / GASTO / VENTA / COMPRA) */}
      {txModal.isOpen && txModal.project && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight capitalize">Registrar {txModal.type}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{txModal.project.name}</p>
              </div>
              <button onClick={() => setTxModal({ isOpen: false, project: null, type: 'ingreso' })} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              
              {(txModal.type === 'gasto' || txModal.type === 'compra') && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-rose-400">Restará de tu saldo:</span>
                  <span className="text-sm font-black text-rose-400">{proyectoDisponible.toLocaleString()} € disp.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  {txModal.type === 'venta' ? 'Precio de venta (€)' : `Monto del ${txModal.type} (€)`}
                </label>
                <input type="number" step="any" placeholder="Ej: 50.00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" autoFocus />
              </div>

              {txModal.type === 'venta' && (
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Coste del artículo (€)</label>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 rounded">Stock Max: {txModal.project.activeInvested} €</span>
                  </div>
                  <input type="number" step="any" placeholder="Lo que te costó comprarlo" value={txCost} onChange={(e) => setTxCost(e.target.value)} className="w-full bg-[#1c1c1e] border border-amber-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" />
                  <p className="text-[10px] text-gray-500 mt-2">Para calcular el beneficio limpio, dime cuánto te costó comprar este artículo de tu stock.</p>
                </div>
              )}

              <button onClick={handleConfirmTx} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Icono auxiliar para la vista vacía
function BriefcaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
