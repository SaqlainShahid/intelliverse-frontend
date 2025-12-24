import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import useChatbot from './useChatbot';
import { getMyQueries } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, typing, send, clear } = useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [myQueries, setMyQueries] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(true);
  const linkify = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(https?:\/\/[^\s)]+)/g);
    return parts.map((part, idx) =>
      /^https?:\/\//.test(part)
        ? <a key={idx} href={part} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{part}</a>
        : part
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, isOpen]);

  const loadMyQueries = async () => {
    if (!user?._id) return;
    try {
      setRepliesLoading(true);
      const res = await getMyQueries();
      if (res?.success && Array.isArray(res.data)) setMyQueries(res.data);
    } catch {
    } finally {
      setRepliesLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !user?._id) return;
    loadMyQueries();

    const socket = getSocket();
    if (!socket) return;

    const onQueryUpdate = () => {
      loadMyQueries();
    };

    socket.on('query:update', onQueryUpdate);
    return () => socket.off('query:update', onQueryUpdate);
  }, [isOpen, user?._id]);

  const replyItems = useMemo(() => {
    const myUserId = user?._id ? String(user._id) : null;
    const list = Array.isArray(myQueries) ? myQueries : [];
    const enriched = list.map((q) => {
      const history = Array.isArray(q.history) ? q.history : [];
      const lastAdmin = myUserId
        ? [...history].reverse().find((h) => {
          const sender = h?.sender;
          const senderId = typeof sender === 'string' ? sender : sender?._id;
          if (!senderId) return false;
          return String(senderId) !== myUserId;
        })
        : null;
      return {
        id: q._id,
        message: q.message,
        tag: q.tag || 'Other',
        status: q.status,
        updatedAt: q.updatedAt,
        createdAt: q.createdAt,
        lastReply: lastAdmin?.message || null,
      };
    });
    return enriched
      .filter((q) => q.lastReply || q.status === 'pending')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user?._id ? (
                  <button
                    type="button"
                    onClick={() => setRepliesOpen((v) => !v)}
                    style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '4px 8px', background: 'transparent' }}
                  >
                    {repliesOpen ? 'Hide replies' : 'Show replies'}
                  </button>
                ) : null}
                <button onClick={async () => { await clear(); }} style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '4px 8px', background: 'transparent' }}>
                  Clear Chat
                </button>
                <button onClick={() => setIsOpen(false)} style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {user?._id && repliesOpen ? (
              <div style={{ borderBottom: '1px solid #eef2f7', padding: 12, background: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>Department Replies</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {repliesLoading ? 'Loading…' : `${replyItems.length} item(s)`}
                  </span>
                </div>
                {replyItems.length ? (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 120, overflowY: 'auto' }}>
                    {replyItems.slice(0, 3).map((q) => (
                      <div key={q.id} style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: 14, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{q.tag}</span>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{String(q.status || '').toUpperCase()}</span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{q.message}</div>
                        {q.lastReply ? (
                          <div style={{ marginTop: 6, fontSize: 13, color: '#111827', whiteSpace: 'pre-wrap' }}>{q.lastReply}</div>
                        ) : (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>No admin reply yet.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>No pending queries or replies yet.</div>
                )}
              </div>
            ) : null}

            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 14, background: '#ffffff' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', width: '100%', marginBottom: 10 }}>
                  <div style={{ maxWidth: '94%', borderRadius: 18, padding: '10px 14px', fontSize: 14, lineHeight: 1.5, wordWrap: 'break-word', whiteSpace: 'pre-wrap', background: m.role === 'user' ? '#2563eb' : '#ffffff', color: m.role === 'user' ? '#ffffff' : '#111827', border: m.role === 'user' ? 'none' : '1px solid #e5e7eb' }}>
                    {linkify(m.content)}
                    {m.role !== 'user' && m.sources && m.sources.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563' }}>
                        Source: {m.sources[0].filename}{m.sources[0].page ? ` (page ${m.sources[0].page})` : ''}
                        {(m.sourceUrl || m.sourceUrlRelative) ? (
                          <span> • <a href={m.sourceUrl || m.sourceUrlRelative} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Open PDF</a></span>
                        ) : null}
                      </div>
                    )}
                    {m.role !== 'user' && typeof m.confidence === 'number' ? (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>Confidence: {(m.confidence * 100).toFixed(0)}%</div>
                    ) : null}
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
