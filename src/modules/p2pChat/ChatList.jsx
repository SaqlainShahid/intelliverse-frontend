import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2, Archive, ArchiveRestore, VolumeX, Volume2,
  MessageSquare, Users, Megaphone, Handshake, ChevronRight,
} from 'lucide-react';

// ─── Section definitions ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'announcements',
    label: 'Announcements',
    Icon: Megaphone,
    filter: c => c.category === 'broadcast',
    accent: { badge: 'bg-rose-500', icon: 'text-rose-500', header: 'text-rose-600' },
  },
  {
    id: 'collaborations',
    label: 'Collaborations',
    Icon: Handshake,
    filter: c => c.category === 'collaboration',
    accent: { badge: 'bg-amber-500', icon: 'text-amber-500', header: 'text-amber-600' },
  },
  {
    id: 'groups',
    label: 'Groups',
    Icon: Users,
    filter: c => c.type === 'group' && !['broadcast', 'collaboration'].includes(c.category),
    accent: { badge: 'bg-violet-600', icon: 'text-violet-500', header: 'text-violet-600' },
  },
  {
    id: 'direct',
    label: 'Direct Messages',
    Icon: MessageSquare,
    filter: c => c.type === 'private',
    accent: { badge: 'bg-indigo-600', icon: 'text-indigo-500', header: 'text-indigo-600' },
  },
];

