import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMessages, getMutedUsers, muteUser, unmuteUser } from '../../services/chatService';
import { searchMessages, getChatDetails } from '../../services/chatService';
import { VolumeX, Volume2, Archive, ArchiveRestore, MoreVertical } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef(null);
  const { user } = useAuth();
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

  useEffect(() => {
    if (!chat?._id) return;
    (async () => {
      const thisChatId = chat._id;
      const res = await getMessages(chat._id, 100);
      if (res?.success) setMessages(res.data);
      try {
        const det = await getChatDetails(chat._id);
        if (det?.success && det.data) {
          setPinned(det.data.pinnedMessageIds || []);
          setAnnouncementOnly(!!(det.data.settings && det.data.settings.announcementOnly));
        }
      } catch {}
      try {
        const muted = await getMutedUsers();
        if (muted?.success && Array.isArray(muted.data)) {
            setMutedUserIds(new Set(muted.data.map(u => u._id)));
        }
      } catch {}
    })();
  }, [chat?._id, chat?.otherUser?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;
    socket.emit('chat:join', chat._id);
    const onNew = (m) => {
      if (m.chat !== chat._id) return;
      const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
      if (mutedUserIds.has(senderId)) return;
      setMessages((prev) => (prev.some(x => x._id === m._id) ? prev : [...prev, m]));
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const sendMessage = (text) => {
    socket.emit('message:send', { chatId: chat._id, recipientId: otherUserId, content: text, replyTo: replyTo?._id || null }, (ack) => {
      if (ack?.ok && ack.message) {
        setMessages((prev) => (prev.some(x => x._id === ack.message._id) ? prev : [...prev, ack.message]));
        setReplyTo(null);
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
    <div className="grid grid-rows-[auto_1fr_auto] h-full">
      <div className="border-b border-iv-border p-4 flex items-center gap-4 bg-iv-glass/90 backdrop-blur-xl z-10">
        <div className="relative">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center overflow-hidden shadow-sm ${chat.otherUser?.profile?.avatar ? '' : 'bg-gradient-to-br from-iv-indigo/20 to-purple-500/20 text-iv-indigo'}`}>
            {chat.otherUser?.profile?.avatar ? (
                 <img
                   src={chat.otherUser.profile.avatar}
                   alt="Profile"
                   className="h-full w-full object-cover cursor-pointer"
                   onClick={() => {
                     if (isGroup) navigate(`/groups/${chat._id}`);
                     else if (chat.otherUser?._id) navigate(`/profile/${chat.otherUser._id}`);
                   }}
                 />
            ) : (
                <span
                  className="text-lg font-bold cursor-pointer"
                  onClick={() => {
                    if (isGroup) navigate(`/groups/${chat._id}`);
                    else if (chat.otherUser?._id) navigate(`/profile/${chat.otherUser._id}`);
                  }}
                >
                {(chat.otherUser?.profile?.firstName || chat.group?.name || 'U').toString().charAt(0)}
                </span>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg text-iv-text">
            {isGroup ? (chat.group?.name || chat.name) : (
              <button className="hover:underline" onClick={() => chat.otherUser?._id && navigate(`/profile/${chat.otherUser._id}`)}>
                {`${chat.otherUser?.profile?.firstName || ''} ${chat.otherUser?.profile?.lastName || ''}`}
              </button>
            )}
          </div>
          <div className="text-xs text-iv-muted font-medium">
            {Object.values(typingUsers).some(Boolean) ? 'typing…' : ''}
          </div>
        </div>
        {isGroup && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-2 rounded-lg border border-iv-border text-iv-text hover:bg-iv-indigo/10"
              aria-haspopup="menu"
              aria-expanded={showMenu ? 'true' : 'false'}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-iv-border rounded-xl shadow-lg z-50">
                <button onClick={() => { setShowInfo((s) => !s); setShowMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-iv-indigo/10">Info</button>
                <button onClick={() => { setShowPollForm((s) => !s); setShowMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-iv-indigo/10">Poll</button>
                <button onClick={() => { navigate(`/groups/${chat._id}`); setShowMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-iv-indigo/10">Open Page</button>
                <button
                  onClick={async () => {
                    try {
                      const { leaveGroup } = await import('../../services/chatService');
                      const r = await leaveGroup(chat._id);
                      setShowMenu(false);
                      if (r?.success) {
                        if (typeof onLeftGroup === 'function') onLeftGroup();
                        toast.success('Left group');
                      } else {
                        toast.error('Unable to leave');
                      }
                    } catch {
                      toast.error('Unable to leave');
                    }
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >Leave</button>
              </div>
            )}
          </div>
        )}
        <input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-2 text-xs px-3 py-1.5 rounded-lg border-2 border-iv-indigo/20 bg-white/50 focus:outline-none focus:border-iv-indigo focus:ring-1 focus:ring-iv-indigo text-iv-text placeholder:text-iv-muted transition-all w-40 focus:w-60"
        />
        {onArchive && (
          <button
            onClick={isArchived ? onUnarchive : onArchive}
            className={`ml-2 p-2 rounded-lg border transition-colors ${isArchived ? 'border-iv-indigo bg-iv-indigo/10 text-iv-indigo hover:bg-iv-indigo/20' : 'border-iv-border text-iv-muted hover:bg-iv-indigo/10 hover:text-iv-indigo'}`}
            title={isArchived ? 'Unarchive chat' : 'Archive chat'}
          >
            {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
        )}
        {!!otherUserId && (
          <button
            onClick={toggleMute}
            disabled={pendingMute}
            className={`ml-2 p-2 rounded-lg border transition-colors ${isMuted ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-iv-border text-iv-muted hover:bg-iv-indigo/10 hover:text-iv-indigo'} ${pendingMute ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-label={isMuted ? 'Unmute user' : 'Mute user'}
            title={isMuted ? 'Unmute user' : 'Mute user'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>
      <div className="overflow-y-auto p-4 bg-transparent space-y-3 scroll-smooth">
        {isGroup && showInfo && <GroupInfoPanel chat={chat} mutedUserIds={mutedUserIds} onMuteToggle={handleMuteToggle} />}
        {isGroup && showPollForm && (
          <div className="mb-4 rounded-xl border border-iv-border bg-iv-glass backdrop-blur-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2">Create a poll</div>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Question"
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={`opt-${idx}`} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => setPollOptions((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => setPollOptions((arr) => arr.filter((_, i) => i !== idx))}
                    className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  >Remove</button>
                </div>
              ))}
              <div>
                <button
                  onClick={() => setPollOptions((arr) => [...arr, ''])}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                >Add option</button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <label className="text-xs text-gray-700 inline-flex items-center gap-2">
                <input type="checkbox" checked={pollMultiple} onChange={(e) => setPollMultiple(!!e.target.checked)} />
                Multiple choice
              </label>
              <input
                type="datetime-local"
                value={pollDeadline}
                onChange={(e) => setPollDeadline(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 rounded"
              />
              <button
                onClick={() => {
                  const question = (pollQuestion || '').trim();
                  const options = pollOptions.map(o => (o || '').trim()).filter(Boolean);
                  if (!question || options.length < 2) return;
                  const payload = {
                    chatId: chat._id,
                    poll: { question, options: options.map(text => ({ text })), multiple: pollMultiple, deadline: pollDeadline || null },
                    content: ''
                  };
                  socket.emit('message:send', payload, (ack) => {
                    if (ack?.ok && ack.message) {
                      setMessages((prev) => (prev.some(x => x._id === ack.message._id) ? prev : [...prev, ack.message]));
                      setShowPollForm(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                      setPollMultiple(false);
                      setPollDeadline('');
                    }
                  });
                }}
                className="ml-auto text-xs px-3 py-1 rounded bg-indigo-600 text-white"
              >Create</button>
              <button
                onClick={() => { setShowPollForm(false); }}
                className="text-xs px-3 py-1 rounded border border-gray-300"
              >Cancel</button>
            </div>
          </div>
        )}
        {!!announcementOnly && user?.role !== 'admin' && (
          <div className="mb-2 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-3 py-2 text-xs">
            Announcement-only mode is enabled. Only admins can send messages.
          </div>
        )}
        {!!(pinned && pinned.length) && (
          <div className="mb-2 rounded-lg bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-900">
            <div className="font-semibold mb-1">Pinned</div>
            {messages.filter(m => pinned.includes(m._id)).map(m => (
              <div key={`pin-${m._id}`} className="truncate">{m.content || (m.attachments && m.attachments[0]?.filename) || 'Attachment'}</div>
            ))}
          </div>
        )}
        {!!search.trim() && (
          <div className="mb-2 rounded-md border border-gray-200 bg-white">
            <div className="px-3 py-2 text-xs text-gray-700 border-b">Search results</div>
            <div className="max-h-40 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
              ) : (
                searchResults.map((m) => (
                  <button
                    key={`search-${m._id}`}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-700"
                    onClick={() => {
                      const el = document.getElementById(`message-${m._id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-indigo-500');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-indigo-500');
                        }, 1800);
                      }
                    }}
                  >
                    {(m.content && m.content.trim()) ? m.content : (m.attachments && m.attachments[0]?.filename) || 'Attachment'}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
          const isOwn = String(senderId) === String(currentUserId);
          let senderUser = typeof m.sender === 'object' ? m.sender : null;
          if (!senderUser) {
            if (isOwn) senderUser = user;
            else if (chat.otherUser && String(chat.otherUser._id) === String(senderId)) senderUser = chat.otherUser;
            else if (chat.participants) senderUser = chat.participants.find(p => String(p._id) === String(senderId));
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
              onEdit={(content) => socket.emit('message:edit', { messageId: m._id, content }, (ack) => {
                if (!ack?.ok) toast.error('Unable to edit message');
              })}
              onDelete={() => socket.emit('message:delete', { messageId: m._id }, (ack) => {
                if (ack?.ok) {
                  setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, isDeleted: true, deletedAt: Date.now(), content: '', attachments: [] } : x)));
                  toast.success('Message deleted');
                } else {
                  toast.error('Unable to delete message');
                }
              })}
              onVote={(optionIndex) => socket.emit('poll:vote', { messageId: m._id, optionIndex })}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
      <MessageInput
        onSend={sendMessage}
        onTyping={setTyping}
        replyTo={replyTo}
        clearReply={() => setReplyTo(null)}
        disabled={!!announcementOnly && user?.role !== 'admin'}
      />
    </div>
  );
}
