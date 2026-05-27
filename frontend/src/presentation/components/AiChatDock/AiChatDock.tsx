import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AiChatDock = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '¡Hola Daniel! Soy tu consultor financiero en tiempo real. He cargado el contexto de tus activos de inversión. ¿Qué quieres que analicemos hoy?' }
  ]);
  const [portfolioContext, setPortfolioContext] = useState<string>('');

  // Sincroniza dinámicamente tus posiciones reales del LocalStorage al abrir el chat
  useEffect(() => {
    if (isOpen) {
      try {
        const savedPositions = localStorage.getItem('aio_positions');
        if (savedPositions) {
          const positions = JSON.parse(savedPositions);
          setPortfolioContext(`Posiciones actuales de la cartera del usuario: ${JSON.stringify(positions)}`);
        }
      } catch (e) {
        console.error("Error al compilar contexto de activos:", e);
      }
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

      if (!apiKey) {
        throw new Error("La API Key (VITE_GEMINI_API_KEY) no se ha detectado en el entorno de compilación de Vite.");
      }

      // Conexión real vía HTTP Fetch al endpoint global de Gemini 2.0 Flash
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres el consultor y asesor financiero personal de Daniel dentro de su aplicación AllInOne. 
              Responde de forma clara, directa, concisa y en español a su consulta. 
              Utiliza este contexto de su portafolio real para personalizar tus consejos si te pregunta sobre sus activos o diversificación:
              
              ${portfolioContext}
              
              Pregunta del usuario: "${userText}"`
            }]
          }],
          generationConfig: { temperature: 0.3 }
        })
      });

      const resData = await response.json();
      
      // Control de errores de la API de Google
      if (resData.error) {
        if (resData.error.code === 429) {
          throw new Error("Bloqueo de cuota regional (Free tier no disponible en Europa). Recuerda activar tu VPN conectada a Estados Unidos para saltarte esta restricción.");
        }
        throw new Error(resData.error.message);
      }

      const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "No he recibido una respuesta válida del modelo.";
      setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `❌ Error del Agente: ${error.message || "No se pudo establecer conexión con el motor de IA."}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* BOTÓN FLOTANTE TIPO FAB (Perfecto para móvil sin tapar el Navbar inferior) */}
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[90] animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 md:w-auto md:h-auto md:px-5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
        >
          <MessageSquare size={20} />
          <span className="hidden md:inline ml-2 text-sm">Agente de IA</span>
        </button>
      </div>

      {/* PANEL LATERAL DESLIZABLE */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-[#121212] border-l border-[#2d2d2d] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Header del Chat */}
            <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center bg-[#181818]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Agente de IA</h3>
                  <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-wider mt-0.5">● Conectado</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 bg-[#252525] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Ventana de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {messages.map((msg: Message, idx: number) => (
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
              
              {/* Animación de carga interactiva */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-xl px-4 py-3 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input de Texto Inferior */}
            <div className="p-4 border-t border-[#2d2d2d] bg-[#181818]">
              <div className="flex gap-2 bg-[#0c0c0c] border border-[#2d2d2d] rounded-xl p-2 items-center focus-within:border-blue-500 transition-colors">
                <input 
                  type="text" 
                  placeholder="Pregúntame sobre mi cartera o inversión..." 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                  className="flex-1 bg-transparent text-sm text-white outline-none px-2 py-1.5" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isTyping} 
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
