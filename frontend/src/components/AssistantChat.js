import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola! Soy el asistente de Gym24. Puedo ayudarte a crear negocios, configurar socios, planes, y resolver cualquier duda sobre la plataforma. ¿En que puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post(`${API}/assistant/chat`, { messages: chatHistory });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al conectar con el asistente';
      setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, hubo un error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF6600, #E65C00)', boxShadow: '0 4px 20px rgba(255,102,0,0.4)' }}
        data-testid="assistant-open-btn"
      >
        <MessageCircle size={24} color="white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col" style={{ height: '520px', maxHeight: 'calc(100vh - 2rem)' }} data-testid="assistant-chat-window">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #FF6600, #E65C00)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={20} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Asistente Gym24</p>
            <p className="text-white/60 text-[10px]">Siempre disponible</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid="assistant-minimize-btn">
            <Minimize2 size={16} color="white" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid="assistant-close-btn">
            <X size={16} color="white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#0a0a0a' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-zinc-700' : ''}`}
              style={msg.role === 'assistant' ? { background: 'rgba(255,102,0,0.15)' } : {}}>
              {msg.role === 'assistant' ? <Bot size={14} style={{ color: '#FF6600' }} /> : <User size={14} className="text-zinc-400" />}
            </div>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-zinc-800 text-white rounded-br-sm' 
                : 'rounded-bl-sm text-zinc-200'
            }`}
              style={msg.role === 'assistant' ? { background: '#141414', border: '1px solid rgba(255,102,0,0.08)' } : {}}
            >
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>
                  {line.startsWith('**') && line.endsWith('**') 
                    ? <strong style={{ color: '#FF6600' }}>{line.replace(/\*\*/g, '')}</strong>
                    : line.startsWith('- ') 
                      ? <span className="block pl-2 py-0.5">{line}</span>
                      : line
                  }
                  {j < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,102,0,0.15)' }}>
              <Bot size={14} style={{ color: '#FF6600' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: '#141414', border: '1px solid rgba(255,102,0,0.08)' }}>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 rounded-b-2xl" style={{ background: '#0C0C0C', borderTop: '1px solid rgba(255,102,0,0.08)' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            rows={1}
            className="flex-1 resize-none bg-zinc-900 text-white text-sm px-4 py-3 rounded-xl border border-zinc-800 focus:border-orange-500/50 focus:outline-none placeholder-zinc-600 max-h-[100px]"
            style={{ minHeight: '44px' }}
            data-testid="assistant-input"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl transition-all disabled:opacity-30"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #FF6600, #E65C00)' : '#1a1a1a' }}
            data-testid="assistant-send-btn"
          >
            {loading ? <Loader2 size={18} color="white" className="animate-spin" /> : <Send size={18} color="white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
