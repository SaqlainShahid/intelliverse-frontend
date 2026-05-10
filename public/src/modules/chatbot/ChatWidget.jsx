import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import useChatbot from './useChatbot';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, typing, send } = useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, isOpen]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  return (
    <>
      {createPortal(
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, borderRadius: '50%', background: '#2563eb', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 2147483646, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Toggle chat"
        >
          {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        </button>,
        document.body
      )}

      {isOpen &&
        createPortal(
          <div
            style={{ position: 'fixed', bottom: 96, right: 32, width: 'clamp(360px, 40vw, 680px)', height: '80vh', zIndex: 2147483646, borderRadius: 20, background: '#ffffff', boxShadow: '0 20px 60px rgba(2,6,23,0.20)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ background: '#2563eb', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>AI HelpDesk</span>
              <button onClick={() => setIsOpen(false)} style={{ color: 'rgba(255,255,255,0.9)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 14, background: '#ffffff' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', width: '100%', marginBottom: 10 }}>
                  <div style={{ maxWidth: '94%', borderRadius: 18, padding: '10px 14px', fontSize: 14, lineHeight: 1.5, wordWrap: 'break-word', whiteSpace: 'pre-wrap', background: m.role === 'user' ? '#2563eb' : '#ffffff', color: m.role === 'user' ? '#ffffff' : '#111827', border: m.role === 'user' ? 'none' : '1px solid #e5e7eb' }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '6px 10px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, padding: 12, borderTop: '1px solid #eef2f7', background: '#ffffff' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none' }}
              />
              <button type="submit" disabled={!input.trim()} style={{ background: '#2563eb', color: '#ffffff', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() ? 0.6 : 1 }}>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}
