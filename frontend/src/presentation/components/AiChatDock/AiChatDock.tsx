import { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, HelpCircle } from 'lucide-react';

export const AiChatDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '¡Hola! Soy tu consultor de IA para AllInOne. Puedo analizar tu balance general, tus huchas de ahorro o tus posiciones de inversión. ¿Qué quieres revisar hoy?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    
    // Simulación de respuesta inteligente contextualizada
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'He revisado tus métricas financieras actuales en el sistema. Tu nivel de liquidez es óptimo para cubrir imprevistos. Te sugiero vigilar la distribución sectorial de tu cartera de inversión.' 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* PÍLDORA FLOTANTE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1c1c1e]/90 backdrop-blur-md border border-[#2c2c2e] px-2 py-1.5 rounded-full flex items-center gap-1 shadow-2xl z-[90]">
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c2c2e] rounded-full text-sm font-semibold text-gray-200 hover:text-white transition-all cursor-pointer">
          <MessageSquare size={16} className="text-[#60a5fa]" />
          <span>Agente de IA</span>
        </button>
        <div className="w-[1px] h-4 bg-[#2c2c2e] mx-1"></div>
        <button onClick={() => alert("Soporte técnico AllInOne")} className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c2c2e] rounded-full text-sm font-semibold text-gray-400 hover:text-white transition-all cursor-pointer">
          <HelpCircle size={16} />
          <span>Support</span>
        </button>
      </div>

      {/* PANEL LATERAL DE CHAT */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#121212] border-l border-[#2d2d2d] h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center bg-[#181818]">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-blue-400" />
                <h3 className="font-bold text-white text-base">Agente de IA</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 bg-[#252525] rounded-lg"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1c1c1e] text-gray-200 border border-[#2d2d2d]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#2d2d2d] bg-[#181818]">
              <div className="flex gap-2 bg-[#0c0c0c] border border-[#2d2d2d] rounded-xl p-2 items-center">
                <input type="text" placeholder="Escribe tu consulta..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent text-sm text-white outline-none px-2 py-1.5" />
                <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
