import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Code, RefreshCw, MoreVertical, X, Trash2, Package, Tag, ArrowRight, TrendingUp, Minus, Edit2, History } from 'lucide-react';
import { db, auth } from '../../../../../../infrastructure/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface ProjectTx {
  id: string;
  type: 'ingreso' | 'gasto' | 'venta' | 'compra';
  amount: number;
  cost?: number; 
  profit?: number; 
  date: string;
}

export interface Project {
  id: string;
  name: string;
  type: 'software' | 'compraventa' | 'otro';
  activeInvested: number;     
  historicalInvested: number; 
  historicalRevenue: number;  
  createdAt: string;
  transactions?: ProjectTx[]; 
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); 
  
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'software' | 'compraventa'>('software');

  const [txModal, setTxModal] = useState<{isOpen: boolean, project: Project | null, type: 'ingreso' | 'gasto' | 'venta' | 'compra'}>({ isOpen: false, project: null, type: 'ingreso' });
  const [txAmount, setTxAmount] = useState('');
  const [txCost, setTxCost] = useState('');

  // 🚀 NUEVO: Modal de Edición del Historial
  const [editTxModal, setEditTxModal] = useState<{isOpen: boolean, tx: ProjectTx | null}>({isOpen: false, tx: null});
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxCost, setEditTxCost] = useState('');

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
          const patchedData = data.map((p: any) => ({ ...p, transactions: p.transactions || [] }));
          setProjects(patchedData);
          localStorage.setItem('aio_proyectos_lista_v2', JSON.stringify(patchedData));
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
    try { await setDoc(doc(db, `users/${user.uid}/investment_balances`, 'proyectos_lista'), { proyectos: newProjs }); } catch(e) {}
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = { id: Date.now().toString(), name: newProjectName, type: newProjectType, activeInvested: 0, historicalInvested: 0, historicalRevenue: 0, createdAt: new Date().toISOString(), transactions: [] };
    saveProjects([...projects, newProj]); setIsNewProjectOpen(false); setNewProjectName('');
  };

  const handleDeleteProject = (proj: Project) => {
    if(confirm(`¿Estás seguro de eliminar el proyecto "${proj.name}"?\nSi tienes stock o capital activo (${proj.activeInvested} €) se devolverá a tu saldo disponible.`)) {
      if (proj.activeInvested > 0) onEjecutarProyecto('balance', proj.activeInvested); 
      saveProjects(projects.filter(p => p.id !== proj.id));
      if (selectedProject?.id === proj.id) setSelectedProject(null);
    }
  };

  const openTxModal = (project: Project, type: 'ingreso' | 'gasto' | 'venta' | 'compra') => {
    setTxModal({ isOpen: true, project, type }); setTxAmount(''); setTxCost('');
  };

  const handleConfirmTx = () => {
    const p = txModal.project; if (!p) return;
    const amount = Number(txAmount); const cost = Number(txCost);
    if (amount <= 0) return;

    let updatedProjects = [...projects];
    const pIndex = updatedProjects.findIndex(proj => proj.id === p.id);
    const newTx: ProjectTx = { id: Date.now().toString(), type: txModal.type, amount: amount, date: new Date().toISOString() };

    if (txModal.type === 'gasto' || txModal.type === 'compra') {
      if (amount > proyectoDisponible) { alert(`Saldo insuficiente.`); return; }
      onEjecutarProyecto('comprar', amount);
      updatedProjects[pIndex].activeInvested += amount; updatedProjects[pIndex].historicalInvested += amount;
    } else if (txModal.type === 'ingreso') {
      onEjecutarProyecto('vender', 0, amount);
      updatedProjects[pIndex].historicalRevenue += amount; newTx.profit = amount; 
    } else if (txModal.type === 'venta') {
      if (cost < 0 || cost > p.activeInvested) { alert(`El coste no puede superar el Stock Activo.`); return; }
      onEjecutarProyecto('vender', cost, amount);
      updatedProjects[pIndex].activeInvested = Math.max(0, updatedProjects[pIndex].activeInvested - cost);
      updatedProjects[pIndex].historicalRevenue += amount;
      newTx.cost = cost; newTx.profit = amount - cost;
    }

    if (!updatedProjects[pIndex].transactions) updatedProjects[pIndex].transactions = [];
    updatedProjects[pIndex].transactions!.unshift(newTx); 
    saveProjects(updatedProjects);
    if (selectedProject?.id === p.id) setSelectedProject(updatedProjects[pIndex]);
    setTxModal({ isOpen: false, project: null, type: 'ingreso' });
  };

  // 🚀 NUEVO: RESCATAR HISTORIAL PERDIDO
  const handleRescueHistory = () => {
    if (!selectedProject) return;
    let updatedProjects = [...projects];
    const pIndex = updatedProjects.findIndex(p => p.id === selectedProject.id);
    const p = updatedProjects[pIndex];

    const rescuedTxs: ProjectTx[] = [];
    const isSoft = p.type === 'software';

    if (p.historicalInvested > 0) {
        rescuedTxs.push({ id: `res-compra-${Date.now()}`, type: isSoft ? 'gasto' : 'compra', amount: p.historicalInvested, date: p.createdAt });
    }
    if (p.historicalRevenue > 0) {
        const costGuess = isSoft ? 0 : Math.max(0, p.historicalInvested - p.activeInvested);
        rescuedTxs.push({ id: `res-venta-${Date.now()}`, type: isSoft ? 'ingreso' : 'venta', amount: p.historicalRevenue, cost: isSoft ? undefined : costGuess, profit: p.historicalRevenue - costGuess, date: new Date().toISOString() });
    }

    p.transactions = rescuedTxs;
    saveProjects(updatedProjects);
    setSelectedProject(p);
  };

  // 🚀 NUEVO: ELIMINAR OPERACIÓN DEL HISTORIAL
  const handleDeleteTx = (tx: ProjectTx) => {
    if (!selectedProject) return;
    if (confirm("¿Borrar esta operación del historial?\n\nSe ajustarán los totales de este proyecto automáticamente.")) {
      let updatedProjects = [...projects];
      const pIndex = updatedProjects.findIndex(p => p.id === selectedProject.id);
      const p = updatedProjects[pIndex];

      if (tx.type === 'gasto' || tx.type === 'compra') {
          p.historicalInvested -= tx.amount;
          p.activeInvested = Math.max(0, p.activeInvested - tx.amount);
      } else if (tx.type === 'ingreso' || tx.type === 'venta') {
          p.historicalRevenue -= tx.amount;
          if (tx.cost) p.activeInvested += tx.cost;
      }

      p.transactions = p.transactions!.filter(t => t.id !== tx.id);
      saveProjects(updatedProjects);
      setSelectedProject(p);
    }
  };

  // 🚀 NUEVO: EDITAR OPERACIÓN DEL HISTORIAL
  const handleOpenEditTx = (tx: ProjectTx) => {
    setEditTxModal({ isOpen: true, tx });
    setEditTxAmount(tx.amount.toString());
    setEditTxCost(tx.cost !== undefined ? tx.cost.toString() : '');
  };

  const handleConfirmEditTx = () => {
    if (!editTxModal.tx || !selectedProject) return;
    const newAmount = Number(editTxAmount); const newCost = Number(editTxCost);
    const oldTx = editTxModal.tx;
    if (newAmount <= 0) return;

    let updatedProjects = [...projects];
    const pIndex = updatedProjects.findIndex(p => p.id === selectedProject.id);
    const p = updatedProjects[pIndex];

    // 1. Revertimos la operación antigua
    if (oldTx.type === 'gasto' || oldTx.type === 'compra') {
        p.historicalInvested -= oldTx.amount; p.activeInvested -= oldTx.amount;
    } else {
        p.historicalRevenue -= oldTx.amount; if (oldTx.cost) p.activeInvested += oldTx.cost;
    }

    // 2. Aplicamos los nuevos valores
    if (oldTx.type === 'gasto' || oldTx.type === 'compra') {
        p.historicalInvested += newAmount; p.activeInvested += newAmount;
    } else {
        p.historicalRevenue += newAmount; if (oldTx.type === 'venta') p.activeInvested -= newCost;
    }

    const txIndex = p.transactions!.findIndex(t => t.id === oldTx.id);
    p.transactions![txIndex] = {
        ...oldTx, amount: newAmount, cost: oldTx.type === 'venta' ? newCost : undefined,
        profit: oldTx.type === 'venta' ? (newAmount - newCost) : newAmount
    };

    saveProjects(updatedProjects);
    setSelectedProject(p);
    setEditTxModal({ isOpen: false, tx: null });
  };


  const totalBeneficio = projects.reduce((sum, p) => sum + (p.historicalRevenue - p.historicalInvested), 0);
  const totalCapitalHistorico = projects.reduce((sum, p) => sum + p.historicalInvested, 0);
  const totalIngresos = projects.reduce((sum, p) => sum + p.historicalRevenue, 0);
  const roiMedio = totalCapitalHistorico > 0 ? (totalBeneficio / totalCapitalHistorico) * 100 : 0;

  // ============================================================================
  // VISTA 1: LISTADO GLOBAL
  // ============================================================================
  if (!selectedProject) {
    return (
      <div className="w-full mx-auto pb-12 animate-in fade-in duration-300 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer"><ArrowLeft size={24} /></button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Proyectos personales</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Dinero disponible: <strong className="text-amber-500">{proyectoDisponible.toLocaleString('es-ES')} €</strong></p>
            </div>
          </div>
          <button onClick={() => setIsNewProjectOpen(true)} className="bg-[#f59e0b] hover:bg-[#ca8a04] text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/10">
            <Plus size={18} strokeWidth={3} /> Nuevo proyecto
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28"><p className="text-xs font-bold text-gray-500">Beneficio neto total</p><div><p className={`text-2xl font-black ${totalBeneficio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{totalBeneficio >= 0 ? '+' : ''}{totalBeneficio.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</p></div></div>
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28"><p className="text-xs font-bold text-gray-500">Capital invertido</p><div><p className="text-2xl font-black text-white">{totalCapitalHistorico.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</p></div></div>
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28"><p className="text-xs font-bold text-gray-500">Ingresos totales</p><div><p className="text-2xl font-black text-teal-400">{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</p></div></div>
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl p-4 flex flex-col justify-between h-28"><p className="text-xs font-bold text-gray-500">ROI medio</p><div><p className={`text-2xl font-black ${roiMedio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(0)}%</p></div></div>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map(proj => {
              const beneficio = proj.historicalRevenue - proj.historicalInvested;
              const roi = proj.historicalInvested > 0 ? (beneficio / proj.historicalInvested) * 100 : 0;
              const isSoftware = proj.type === 'software';

              return (
                <div key={proj.id} onClick={() => setSelectedProject(proj)} className="bg-[#141416] border border-[#2d2d2d] rounded-3xl p-5 hover:border-[#3d3d3d] hover:bg-[#1a1a1c] transition-colors group relative cursor-pointer">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj); }} className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"><Trash2 size={16} /></button>
                  <div className="flex items-start justify-between mb-6 pr-10">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSoftware ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{isSoftware ? <Code size={24} /> : <RefreshCw size={24} />}</div>
                      <div>
                        <h3 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-amber-500 transition-colors">{proj.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSoftware ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{proj.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]"><p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Invertido' : 'Total Compras'}</p><p className="text-sm font-black text-rose-400">-{proj.historicalInvested.toLocaleString()} €</p></div>
                    <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]"><p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Ingresos' : 'Ventas Totales'}</p><p className="text-sm font-black text-teal-400">+{proj.historicalRevenue.toLocaleString()} €</p></div>
                    <div className="bg-[#1c1c1e] p-2.5 rounded-xl border border-[#2d2d2d]"><p className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">{isSoftware ? 'Beneficio' : 'Stock (Coste)'}</p>{isSoftware ? (<p className={`text-sm font-black ${beneficio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{beneficio > 0 ? '+' : ''}{beneficio.toLocaleString()} €</p>) : (<p className="text-sm font-black text-amber-500">{proj.activeInvested.toLocaleString()} €</p>)}</div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-gray-500 border-t border-[#2d2d2d] pt-3 mt-4"><p className="flex items-center gap-1">Ver libro de cuentas <ArrowRight size={12}/></p><p className={`${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{roi > 0 ? '+' : ''}{roi.toFixed(1)}% ROI</p></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#141416] border border-[#2d2d2d] rounded-3xl"><Package size={48} className="mx-auto text-gray-700 mb-4" /><p className="text-gray-400 font-bold text-lg mb-2">No tienes proyectos creados</p><button onClick={() => setIsNewProjectOpen(true)} className="bg-[#f59e0b] hover:bg-[#ca8a04] text-black px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer mt-4">Crear mi primer proyecto</button></div>
        )}

        {isNewProjectOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]"><h3 className="text-lg font-bold text-white tracking-tight">Nuevo Proyecto</h3><button onClick={() => setIsNewProjectOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button></div>
              <div className="p-5 space-y-4">
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del proyecto</label><input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500" /></div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de negocio</label>
                  <div className="grid grid-cols-2 gap-3"><button onClick={() => setNewProjectType('software')} className={`py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${newProjectType === 'software' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-[#1c1c1e] border-[#2d2d2d] text-gray-400 hover:text-white'}`}>Software</button><button onClick={() => setNewProjectType('compraventa')} className={`py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${newProjectType === 'compraventa' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-[#1c1c1e] border-[#2d2d2d] text-gray-400 hover:text-white'}`}>Compraventa</button></div>
                </div>
                <button onClick={handleCreateProject} className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3.5 rounded-xl font-black mt-4 transition-colors">Crear Proyecto</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: DETALLE DEL PROYECTO INDIVIDUAL
  // ============================================================================
  const isSoftware = selectedProject.type === 'software';
  const beneficioProj = selectedProject.historicalRevenue - selectedProject.historicalInvested;
  const roiProj = selectedProject.historicalInvested > 0 ? (beneficioProj / selectedProject.historicalInvested) * 100 : 0;
  const transacciones = selectedProject.transactions || [];

  return (
    <div className="w-full mx-auto pb-12 animate-in slide-in-from-right-8 duration-300 relative">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedProject(null)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2d2d2d] cursor-pointer"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{selectedProject.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSoftware ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{selectedProject.type}</span>
              <p className="text-xs text-gray-500 font-medium">Activo desde {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isSoftware ? (
            <><button onClick={() => openTxModal(selectedProject, 'ingreso')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-2 cursor-pointer"><Plus size={16}/> Ingreso</button><button onClick={() => openTxModal(selectedProject, 'gasto')} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-2 cursor-pointer"><Minus size={16}/> Gasto</button></>
          ) : (
            <><button onClick={() => openTxModal(selectedProject, 'venta')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-2 cursor-pointer"><Tag size={16}/> Registrar Venta</button><button onClick={() => openTxModal(selectedProject, 'compra')} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-2 cursor-pointer"><Package size={16}/> Comprar Stock</button></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4"><p className="text-xs font-bold text-gray-500 mb-1">{isSoftware ? 'Gastos Históricos' : 'Compras Totales'}</p><p className="text-xl font-black text-rose-400">-{selectedProject.historicalInvested.toLocaleString()} €</p></div>
        <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4"><p className="text-xs font-bold text-gray-500 mb-1">{isSoftware ? 'Ingresos Totales' : 'Ventas Totales'}</p><p className="text-xl font-black text-teal-400">+{selectedProject.historicalRevenue.toLocaleString()} €</p></div>
        <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4"><p className="text-xs font-bold text-gray-500 mb-1">Beneficio Neto</p><p className={`text-xl font-black ${beneficioProj >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{beneficioProj > 0 ? '+' : ''}{beneficioProj.toLocaleString()} €</p></div>
        <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-2xl p-4"><p className="text-xs font-bold text-gray-500 mb-1">{isSoftware ? 'ROI Histórico' : 'Stock Activo (Coste)'}</p>{isSoftware ? (<p className={`text-xl font-black ${roiProj >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roiProj > 0 ? '+' : ''}{roiProj.toFixed(1)}%</p>) : (<p className="text-xl font-black text-amber-500">{selectedProject.activeInvested.toLocaleString()} €</p>)}</div>
      </div>

      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={20}/> Historial de Operaciones</h3>
      
      <div className="bg-[#141416] border border-[#2d2d2d] rounded-3xl overflow-hidden">
        {transacciones.length > 0 ? (
          <div className="divide-y divide-[#2d2d2d]">
            {transacciones.map(tx => {
              const isPositive = tx.type === 'ingreso' || tx.type === 'venta';
              const dateObj = new Date(tx.date);
              
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#1a1a1c] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {tx.type === 'venta' ? <Tag size={18}/> : tx.type === 'compra' ? <Package size={18}/> : isPositive ? <TrendingUp size={18}/> : <Minus size={18}/>}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm capitalize flex items-center gap-2">
                        {tx.type === 'venta' ? 'Venta de artículo' : tx.type === 'compra' ? 'Compra de stock' : tx.type}
                        <span className="text-[10px] text-gray-500 font-medium bg-[#222] px-1.5 py-0.5 rounded">{dateObj.toLocaleDateString()}</span>
                      </p>
                      {tx.type === 'venta' && tx.cost !== undefined && (
                        <p className="text-xs text-gray-500 mt-0.5">Coste original: {tx.cost.toLocaleString()} €</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-base font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : '-'}{tx.amount.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                      </p>
                      {tx.type === 'venta' && tx.profit !== undefined && tx.cost !== undefined && (
                        <p className={`text-[11px] font-bold mt-1 ${tx.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Beneficio: {tx.profit >= 0 ? '+' : ''}{tx.profit.toLocaleString('es-ES')} € 
                          {tx.cost > 0 && ` (${tx.profit > 0 ? '+' : ''}${((tx.profit / tx.cost) * 100).toFixed(0)}%)`}
                        </p>
                      )}
                    </div>
                    
                    {/* 🚀 BOTONES DE EDICIÓN Y BORRADO EN HOVER */}
                    <div className="flex flex-col sm:flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEditTx(tx)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Editar operación"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteTx(tx)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Borrar operación"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">
            <p className="font-medium text-sm mb-2">No hay movimientos visuales en este proyecto.</p>
            {/* 🚀 BOTÓN MÁGICO PARA RESCATAR OPERACIONES ANTIGUAS */}
            {(selectedProject.historicalInvested > 0 || selectedProject.historicalRevenue > 0) ? (
              <div className="bg-[#1c1c1e] p-4 rounded-xl max-w-sm mx-auto border border-amber-500/20">
                <p className="text-xs text-amber-500 mb-3">Hemos detectado que tienes compras o ventas registradas en el resumen antiguo. ¿Quieres rescatarlas al historial?</p>
                <button onClick={handleRescueHistory} className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-full cursor-pointer"><History size={14}/> Rescatar Historial</button>
              </div>
            ) : (
              <p className="text-xs mt-1">Registra tu primera compra, venta o gasto usando los botones superiores.</p>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE NUEVA TRANSACCIÓN */}
      {txModal.isOpen && txModal.project && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-white tracking-tight capitalize">Registrar {txModal.type}</h3><p className="text-xs text-gray-500 mt-0.5">{txModal.project.name}</p></div>
              <button onClick={() => setTxModal({ isOpen: false, project: null, type: 'ingreso' })} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              {(txModal.type === 'gasto' || txModal.type === 'compra') && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex justify-between items-center mb-4"><span className="text-xs font-bold text-rose-400">Se restará de tu banco:</span><span className="text-sm font-black text-rose-400">{proyectoDisponible.toLocaleString()} € disp.</span></div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{txModal.type === 'venta' ? 'Precio al que lo has vendido (€)' : `Monto del ${txModal.type} (€)`}</label>
                <input type="number" step="any" placeholder="Ej: 50" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500" autoFocus />
              </div>

              {txModal.type === 'venta' && (
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5"><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">¿Cuánto te costó comprarlo? (€)</label><span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 rounded">Stock Max: {txModal.project.activeInvested} €</span></div>
                  <input type="number" step="any" placeholder="Su coste original" value={txCost} onChange={(e) => setTxCost(e.target.value)} className="w-full bg-[#1c1c1e] border border-amber-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" />
                  
                  {txAmount && txCost && (
                    <div className="bg-black/20 border border-[#2d2d2d] p-3 rounded-xl mt-3 flex justify-between"><span className="text-xs font-bold text-gray-500">Beneficio limpio:</span><span className={`text-sm font-black ${(Number(txAmount) - Number(txCost)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{(Number(txAmount) - Number(txCost)) > 0 ? '+' : ''}{(Number(txAmount) - Number(txCost)).toFixed(2)} €</span></div>
                  )}
                </div>
              )}
              <button onClick={handleConfirmTx} className="w-full bg-amber-500 hover:bg-amber-400 text-black text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL DE EDITAR TRANSACCIÓN */}
      {editTxModal.isOpen && editTxModal.tx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2d]">
              <div><h3 className="text-base font-bold text-blue-400 tracking-tight capitalize">Editar {editTxModal.tx.type}</h3><p className="text-xs text-gray-500 mt-0.5">{selectedProject?.name}</p></div>
              <button onClick={() => setEditTxModal({ isOpen: false, tx: null })} className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nuevo Importe (€)</label>
                <input type="number" step="any" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} className="w-full bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500" autoFocus />
              </div>

              {editTxModal.tx.type === 'venta' && (
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5"><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Nuevo Coste Original (€)</label></div>
                  <input type="number" step="any" value={editTxCost} onChange={(e) => setEditTxCost(e.target.value)} className="w-full bg-[#1c1c1e] border border-blue-500/50 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-blue-500" />
                </div>
              )}
              <button onClick={handleConfirmEditTx} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-base font-black py-3.5 rounded-xl transition-colors cursor-pointer mt-4">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
