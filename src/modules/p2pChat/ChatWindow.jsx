import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMessages, getMutedUsers, muteUser, unmuteUser } from '../../services/chatService';
import { searchMessages, getChatDetails } from '../../services/chatService';
import { VolumeX, Volume2, Archive, ArchiveRestore, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupInfoPanel from './GroupInfoPanel';

export default function ChatWindow({ chat, socket, currentUserId, isArchived, onArchive, onUnarchive, onLeftGroup }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [isChatAdmin, setIsChatAdmin] = useState(false);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef(null);
  const { user } = useAuth();

  const isReadOnly = !!announcementOnly && !isChatAdmin;
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [pollDeadline, setPollDeadline] = useState('');
  const [mutedUserIds, setMutedUserIds] = useState(new Set());
  const [pendingMute, setPendingMute] = useState(false);
  const chatRef = useRef(chat);
  useEffect(() => { chatRef.current = chat; }, [chat]);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!chat?._id) return;
    isInitialLoad.current = true;
    setLoadingMessages(true);

    (async () => {
      // Fire all three requests in parallel — no sequential waiting
      const [msgRes, detRes, mutedRes] = await Promise.allSettled([
        getMessages(chat._id, 40),
        getChatDetails(chat._id),
        getMutedUsers(),
      ]);

      if (msgRes.status === 'fulfilled' && msgRes.value?.success) {
        setMessages(msgRes.value.data.reverse());
        setLoadingMessages(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
          isInitialLoad.current = false;
        }, 0);
      } else {
        setLoadingMessages(false);
      }

      if (detRes.status === 'fulfilled' && detRes.value?.success && detRes.value.data) {
        const d = detRes.value.data;
        setPinned(d.pinnedMessageIds || []);
        setAnnouncementOnly(!!(d.settings?.announcementOnly));
        const adminIds = (d.admins || []).map(a => (a?._id || a)?.toString());
        setIsChatAdmin(adminIds.includes(currentUserId?.toString()));
        setChatParticipants(d.participants || []);
      }

      if (mutedRes.status === 'fulfilled' && mutedRes.value?.success && Array.isArray(mutedRes.value.data)) {
        setMutedUserIds(new Set(mutedRes.value.data.map(u => u._id)));
      }
    })();
  }, [chat?._id, chat?.otherUser?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;
    socket.emit('chat:join', chat._id);
    const onNew = (m) => {
      if (m.chat !== chat._id) return;
      const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
      if (mutedUserIds.has(senderId)) return;
      setMessages((prev) => {
        // Skip if exact ID already exists OR if it's our own message (already added optimistically)
        if (prev.some(x => x._id === m._id)) return prev;
        // Replace matching optimistic message from same sender
        const hasOptimistic = prev.some(
          x => x._optimistic && String(senderId) === String(currentUserId) && x.content === m.content
        );
        if (hasOptimistic) {
          return prev.map(x =>
            (x._optimistic && String(senderId) === String(currentUserId) && x.content === m.content)
              ? { ...m } : x
          );
        }
        return [...prev, m];
      });
      if (m.recipient === currentUserId || (!m.recipient && m.sender !== currentUserId)) {
        socket.emit('message:received', { messageId: m._id });
      }
    };
    const onReactions = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };
    const onPins = ({ chatId, pinnedMessageIds }) => {
      if (chatId !== chat._id) return;
      setPinned(pinnedMessageIds || []);
    };
    const onSettings = ({ chatId, settings }) => {
      if (chatId !== chat._id) return;
      setAnnouncementOnly(!!(settings && settings.announcementOnly));
    };
    const onEdited = ({ messageId, content, editedAt, editCount }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, content, editedAt, editCount } : m)));
    };
    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, deletedAt: Date.now(), content: '', attachments: [] } : m)));
    };
    const onPollUpdate = ({ messageId, poll }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, poll: { ...(m.poll || {}), ...(poll || {}) }, type: 'poll' } : m)));
    };
    const onDelivered = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, status: 'delivered' } : m)));
    };
    const onSeen = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, status: 'seen' } : m)));
    };
    const onTyping = ({ chatId, userId, typing }) => {
      if (chatId !== chat._id || userId === currentUserId) return;
      setTypingUsers((t) => ({ ...t, [userId]: typing }));
    };
    socket.on('message:new', onNew);
    socket.on('message:reactions', onReactions);
    socket.on('chat:pins', onPins);
    socket.on('chat:settings', onSettings);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('poll:update', onPollUpdate);
    socket.on('message:delivered', onDelivered);
    socket.on('message:seen', onSeen);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:reactions', onReactions);
      socket.off('chat:pins', onPins);
      socket.off('chat:settings', onSettings);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('poll:update', onPollUpdate);
      socket.off('message:delivered', onDelivered);
      socket.off('message:seen', onSeen);
      socket.off('typing', onTyping);
    };
  }, [socket, chat?._id, chat?.otherUser?._id, currentUserId, mutedUserIds]);

  // Scroll: instant on initial load, smooth for new incoming
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: isInitialLoad.current ? 'instant' : 'smooth'
    });
  }, [messages]);

  useEffect(() => {
    const unseenPrivate = messages.filter((m) => m.recipient === currentUserId && m.status !== 'seen');
    const unseenGroup = messages.filter((m) => !m.recipient && m.sender !== currentUserId);
    if (socket) {
      unseenPrivate.forEach((m) => socket.emit('message:seen', { messageId: m._id }));
      unseenGroup.forEach((m) => socket.emit('message:seen', { messageId: m._id }));
    }
  }, [messages, currentUserId, socket]);

  const otherUserId = chat.otherUser?._id;
  const isMuted = otherUserId ? mutedUserIds.has(otherUserId) : false;

  const refreshMuteState = async () => {
    try {
      const muted = await getMutedUsers();
      if (muted?.success && Array.isArray(muted.data)) {
        setMutedUserIds(new Set(muted.data.map(u => u._id)));
      }
    } catch {}
  };
  const handleMuteToggle = async (targetId) => {
    if (!targetId || pendingMute) return;
    try {
      setPendingMute(true);
      const isCurrentlyMuted = mutedUserIds.has(targetId);
      if (isCurrentlyMuted) {
        const res = await unmuteUser(targetId);
        if (res?.success) {
            setMutedUserIds(prev => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
            toast.success('User unmuted');
        }
      } else {
        const res = await muteUser(targetId);
        if (res?.success) {
            setMutedUserIds(prev => {
                const next = new Set(prev);
                next.add(targetId);
                return next;
            });
            toast.success('User muted');
        }
      }
      await refreshMuteState();
    } catch {
        toast.error('Failed to update mute status');
    } finally {
      setPendingMute(false);
    }
  };
  
  const toggleMute = () => handleMuteToggle(otherUserId);

  // Optimistic send: show immediately, reconcile on ACK
  const sendMessage = (text) => {
    if (!text?.trim() && !replyTo) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMsg = {
      _id: tempId,
      chat: chat._id,
      sender: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyTo: replyTo || null,
      _optimistic: true,
    };
    // Show instantly
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyTo(null);

    socket.emit('message:send', {
      chatId: chat._id,
      recipientId: otherUserId,
      content: text,
      replyTo: replyTo?._id || null
    }, (ack) => {
      if (ack?.ok && ack.message) {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => m._id === tempId ? { ...ack.message, status: ack.message.status || 'sent' } : m)
        );
      } else {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) => m._id === tempId ? { ...m, status: 'failed' } : m)
        );
      }
    });
  };

  const setTyping = (typing) => {
    socket.emit('typing', { chatId: chat._id, recipientId: otherUserId, typing });
  };

  useEffect(() => {
    const handler = (e) => {
      const att = e.detail;
      if (!socket || !chat?._id || !att) return;
      const payload = { chatId: chat._id, content: '', attachments: [att], replyTo: replyTo?._id || null };
      if (otherUserId) payload.recipientId = otherUserId;
      socket.emit('message:send', payload, (ack) => {
        if (ack?.ok && ack.message) {
          setMessages((prev) => (prev.some(x => x._id === ack.message._id) ? prev : [...prev, ack.message]));
          setReplyTo(null);
        }
      });
    };
    window.addEventListener('chat:send-attachment', handler);
    return () => window.removeEventListener('chat:send-attachment', handler);
  }, [socket, chat?._id, otherUserId, replyTo]);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      if (!payload || payload.chatId !== chat._id) return;
      setAnnouncementOnly(!!(payload.settings && payload.settings.announcementOnly));
    };
    window.addEventListener('chat:settings', handler);
    return () => window.removeEventListener('chat:settings', handler);
  }, [chat?._id]);

  useEffect(() => {
    const q = (search || '').trim();
    const chatId = chat?._id;
    const run = async () => {
      if (!chatId || !q) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await searchMessages(chatId, q, 20);
        if (res?.success) setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [search, chat?._id]);

  const isGroup = chat?.type === 'group' || (!chat?.otherUser && !!chat?.group);
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full relative overflow-hidden">
      {/* Loading progress bar — thin stripe at very top */}
      {loadingMessages && (
        <div className="absolute top-0 left-0 right-0 h-[2px] z-50 overflow-hidden">
          <div className="h-full animate-[shimmer_1s_ease-in-out_infinite]"
            style={{ background: 'linear-gradient(90deg,transparent 0%,#6d28d9 40%,#a855f7 60%,transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1s ease-in-out infinite' }} />
        </div>
      )}
      {/* ── Chat Top Bar ── */}
      <div className="relative px-5 py-3 flex items-center gap-4 z-20"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* Avatar with purple ring */}
        <div className="relative shrink-0 cursor-pointer" onClick={() => {
          if (isGroup) navigate(`/groups/${chat._id}`);
          else if (chat.otherUser?._id) navigate(`/profile/${chat.otherUser._id}`);
        }}>
          <div className="p-[3px] rounded-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1, #a855f7)' }}>
            <div className="h-11 w-11 rounded-full flex items-center justify-center overflow-hidden bg-white">
              {chat.otherUser?.profile?.avatar ? (
                <img src={chat.otherUser.profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-violet-600">
                  {(chat.otherUser?.profile?.firstName || chat.group?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-gray-900 truncate">
            {isGroup ? (chat.group?.name || chat.name) : `${chat.otherUser?.profile?.firstName || ''} ${chat.otherUser?.profile?.lastName || ''}`.trim()}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {Object.values(typingUsers).some(Boolean) ? (
              <span className="text-[11px] font-semibold text-violet-500 animate-pulse">typing...</span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE NOW
              </span>
            )}
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <div className="relative">
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-0 focus:w-36 transition-all duration-300 text-sm rounded-full bg-gray-100 px-3 py-1.5 outline-none focus:ring-1 focus:ring-violet-300 opacity-0 focus:opacity-100 absolute right-10 top-1/2 -translate-y-1/2"
            />
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition-colors" onClick={() => {
              const el = document.querySelector('[placeholder="Search..."]');
              if (el) el.focus();
            }}>
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            </button>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition-colors" title="Info"
            onClick={() => { if (isGroup) setShowInfo(s => !s); else if (chat.otherUser?._id) navigate(`/profile/${chat.otherUser._id}`); }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          </button>

          {/* Archive/Mute (keep existing but smaller) */}
          {onArchive && (
            <button onClick={isArchived ? onUnarchive : onArchive}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isArchived ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:bg-gray-100 hover:text-violet-600'}`}
              title={isArchived ? 'Unarchive' : 'Archive'}>
              {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>
          )}
          {!!otherUserId && (
            <button onClick={toggleMute} disabled={pendingMute}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-gray-100 hover:text-rose-500'}`}
              title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          {isGroup && (
            <button onClick={() => setShowMenu((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showMenu ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:bg-gray-100'}`}>
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating Menu Popover */}
        {showMenu && (
          <div className="absolute right-6 top-full mt-2 w-56 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <button onClick={() => { setShowInfo((s) => !s); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">ℹ️</span>
                Group Info
              </button>
              <button onClick={() => { setShowPollForm((s) => !s); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">📊</span>
                Create Poll
              </button>
              <div className="h-px bg-gray-50 mx-4" />
              <button onClick={async () => {
                try {
                  const { leaveGroup } = await import('../../services/chatService');
                  const r = await leaveGroup(chat._id);
                  setShowMenu(false);
                  if (r?.success) {
                    if (typeof onLeftGroup === 'function') onLeftGroup();
                    toast.success('Left group');
                  }
                } catch { toast.error('Unable to leave'); }
              }}
              className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">🚪</span>
                Leave Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Message Area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scroll-smooth relative"
        style={{
          background: 'linear-gradient(135deg, #faf8ff 0%, #f3eeff 25%, #fde8f0 50%, #ede7ff 75%, #f5f0ff 100%)',
        }}
      >
        {/* Ambient mesh glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{ position:'absolute', top:'10%', right:'5%', width:350, height:350, background:'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)', borderRadius:'50%', filter:'blur(60px)' }} />
          <div style={{ position:'absolute', bottom:'10%', left:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(236,72,153,0.08), transparent 70%)', borderRadius:'50%', filter:'blur(50px)' }} />
          <div style={{ position:'absolute', top:'50%', left:'40%', width:250, height:250, background:'radial-gradient(circle, rgba(129,140,248,0.08), transparent 70%)', borderRadius:'50%', filter:'blur(45px)' }} />
        </div>
        <div className="relative" style={{ zIndex: 1 }}>
        {isGroup && showInfo && (
          <div className="animate-in slide-in-from-top duration-300">
            <GroupInfoPanel chat={chat} mutedUserIds={mutedUserIds} onMuteToggle={handleMuteToggle} />
          </div>
        )}

        {isGroup && showPollForm && (
          <div className="mb-6 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-2xl shadow-indigo-900/5 animate-in zoom-in-95 duration-300 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl">📊</div>
              <div>
                <h4 className="text-lg font-black text-gray-900">Create a Poll</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Get feedback from the group</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Question</label>
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={`opt-${idx}`} className="flex items-center gap-2 group">
                    <input
                      value={opt}
                      onChange={(e) => setPollOptions((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 focus:bg-white text-sm font-medium transition-all"
                    />
                    <button
                      onClick={() => setPollOptions((arr) => arr.filter((_, i) => i !== idx))}
                      className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setPollOptions((arr) => [...arr, ''])}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  + Add Option
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={pollDeadline}
                    onChange={(e) => setPollDeadline(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" checked={pollMultiple} onChange={(e) => setPollMultiple(!!e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Multiple Choice</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const question = (pollQuestion || '').trim();
                    const options = pollOptions.map(o => (o || '').trim()).filter(Boolean);
                    if (!question || options.length < 2) return toast.error('Add a question and at least 2 options');
                    const payload = {
                      chatId: chat._id,
                      poll: { question, options: options.map(text => ({ text })), multiple: pollMultiple, deadline: pollDeadline || null },
                      content: ''
                    };
                    socket.emit('message:send', payload, (ack) => {
                      if (ack?.ok && ack.message) {
                        setMessages((prev) => [...prev, ack.message]);
                        setShowPollForm(false);
                        setPollQuestion('');
                        setPollOptions(['', '']);
                      }
                    });
                  }}
                  className="flex-1 bg-indigo-600 text-white rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all"
                >Launch Poll</button>
                <button
                  onClick={() => { setShowPollForm(false); }}
                  className="px-6 rounded-2xl border border-gray-200 text-gray-500 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="mx-auto max-w-md bg-amber-50/80 backdrop-blur-sm border border-amber-100 rounded-2xl px-5 py-3 text-center shadow-sm animate-in slide-in-from-top duration-300">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
              📣 Announcements Only
            </span>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Only the broadcaster can post in this channel.</p>
          </div>
        )}

        {!!(pinned && pinned.length) && (
          <div className="flex flex-col gap-2 relative z-10 sticky top-0">
            {messages.filter(m => pinned.includes(m._id)).map(m => (
              <div key={`pin-${m._id}`} className="bg-indigo-600/95 backdrop-blur-md shadow-xl rounded-2xl p-4 flex items-center gap-4 text-white animate-in slide-in-from-right duration-500 border border-indigo-400 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">📌</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Pinned Message</p>
                  <p className="text-sm font-bold truncate">{m.content || 'Media Content'}</p>
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => socket.emit('message:pin', { chatId: chat._id, messageId: m._id })}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!!search.trim() && (
          <div className="mb-4 bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-[2rem] shadow-2xl p-2 max-w-lg mx-auto overflow-hidden animate-in fade-in duration-300">
            <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center justify-between">
              <span>Found in conversation</span>
              <span>{searchResults.length} results</span>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-400 font-bold text-xs italic">No matching words found</div>
              ) : (
                searchResults.map((m) => (
                  <button
                    key={`search-${m._id}`}
                    className="w-full text-left p-4 hover:bg-indigo-50/50 rounded-2xl transition-all group"
                    onClick={() => {
                      const el = document.getElementById(`message-${m._id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <div className="text-sm font-bold text-gray-800 line-clamp-2">{(m.content && m.content.trim()) ? m.content : 'Attachment'}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{new Date(m.createdAt).toLocaleDateString()} at {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Skeleton loader — shows while fetching, replaces the blank flash */}
        {loadingMessages && messages.length === 0 && (
          <div className="space-y-4 px-4 py-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex items-end gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="w-8 h-8 rounded-full bg-white/60 flex-shrink-0" />
                <div className={`space-y-1.5 max-w-[60%] ${i % 2 === 0 ? '' : 'items-end flex flex-col'}`}>
                  <div className={`h-10 rounded-2xl bg-white/60 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                  <div className="h-3 w-12 rounded-full bg-white/40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
          const isOwn = String(senderId) === String(currentUserId);
          let senderUser = typeof m.sender === 'object' ? m.sender : null;
          if (!senderUser) {
            if (isOwn) senderUser = user;
            else if (chat.otherUser && String(chat.otherUser._id) === String(senderId)) senderUser = chat.otherUser;
            else senderUser = chatParticipants.find(p => String(p._id) === String(senderId)) || null;
          }

          return (
            <MessageBubble
              key={m._id}
              message={m}
              sender={senderUser}
              isOwn={isOwn}
              onReply={() => setReplyTo(m)}
              onReact={(emoji) => socket.emit('message:react', { messageId: m._id, emoji })}
              onPin={() => socket.emit('message:pin', { chatId: chat._id, messageId: m._id })}
              canPin={isGroup}
              canModerate={user?.role === 'admin'}
              onEdit={(content) => socket.emit('message:edit', { messageId: m._id, content })}
              onDelete={() => socket.emit('message:delete', { messageId: m._id })}
              onVote={(optionIndex) => socket.emit('poll:vote', { messageId: m._id, optionIndex })}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
        </div>{/* end relative content wrapper */}
      </div>

      {isReadOnly ? (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border-t border-amber-100">
          <span className="text-[12px] font-semibold text-amber-700">📣 This is an announcements-only channel — only the broadcaster can post here.</span>
        </div>
      ) : (
        <MessageInput
          onSend={sendMessage}
          onTyping={setTyping}
          replyTo={replyTo}
          clearReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
