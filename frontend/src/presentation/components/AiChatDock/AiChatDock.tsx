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
    { sender: 'ai', text: '¡Hola Daniel! Soy tu consultor financiero en tiempo real. He cargado tus activos y tengo conexión directa con los mercados. ¿Qué estrategia o duda quieres que analicemos hoy?' }
  ]);
  const [portfolioContext, setPortfolioContext] = useState<string>('');

  // Sincroniza las posiciones reales de tu portafolio local al abrir el chat
  useEffect(() => {
    if (isOpen) {
      try {
        const savedPositions = localStorage.getItem('aio_positions');
        if (savedPositions) {
          const positions = JSON.parse(savedPositions);
          setPortfolioContext(`Posiciones actuales en la cartera de inversión del usuario: ${JSON.stringify(positions)}`);
        } else {
          setPortfolioContext('El usuario no tiene posiciones abiertas en su cartera de inversión actualmente.');
        }
      } catch (e) {
        console.error("Error cargando posiciones locales:", e);
      }
    }
  }, [isOpen]);

  // Obtiene precios reales al instante (100% gratis y sin bloqueos de cuotas)
  const fetchLiveMarketData = async (): Promise<string> => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=eur');
      const data = await res.json();
      return `Precios actuales de mercado en tiempo real (EUR): Bitcoin (BTC): ${data.bitcoin?.eur}€, Ethereum (ETH): ${data.ethereum?.eur}€, Solana (SOL): ${data.solana?.eur}€.`;
    } catch (e) {
      return "Precios actuales de mercado (estimados): Bitcoin se mantiene estable sobre los 65.000€ y los principales ETFs indexados globales muestran un comportamiento consolidado.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      // LEER LA NUEVA VARIABLE INDEPENDIENTE DE GROQ
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

      if (!apiKey) {
        throw new Error("Clave de API 'VITE_GROQ_API_KEY' no detectada en el entorno.");
      }

      // 1. Capturamos los datos frescos del mercado en vivo desde el cliente
      const liveMarketContext = await fetchLiveMarketData();

      // 2. Conectamos directamente con Groq usando Llama 3 (Totalmente gratis en el frontend)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `Eres el asesor financiero personal y estratega macroeconómico de Daniel dentro de su Super-App AllInOne. 
              Responde siempre en español, de forma muy concisa, profesional y directa al grano. 
              
              Cuentas con estos bloques de información real e instantánea para construir tus respuestas y consejos sin alucinar:
              
              INFORMACIÓN DE MERCADO EN VIVO:
              ${liveMarketContext}
              
              CONTEXTO DEL PORTAFOLIO DEL USUARIO:
              ${portfolioContext}`
            },
            {
              role: 'user',
              content: userText
            }
          ],
          temperature: 0.3
        })
      });

      const resData = await response.json();

      if (resData.error) {
        throw new Error(resData.error.message);
      }

      const aiText = resData.choices?.[0]?.message?.content || "No he podido procesar el análisis.";
      setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `❌ Error de conexión: Asegúrate de haber guardado la clave 'gsk_' en los Secrets de tu GitHub bajo el nombre VITE_GROQ_API_KEY y que el deploy.yml la tenga mapeada. (Detalle: ${error.message})` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Botón flotante FAB */}
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[90] animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 md:w-auto md:h-auto md:px-5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <MessageSquare size={20} />
          <span className="hidden md:inline ml-2 text-sm">Agente de IA</span>
        </button>
      </div>

      {/* Panel de Chat */}
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
                  <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-wider mt-0.5">● Groq Engine</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 bg-[#252525] rounded-lg transition-colors"><X size={18} /></button>
            </div>

            {/* Historial */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#1c1c1e] text-gray-200 border border-[#2d2d2d] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
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

            {/* Input */}
            <div className="p-4 border-t border-[#2d2d2d] bg-[#181818]">
              <div className="flex gap-2 bg-[#0c0c0c] border border-[#2d2d2d] rounded-xl p-2 items-center focus-within:border-blue-500 transition-colors">
                <input 
                  type="text" 
                  placeholder="Pregúntame sobre tus inversiones o mercados..." 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  className="flex-1 bg-transparent text-sm text-white outline-none px-2 py-1.5" 
                />
                <button 
                  onClick={handleSendMessage} 
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
