import { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export const AiChatDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '¡Hola Daniel! Soy tu consultor de IA. Puedo analizar tu balance general, tus huchas de ahorro o tus posiciones de inversión. ¿Qué quieres revisar hoy?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    
    // Simulación de respuesta inteligente reactiva
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'He analizado tus métricas financieras actuales en el sistema. Tu nivel de liquidez es óptimo para cubrir imprevistos. Te sugeriero vigilar la distribución sectorial de tu cartera de inversión.' 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE ADAPTADO (Limpio de Support) */}
      {/* En móvil se eleva a bottom-20 para flotar por encima del Navbar inferior sin pisarlo */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[90] animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 md:w-auto md:h-auto md:px-5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <MessageSquare size={20} />
          <span className="hidden md:inline ml-2 text-sm">Agente de IA</span>
        </button>
      </div>

      {/* PANEL LATERAL DE CHAT DESLIZABLE */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-[#121212] border-l border-[#2d2d2d] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Cabecera */}
            <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center bg-[#181818]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Agente de IA</h3>
                  <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-wider mt-0.5">● En línea</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 bg-[#252525] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-[#1c1c1e] text-gray-200 border border-[#2d2d2d] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Texto */}
            <div className="p-4 border-t border-[#2d2d2d] bg-[#181818] mb-[env(safe-area-inset-bottom)]">
              <div className="flex gap-2 bg-[#0c0c0c] border border-[#2d2d2d] rounded-xl p-2 items-center focus-within:border-blue-500 transition-colors">
                <input 
                  type="text" 
                  placeholder="Pregúntame lo que quieras..." 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                  className="flex-1 bg-transparent text-sm text-white outline-none px-2 py-1.5" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim()} 
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
