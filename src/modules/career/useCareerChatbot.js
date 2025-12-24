import { useEffect, useState } from 'react';
import { chat, getChatHistory, clearChatHistory } from '../api/careerApi';
import { useAuth } from '../../contexts/AuthContext';

export default function useCareerChatbot() {
  const { user } = useAuth();
  const storageKey = `career_chat_history_${user?._id || 'anon'}`;
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [preferredSkills, setPreferredSkills] = useState('');
  const [intent, setIntent] = useState('roles');
  const [abortController, setAbortController] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let loaded = false;
        if (user?._id) {
          const { messages: serverMsgs } = await getChatHistory(200);
          if (Array.isArray(serverMsgs) && serverMsgs.length) {
            const normalized = serverMsgs.map((m) => ({
              id: m._id || (Date.now() + Math.random()).toString(),
              role: m.role,
              content: m.content,
            }));
            setMessages(normalized);
            try {
              localStorage.setItem(storageKey, JSON.stringify(normalized));
            } catch {}
            loaded = true;
          }
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
            content:
              'Welcome to the AI Career Guidance Portal. Ask me about internships that match your skills, career paths, and resume improvements.',
          };
          setMessages([intro]);
          try {
            localStorage.setItem(storageKey, JSON.stringify([intro]));
          } catch {}
        }
      } catch {}
    })();
  }, [storageKey, user?._id]);

  const send = async (text, forcedIntent) => {
    const userMsg = { role: 'user', content: text, id: Date.now() + '-u' };
    const nextUserMessages = [...messages, userMsg];
    setMessages(nextUserMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextUserMessages));
    } catch {}
    setTyping(true);
    try {
      const controller = new AbortController();
      setAbortController(controller);
      const t = String(text || '').toLowerCase().trim();
      const localIntent =
        forcedIntent
          ? forcedIntent
          : /^(hi|hello|hey|salam|assalam|assalamu|yo|sup)\b/.test(t) ||
            t.length <= 3 ||
            /\b(help|start|info|guide|assist)\b/.test(t)
              ? 'greeting'
              : intent;
      const skillsArr = preferredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await chat({ message: text, skills: skillsArr, intent: localIntent, signal: controller.signal });
      const confScore =
        (skillsArr.length >= 2 ? 2 : skillsArr.length === 1 ? 1 : 0) +
        (t.length > 5 ? 1 : 0) +
        (localIntent !== 'greeting' ? 1 : 0);
      const confidence = confScore >= 3 ? 'High' : confScore === 2 ? 'Medium' : 'Low';
      const aiMsg = {
        role: 'assistant',
        content: result.answer || 'No response',
        id: Date.now() + '-a',
        meta: { intent: localIntent, confidence },
      };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextMessages));
      } catch {}
      setTyping(false);
      setAbortController(null);
      return result;
    } catch (e) {
      if (e && (e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.name === 'AbortError')) {
        setTyping(false);
        setAbortController(null);
        return {};
      }
      const aiMsg = {
        role: 'assistant',
        content: 'Sorry, I could not process that right now. Please try again.',
        id: Date.now() + '-e',
      };
      const nextMessages = [...nextUserMessages, aiMsg];
      setMessages(nextMessages);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextMessages));
      } catch {}
      setTyping(false);
      setAbortController(null);
      return {};
    }
  };

  const cancel = () => {
    try {
      abortController?.abort();
    } catch {}
    setTyping(false);
    setAbortController(null);
  };

  const clear = async () => {
    try {
      if (user?._id) {
        await clearChatHistory();
      }
    } catch {}
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return { messages, typing, send, clear, preferredSkills, setPreferredSkills, intent, setIntent, cancel };
}
