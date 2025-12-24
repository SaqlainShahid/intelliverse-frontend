import { useState, useEffect } from 'react';
import { ask, getHistory, clearHistory } from '../api/chatbotApi';
import { useAuth } from '../../contexts/AuthContext';

export default function useChatbot() {
  const { user } = useAuth();
  const storageKey = `chatbot_history_${user?._id || 'anon'}`;
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  const loadServerHistory = async () => {
    const { messages: serverMsgs } = await getHistory(200);
    if (!Array.isArray(serverMsgs)) return;
    const normalized = serverMsgs.map(m => ({
      id: m._id || (Date.now() + Math.random()).toString(),
      role: m.role,
      content: m.content,
      sources: m.sources || [],
      sourceUrlRelative: m.sourceUrlRelative || null,
      sourceUrl: m.sourceUrl || null,
      confidence: m.confidence || 0,
    }));
    setMessages(normalized);
    try { localStorage.setItem(storageKey, JSON.stringify(normalized)); } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        let loaded = false;
        if (user?._id) {
          await loadServerHistory();
          loaded = true;
        }
        if (!loaded) {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
              setMessages(parsed);
              loaded = true;
            }
          }
        }
        if (!loaded) {
          const intro = {
            id: Date.now() + '-intro',
            role: 'assistant',
            content: 'Welcome! I’m IntelliVerse AI FAQ Chatbot. I can help with academic regulations and the academic calendar. How can I assist you today?',
            sources: [],
            sourceUrlRelative: null,
            sourceUrl: null,
            confidence: 0
          };
          setMessages([intro]);
          try { localStorage.setItem(storageKey, JSON.stringify([intro])); } catch {}
        }
      } catch {}
    })();
  }, [storageKey]);

  const send = async (text) => {
    const userMsg = { role: 'user', content: text, id: Date.now() + '-u' };
    const nextUserMessages = [...messages, userMsg];
    setMessages(nextUserMessages);
    try { localStorage.setItem(storageKey, JSON.stringify(nextUserMessages)); } catch {}
    setTyping(true);
    try {
      const result = await ask(text);
      const { answer, confidence = 0, escalated = false, ticketId, sources = [], sourceUrlRelative = null, sourceUrl = null } = result;
      const friendlyFallback = 'Sorry, this information is not available in the academic regulations document.';
      const base = answer && answer.trim().length ? answer.trim() : friendlyFallback;
      const sourceLine = sources && sources.length ? `\n\nSource: ${sources[0].filename}${sources[0].page ? ` (page ${sources[0].page})` : ''}` : '';
      const aiMsg = { role: 'assistant', content: base + sourceLine, id: Date.now() + '-a', sources, sourceUrlRelative, sourceUrl, confidence, escalated, ticketId };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try { localStorage.setItem(storageKey, JSON.stringify(nextMessages)); } catch {}
      setTyping(false);
      return { confidence, escalated, ticketId };
    } catch (e) {
      const aiMsg = { role: 'assistant', content: 'Sorry, I could not load the answer right now. Please try again in a moment.', id: Date.now() + '-e' };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try { localStorage.setItem(storageKey, JSON.stringify(nextMessages)); } catch {}
      setTyping(false);
      return { confidence: 0, escalated: false };
    }
  };

  const clear = async () => {
    try {
      if (user?._id) {
        await clearHistory();
      }
    } catch {}
    setMessages([]);
    try { localStorage.removeItem(storageKey); } catch {}
  };

  return { messages, typing, send, clear };
}
