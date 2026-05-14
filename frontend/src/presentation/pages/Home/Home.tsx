export const Home = () => {
  return (
    <div className="text-white">
      <header className="mb-8"> 
        <h1 className="text-2xl font-bold">Panel Principal</h1>
        <p className="text-gray-400 text-sm">Resumen general de tu ecosistema personal.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 h-40 flex items-center justify-center text-gray-500 italic">
          Próximamente: Widgets de IA y Salud...
        </div>
      </div>
    </div>
  );
};