// ─── Single chat row ───────────────────────────────────────────────────────
function ChatItem({ c, accent, activeChatId, presence, typingState, currentUserId, mutedUserIds, onSelect, onContextMenu }) {
  const active = activeChatId === c._id;
  const isGroup = c.type === 'group';
  const isAnnouncement = c.category === 'broadcast';
  const other = c.otherUser;
  const status = presence[other?._id] || 'offline';
  const last = c.lastMessage;
  const lastTime = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isMuted = other?._id ? mutedUserIds.has(other._id) : false;

  const initial = isGroup
    ? (c.group?.name || 'G').charAt(0).toUpperCase()
    : (other?.profile?.firstName || '?').charAt(0).toUpperCase();

  return (
    <div onContextMenu={(e) => onContextMenu(e, c)} className="relative">
      <button
        onClick={() => onSelect(c)}
        className={`w-full px-3 py-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 text-left border ${active ? 'border-violet-300/40 -translate-y-0.5' : 'border-transparent hover:border-violet-100/60 hover:-translate-y-0.5'
          }`}
        style={active ? {
          background: 'linear-gradient(135deg, rgba(124,58,237,0.92) 0%, rgba(99,102,241,0.88) 100%)',
          boxShadow: '0 4px 12px rgba(124,58,237,0.3), 0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        } : {}}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm ${active ? 'ring-2 ring-white/80' : ''}`}>
            {other?.profile?.avatar ? (
              <img src={other.profile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-[14px] font-bold ${active ? 'bg-white/20 text-white' : (
                  isAnnouncement ? 'bg-rose-500 text-white' :
                    c.category === 'collaboration' ? 'bg-amber-500 text-white' :
                      'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
                )
                }`}>
                {isAnnouncement ? <Megaphone className="w-4 h-4" /> :
                  c.category === 'collaboration' ? <Handshake className="w-4 h-4" /> :
                    initial}
              </div>
            )}
          </div>
          {status === 'online' && !isGroup && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className={`font-bold text-[13px] truncate ${active ? 'text-white' : 'text-gray-900'}`}>
              {isGroup ? (c.group?.name || 'Group') : `${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`.trim()}
            </span>
            <span className={`text-[10px] shrink-0 ml-1 ${active ? 'text-white/70' : 'text-gray-400'}`}>{lastTime}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <p className={`text-[12px] truncate ${active ? 'text-white/80' : 'text-gray-500'}`}>
              {typingState[c._id] ? (
                <span className={`animate-pulse ${active ? 'text-white' : 'text-violet-600'}`}>typing…</span>
              ) : last ? (
                <>
                  {String(last.sender) === String(currentUserId) && <span className="opacity-60 mr-1">You:</span>}
                  {last.content || '📎 Attachment'}
                </>
              ) : <span className="italic opacity-40">No messages yet</span>}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {isMuted && <VolumeX size={11} className={active ? 'text-white/60' : 'text-gray-400'} />}
              {c.unreadCount > 0 && (
                <span className={`h-5 min-w-[1.25rem] px-1.5 rounded-lg text-[9px] font-black flex items-center justify-center shadow-sm ${active ? 'bg-white text-violet-600' : `${accent.badge} text-white`
                  }`}>
                  {c.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Collapsible section (collapsed by default) ────────────────────────────
function ChatSection({ section, chats, ...itemProps }) {
  const [open, setOpen] = useState(false);
  const { Icon, label, accent } = section;
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  if (chats.length === 0) return null;

  return (
    <div>
      {/* Clickable header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50/80 transition-colors"
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${accent.icon}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest flex-1 text-left ${accent.header}`}>
          {label}
        </span>
        {totalUnread > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${accent.badge} text-white leading-none`}>
            {totalUnread}
          </span>
        )}
        <span className="text-[10px] font-semibold text-slate-300 mr-1">{chats.length}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Items — shown only when expanded */}
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {chats.map(c => (
            <ChatItem key={c._id} c={c} accent={accent} {...itemProps} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────
export default function ChatList({ chats, onSelect, activeChatId, socket, currentUserId, onArchive, onUnarchive, onDelete, onMuteToggle, mutedUserIds = new Set(), archivedIds = new Set() }) {
  const [presence, setPresence] = useState({});
  const [typingState, setTypingState] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const onPresence = ({ userId, status }) => setPresence(p => ({ ...p, [userId]: status }));
    const onTyping = ({ chatId, userId, typing }) => {
      if (!chatId || userId === currentUserId) return;
      setTypingState(t => ({ ...t, [chatId]: !!typing }));
    };
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);
    return () => { socket.off('presence', onPresence); socket.off('typing', onTyping); };
  }, [socket]);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setContextMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chat });
  };

  const sharedProps = { activeChatId, presence, typingState, currentUserId, mutedUserIds, onSelect, onContextMenu: handleContextMenu };

  const hasSomeChat = SECTIONS.some(s => chats.some(s.filter));

  return (
    <div className="px-2 space-y-3 relative">
      {!hasSomeChat && (
        <p className="text-center text-slate-400 text-xs py-10">No chats yet</p>
      )}

      {SECTIONS.map(section => (
        <ChatSection
          key={section.id}
          section={section}
          chats={chats.filter(section.filter)}
          {...sharedProps}
        />
      ))}

      {/* Context menu portal */}
      {contextMenu && createPortal(
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[9999] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-900/10 border border-white/60 min-w-[200px] p-2 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="space-y-1">
            {onArchive && (
              <button
                onClick={() => {
                  archivedIds.has(contextMenu.chat._id) ? onUnarchive(contextMenu.chat._id) : onArchive(contextMenu.chat._id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {archivedIds.has(contextMenu.chat._id) ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                </div>
                {archivedIds.has(contextMenu.chat._id) ? 'Unarchive' : 'Archive'}
              </button>
            )}
            {onMuteToggle && contextMenu.chat.otherUser && (
              <button
                onClick={() => { onMuteToggle(contextMenu.chat.otherUser._id); setContextMenu(null); }}
                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {mutedUserIds.has(contextMenu.chat.otherUser._id) ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </div>
                {mutedUserIds.has(contextMenu.chat.otherUser._id) ? 'Unmute' : 'Mute'}
              </button>
            )}
            <div className="h-px bg-gray-50 mx-4 my-1" />
            {onDelete && (() => {
              const isBroadcast = contextMenu.chat.category === 'broadcast';
              const isCreator = isBroadcast && (contextMenu.chat.admins || []).includes(String(currentUserId));
              if (isBroadcast && !isCreator) return null;
              return (
                <button
                  onClick={() => {
                    const label = isBroadcast ? 'Delete this announcement and all its messages?' : 'Clear all chat history?';
                    if (window.confirm(label)) onDelete(contextMenu.chat._id);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-2xl transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trash2 size={14} />
                  </div>
                  {isBroadcast ? 'Delete Announcement' : 'Delete Chat'}
                </button>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
