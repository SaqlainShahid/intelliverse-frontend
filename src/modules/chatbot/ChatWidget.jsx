import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, FileText, Database, Sparkles, Bot, ChevronLeft } from 'lucide-react';
import useChatbot from './useChatbot';
import { getMyQueries } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';

// ── Proper markdown renderer ──────────────────────────────────────────────
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null;
  let key = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={key++} className={`my-2 pl-4 space-y-0.5 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}>
        {listBuffer.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  const inlineFormat = (str) =>
    str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

  lines.forEach((line) => {
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const h4 = line.match(/^####\s+(.*)/);
    const ul = line.match(/^[-*]\s+(.*)/);
    const ol = line.match(/^\d+\.\s+(.*)/);

    if (h2) {
      flushList();
      elements.push(<h2 key={key++} className="text-sm font-black text-gray-900 mt-3 mb-1">{h2[1]}</h2>);
    } else if (h3) {
      flushList();
      elements.push(<h3 key={key++} className="text-sm font-bold text-gray-800 mt-2 mb-1">{h3[1]}</h3>);
    } else if (h4) {
      flushList();
      elements.push(<h4 key={key++} className="text-xs font-bold text-gray-700 mt-1.5 mb-0.5">{h4[1]}</h4>);
    } else if (ul) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listBuffer.push(ul[1]);
    } else if (ol) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listBuffer.push(ol[1]);
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={key++} className="h-1" />);
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
  });
  flushList();

  return <div className="space-y-0.5">{elements}</div>;
};

// ── Main component ────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const theme   = getTheme(user?.role);
  const rgb     = theme.primaryRgb || '99,102,241';
  const primary = `rgb(${rgb})`;
  const p       = (a = 1) => `rgba(${rgb},${a})`;

  const [isOpen,       setIsOpen]       = useState(false);
  const [repliesOpen,  setRepliesOpen]  = useState(false);
  const [myQueries,    setMyQueries]    = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [input, setInput] = useState('');

  const { messages, typing, send } = useChatbot();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, isOpen]);

  const loadMyQueries = async () => {
    if (!user?._id) return;
    setRepliesLoading(true);
    try {
      const res = await getMyQueries();
      if (res?.success && Array.isArray(res.data)) setMyQueries(res.data);
    } catch {}
    finally { setRepliesLoading(false); }
  };

  useEffect(() => {
    if (!isOpen || !user?._id) return;
    loadMyQueries();
    const socket = getSocket();
    if (!socket) return;
    socket.on('query:update', loadMyQueries);
    return () => socket.off('query:update', loadMyQueries);
  }, [isOpen, user?._id]);

  const replyItems = useMemo(() => {
    const me = user?._id ? String(user._id) : null;
    return (Array.isArray(myQueries) ? myQueries : [])
      .map(q => {
        const lastAdmin = [...(q.history || [])].reverse().find(h => String(h?.sender) !== me);
        return { id: q._id, message: q.message, tag: q.tag || 'Other', status: q.status, updatedAt: q.updatedAt, lastReply: lastAdmin?.message || null };
      })
      .filter(q => q.lastReply || q.status === 'pending')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [myQueries, user?._id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  return (
    <>
      {/* ── Floating button ── */}
      {createPortal(
        <button
          onClick={() => setIsOpen(o => !o)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl z-[9999] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: isOpen ? '#fff' : `linear-gradient(135deg,${primary},${p(0.75)})`,
            boxShadow: `0 8px 32px ${p(0.35)}`,
            color: isOpen ? primary : '#fff',
          }}
        >
          {isOpen ? <X size={22} /> : <MessageCircle size={24} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white animate-ping"
              style={{ background: primary }} />
          )}
        </button>,
        document.body
      )}

      {/* ── Chat panel ── */}
      {isOpen && createPortal(
        <div className="fixed bottom-28 right-8 w-[400px] max-w-[90vw] h-[72vh] max-h-[660px] flex flex-col rounded-3xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-bottom-6 duration-400"
          style={{ boxShadow: '0 32px 80px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}>

          {/* Header */}
          <div className="shrink-0 px-5 py-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg,${primary},${p(0.80)})` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">IntelliVerse AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setRepliesOpen(o => !o)} title="Helpdesk Replies"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: repliesOpen ? '#fff' : 'rgba(255,255,255,0.15)', color: repliesOpen ? primary : '#fff' }}>
                <Database size={15} />
              </button>
              <button onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Replies panel */}
          {repliesOpen && (
            <div className="absolute inset-0 top-[61px] bg-white z-10 flex flex-col animate-in slide-in-from-right-4 duration-300">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setRepliesOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <h4 className="text-sm font-bold text-gray-900">Departmental Replies</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {replyItems.length ? replyItems.map(q => (
                  <div key={q.id} className="rounded-2xl overflow-hidden border border-gray-100">
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: p(0.05) }}>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                        style={{ background: primary }}>{q.tag}</span>
                      <span className={`text-[10px] font-bold capitalize ${q.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="px-4 py-3 bg-white">
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">Q: {q.message}</p>
                      {q.lastReply && (
                        <div className="rounded-xl p-3" style={{ background: p(0.06), border: `1px solid ${p(0.12)}` }}>
                          <p className="text-xs text-gray-800 leading-relaxed font-medium">{q.lastReply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: p(0.07) }}>
                      <Database size={22} style={{ color: primary }} />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No replies yet</p>
                    <p className="text-xs text-gray-300 mt-1">Check back later</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8f8fb' }}>

            {/* Welcome message if no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg,${primary},${p(0.7)})`, boxShadow: `0 8px 24px ${p(0.28)}` }}>
                  <Bot size={24} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">IntelliVerse AI</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ask me anything about university regulations, policies, or helpdesk queries.
                </p>
                <div className="mt-6 w-full space-y-2">
                  {['What are the exam regulations?', 'How to apply for leave?', 'Fee submission deadline?'].map((q, i) => (
                    <button key={i} onClick={() => { setInput(q); }}
                      className="w-full text-left text-xs px-4 py-2.5 rounded-xl border transition-all hover:-translate-y-0.5 font-medium text-gray-600 hover:text-gray-900"
                      style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.07)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-1 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${primary},${p(0.7)})` }}>
                    <Sparkles size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100/80'
                }`}
                  style={m.role === 'user' ? {
                    background: `linear-gradient(135deg,${primary},${p(0.8)})`,
                    boxShadow: `0 4px 16px ${p(0.25)}`,
                  } : {}}>
                  <MarkdownRenderer text={m.content} />

                  {m.role !== 'user' && m.sources?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100">
                      <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5 tracking-widest">Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s, idx) => (
                          <a key={idx} href={m.sourceUrl || '#'} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
                            style={{ background: p(0.08), color: primary, border: `1px solid ${p(0.15)}` }}>
                            <FileText size={9} />
                            {s.filename}{s.page ? ` p.${s.page}` : ''}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${primary},${p(0.7)})` }}>
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: primary, animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="shrink-0 px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 text-sm py-2.5 px-4 rounded-xl outline-none transition-all bg-gray-50 border border-gray-100 text-gray-800 placeholder:text-gray-400 font-medium"
              style={{ '--ring-color': p(0.2) }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = p(0.35); }}
              onBlur={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = 'rgba(0,0,0,0.07)'; }}
            />
            <button type="submit" disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${primary},${p(0.8)})`, boxShadow: `0 4px 14px ${p(0.30)}` }}>
              <Send size={15} />
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
