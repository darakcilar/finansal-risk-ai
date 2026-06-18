import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';

export default function Chatbot({ user, apiBase }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Merhaba! Ben Finansal Asistanınızım. Size nasıl yardımcı olabilirim? (Örn: "Kredi çekmeli miyim?", "Kredi kartı limitimi artırabilir miyim?")' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, message: userMessage })
      });
      const data = await response.json();
      
      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Üzgünüm, asistan şu an yanıt veremiyor.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Bağlantı hatası oluştu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes bounceAndGlow {
          0% { transform: translateY(0); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          50% { transform: translateY(-15px); box-shadow: 0 0 0 20px rgba(56, 189, 248, 0); }
          100% { transform: translateY(0); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        .chat-fab-bubble {
          animation: bounceAndGlow 3s infinite ease-in-out;
        }
      `}</style>
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="chat-fab-bubble"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '2.5rem',
            width: '65px',
            height: '65px',
            borderRadius: '50%',
            backgroundColor: 'var(--sky-blue)',
            backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
          }}
        >
          <Bot size={32} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '350px',
          height: '500px',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: '1px solid var(--border-glass)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <span style={{ fontWeight: '600', color: '#fff' }}>Finansal Asistan</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? 'var(--sky-blue)' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '0.8rem 1rem',
                borderRadius: '1rem',
                borderBottomRightRadius: msg.sender === 'user' ? '0.2rem' : '1rem',
                borderBottomLeftRadius: msg.sender === 'bot' ? '0.2rem' : '1rem',
                maxWidth: '85%',
                fontSize: '0.9rem',
                lineHeight: '1.4',
                textAlign: 'left'
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.8rem 1rem',
                borderRadius: '1rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                Yazıyor...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Bir soru sorun..."
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '2rem',
                padding: '0.6rem 1rem',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: 'var(--sky-blue)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                opacity: (isLoading || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
