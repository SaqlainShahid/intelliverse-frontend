import { useState, useEffect } from 'react';
import { ask, escalate } from '../api/chatbotApi';
import { useAuth } from '../../contexts/AuthContext';

export default function useChatbot() {
  const { user } = useAuth();
  const storageKey = `chatbot_history_${user?._id || 'anon'}`;
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, [storageKey]);

  const send = async (text) => {
    const userMsg = { role: 'user', content: text, id: Date.now() + '-u' };
    const nextUserMessages = [...messages, userMsg];
    setMessages(nextUserMessages);
    try { localStorage.setItem(storageKey, JSON.stringify(nextUserMessages)); } catch {}
    setTyping(true);
    try {
      const res = await ask(text);
      const { answer, confidence, escalated, ticketId } = res.data;
      const aiMsg = { role: 'assistant', content: answer || 'I am not sure about this. Escalating to HelpDesk.', id: Date.now() + '-a' };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try { localStorage.setItem(storageKey, JSON.stringify(nextMessages)); } catch {}
      setTyping(false);
      return { confidence, escalated, ticketId };
    } catch (e) {
      const aiMsg = { role: 'assistant', content: 'Something went wrong. I will escalate this.', id: Date.now() + '-e' };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try { localStorage.setItem(storageKey, JSON.stringify(nextMessages)); } catch {}
      setTyping(false);
      try { await escalate({ query: text, aiAnswer: '', confidence: 0 }); } catch {}
      return { confidence: 0, escalated: true };
    }
  };

  return { messages, typing, send };
}
