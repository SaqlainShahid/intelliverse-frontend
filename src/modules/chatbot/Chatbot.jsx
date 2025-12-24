import React, { useEffect, useMemo, useState } from 'react';
import useChatbot from './useChatbot';
import { getMyQueries } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';

export default function Chatbot({ header = true, compact = false }) {
  const { user } = useAuth();
  const { messages, typing, send } = useChatbot();
  const [input, setInput] = useState('');
  const [myQueries, setMyQueries] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(true);

  const loadMyQueries = async () => {
    try {
      setRepliesLoading(true);
      const res = await getMyQueries();
      if (res?.success && Array.isArray(res.data)) {
        setMyQueries(res.data);
      }
    } catch {
    } finally {
      setRepliesLoading(false);
    }
  };

  useEffect(() => {
    loadMyQueries();
    const socket = getSocket();
    if (!socket) return;

    const onQueryUpdate = () => {
      loadMyQueries();
    };

    socket.on('query:update', onQueryUpdate);
    return () => socket.off('query:update', onQueryUpdate);
  }, []);

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
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        lastReply: lastAdmin?.message || null,
        lastReplyAt: lastAdmin?.createdAt || null,
      };
    });
    return enriched
      .filter((q) => q.lastReply || q.status === 'pending')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [myQueries]);

  const linkify = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(https?:\/\/[^\s)]+)/g);
    return parts.map((part, idx) =>
      /^https?:\/\//.test(part)
        ? <a key={idx} href={part} target="_blank" rel="noreferrer" className="text-green-700 underline">{part}</a>
        : part
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  return (
    <div className={`w-full ${compact ? 'h-full' : 'max-w-md mx-auto'} bg-white border border-green-200 rounded-2xl shadow-sm flex flex-col`}>
      {header && (
        <div className="px-4 py-3 bg-green-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">AI HelpDesk Assistant</h2>
            <button
              type="button"
              onClick={() => setRepliesOpen((v) => !v)}
              className="text-white/90 hover:text-white text-xs underline"
            >
              {repliesOpen ? 'Hide replies' : 'Show replies'}
            </button>
          </div>
        </div>
      )}

      {repliesOpen && (
        <div className="px-4 py-3 border-b border-green-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">Department Replies</div>
            <div className="text-xs text-gray-500">
              {repliesLoading ? 'Loading…' : `${replyItems.length} item(s)`}
            </div>
          </div>

          {replyItems.length > 0 ? (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {replyItems.slice(0, 5).map((q) => (
                <div key={q.id} className="bg-white border border-green-100 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-gray-700">{q.tag}</div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full ${
                      q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      q.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      q.status === 'escalated' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {String(q.status || '').toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 line-clamp-2">{q.message}</div>
                  {q.lastReply ? (
                    <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{q.lastReply}</div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">No admin reply yet.</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">
              No pending queries or replies yet.
            </div>
          )}
        </div>
      )}

      <div className={`p-4 space-y-3 ${compact ? 'flex-1 overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`${m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-xl max-w-[80%]`}>
              {linkify(m.content)}
              {m.role !== 'user' && m.sources && m.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Source: {m.sources[0].filename}{m.sources[0].page ? ` (page ${m.sources[0].page})` : ''}
                  {(m.sourceUrl || m.sourceUrlRelative) ? (
                    <span> • <a href={m.sourceUrl || m.sourceUrlRelative} target="_blank" rel="noreferrer" className="text-green-700 underline">Open PDF</a></span>
                  ) : null}
                </div>
              )}
              {m.role !== 'user' && typeof m.confidence === 'number' ? (
                <div className="mt-1 text-[11px] text-gray-500">Confidence: {(m.confidence * 100).toFixed(0)}%</div>
              ) : null}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse"></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="p-4 border-t border-green-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Send</button>
      </form>
    </div>
  );
}
