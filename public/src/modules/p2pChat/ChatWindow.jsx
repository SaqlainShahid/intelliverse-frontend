import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getMessages } from '../../services/chatService';
import { searchMessages, getChatDetails } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupInfoPanel from './GroupInfoPanel';

export default function ChatWindow({ chat, socket, currentUserId }) {
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

  useEffect(() => {
    if (!chat?._id) return;
    (async () => {
      const res = await getMessages(chat._id, 100);
      if (res?.success) setMessages(res.data);
      try {
        const det = await getChatDetails(chat._id);
        if (det?.success && det.data) {
          setPinned(det.data.pinnedMessageIds || []);
          setAnnouncementOnly(!!(det.data.settings && det.data.settings.announcementOnly));
        }
      } catch {}
    })();
  }, [chat?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;
    socket.emit('chat:join', chat._id);
    const onNew = (m) => {
      if (m.chat !== chat._id) return;
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
  }, [socket, chat?._id, currentUserId]);

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
    <div className="grid grid-rows-[auto_1fr_auto] h-[78vh] md:h-[82vh]">
      <div className="border-b p-3 flex items-center gap-3 bg-white/80 backdrop-blur-sm">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
            <span className="text-sm font-semibold">
              {(chat.otherUser?.profile?.firstName || chat.group?.name || 'U').toString().charAt(0)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {isGroup ? (chat.group?.name || chat.name) : `${chat.otherUser?.profile?.firstName || ''} ${chat.otherUser?.profile?.lastName || ''}`}
          </div>
          <div className="text-xs text-gray-500">
            {Object.values(typingUsers).some(Boolean) ? 'typing…' : ''}
          </div>
        </div>
        {isGroup && (
          <>
            <button onClick={() => setShowInfo((s) => !s)} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Info</button>
            <button onClick={() => setShowPollForm((s) => !s)} className="ml-2 text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Poll</button>
          </>
        )}
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-2 text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="overflow-y-auto p-4 bg-neutral-100 space-y-2">
        {isGroup && showInfo && <GroupInfoPanel chat={chat} />}
        {isGroup && showPollForm && (
          <div className="mb-2 rounded-md border border-gray-200 bg-white p-3">
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
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            isOwn={String(m.sender) === String(currentUserId)}
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
        ))}
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
