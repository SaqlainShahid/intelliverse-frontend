import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, CheckCircle, AlertTriangle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { sendAiQuery, getMyQueries } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AskIntelliVerse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isStudent) {
      navigate('/department-dashboard', { replace: true });
    }
  }, [isStudent, navigate]);

  useEffect(() => {
    loadHistory();

    const socket = getSocket();
    if (socket) {
        socket.on('query:update', (updatedQuery) => {
            // Refresh history or update specific message
            // Ideally update state directly, but fetching history is safer for consistency
            loadHistory(); 
            toast.success('New reply received!');
        });
    }

    return () => {
        if (socket) socket.off('query:update');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await getMyQueries();
      if (res.success) {
        // Transform queries into message format
        const history = res.data.flatMap(q => {
          const msgs = [];
          // User Question
          msgs.push({
            id: q._id + '_q',
            type: 'user',
            text: q.message,
            timestamp: q.createdAt,
            status: q.status,
            tag: q.tag
          });
          
          // AI Response or Admin History
          if (q.aiResponse) {
             msgs.push({
               id: q._id + '_a',
               type: 'ai',
               text: q.aiResponse,
               timestamp: q.createdAt,
               tag: q.tag
             });
          }
          
          // Any additional history from admins
          if (q.history && q.history.length > 1) { // >1 because index 0 is original msg
              q.history.slice(1).forEach((h, idx) => {
                  msgs.push({
                      id: q._id + '_h_' + idx,
                      type: h.sender ? 'admin' : 'ai',
                      text: h.message,
                      timestamp: h.createdAt,
                      tag: q.tag
                  });
              });
          }

          // If pending, show system note
          if (q.status === 'pending') {
             msgs.push({
                 id: q._id + '_sys',
                 type: 'system',
                 text: `Your query has been routed to the ${q.tag} Department. An admin will reply shortly.`,
                 timestamp: q.createdAt
             });
          }
          
          return msgs;
        });
        
        // Sort by timestamp
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(history);
      }
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendAiQuery(input);
      if (res.success) {
        const { answer, tag, status } = res.data;
        
        // Update the last user message with real status/tag if needed
        // But simpler to just append AI response
        
        if (answer) {
             setMessages(prev => [...prev, {
                 id: Date.now() + 1,
                 type: 'ai',
                 text: answer,
                 timestamp: new Date().toISOString(),
                 tag
             }]);
        } else {
             setMessages(prev => [...prev, {
                 id: Date.now() + 1,
                 type: 'system',
                 text: `Your query has been tagged as [${tag}] and routed to the department.`,
                 timestamp: new Date().toISOString()
             }]);
        }
      }
    } catch (error) {
      toast.error('Failed to send query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-iv-indigo to-iv-purple p-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">IntelliVerse AI Assistant</h2>
          <p className="text-white/80 text-sm">Ask anything - I'll route it or answer it!</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.type === 'user' ? 'bg-iv-indigo text-white' : 
                msg.type === 'ai' ? 'bg-emerald-500 text-white' :
                'bg-orange-500 text-white' // System/Admin
              }`}>
                {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-iv-indigo text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                
                {/* Meta info */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.tag && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                      {msg.tag}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isStudent ? (
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about exams, fees, hostel, etc..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-iv-indigo/20 focus:border-iv-indigo transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-iv-indigo text-white rounded-xl hover:bg-iv-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-iv-indigo/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Supervisor mode — you can view student queries but cannot submit new ones.
            <button onClick={() => navigate('/department-dashboard')} className="ml-2 underline font-bold hover:text-amber-900">
              Go to Department Dashboard →
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default AskIntelliVerse;