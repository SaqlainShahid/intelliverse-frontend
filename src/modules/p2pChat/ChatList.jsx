import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Trash2, Archive, ArchiveRestore, VolumeX, Volume2 } from 'lucide-react';

export default function ChatList({ chats, onSelect, activeChatId, socket, currentUserId, onArchive, onUnarchive, onDelete, onMuteToggle, mutedUserIds = new Set(), archivedIds = new Set() }) {
  const [presence, setPresence] = useState({});
  const [typingState, setTypingState] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const onPresence = ({ userId, status }) => {
      setPresence((p) => ({ ...p, [userId]: status }));
    };
    const onTyping = ({ chatId, userId, typing }) => {
      if (!chatId) return;
      setTypingState((t) => ({ ...t, [chatId]: !!typing }));
    };
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);
    return () => {
      socket.off('presence', onPresence);
      socket.off('typing', onTyping);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      chat
    });
  };

  return (
    <div className="divide-y relative">
      {chats.map((c) => {
        const isGroup = c.type === 'group' || (!!c.group && !c.otherUser);
        const other = c.otherUser;
        const status = presence[other?._id] || 'offline';
        const last = c.lastMessage;
        const lastTime = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const active = activeChatId === c._id;
        const isArchived = archivedIds.has(c._id);
        const otherUserId = other?._id;
        const isMuted = otherUserId ? mutedUserIds.has(otherUserId) : false;

        return (
          <div key={c._id} onContextMenu={(e) => handleContextMenu(e, c)}>
            <button
              onClick={() => onSelect(c._id)}
              className={`w-full p-4 transition-all duration-200 border-l-4 ${active ? 'bg-iv-indigo/10 border-iv-indigo shadow-sm' : 'hover:bg-iv-indigo/5 border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 ${active ? 'scale-110 shadow-md' : 'shadow-sm'} ${other?.profile?.avatar ? '' : 'bg-gradient-to-br from-iv-indigo/20 to-purple-500/20 text-iv-indigo'}`}>
                    {other?.profile?.avatar ? (
                       <img src={other.profile.avatar} alt="Avatar" className="h-full w-full object-cover cursor-pointer" onClick={(e) => { e.stopPropagation(); other?._id && (window.location.href = `/profile/${other._id}`); }} />
                    ) : (
                      <span className="text-lg font-bold cursor-pointer" onClick={(e) => { e.stopPropagation(); other?._id && (window.location.href = `/profile/${other._id}`); }}>
                      {(isGroup ? (c.group?.name || 'G') : (other?.profile?.firstName || 'U')).toString().charAt(0)}
                      </span>
                    )}
                  </div>
                  {status === 'online' && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse"></span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-semibold truncate ${active ? 'text-iv-indigo' : 'text-iv-text'}`}>
                      {isGroup ? (c.group?.name || 'Group Chat') : (
                        <button className="hover:underline" onClick={(e) => { e.stopPropagation(); other?._id && (window.location.href = `/profile/${other._id}`); }}>
                          {`${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`}
                        </button>
                      )}
                    </span>
                    <span className="text-[10px] text-iv-muted shrink-0 font-medium">{lastTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-iv-muted truncate max-w-[140px] opacity-90">
                      {typingState[c._id] ? (
                        <span className="text-iv-indigo">typing…</span>
                      ) : last ? (
                        <>
                          {String(last.sender) === String(currentUserId) && <span className="mr-1">You:</span>}
                          {last.content || 'Attachment'}
                        </>
                      ) : <span className="italic opacity-70">No messages yet</span>}
                    </p>
                    <div className="flex items-center gap-1">
                        {isMuted && <VolumeX size={12} className="text-iv-muted" />}
                        {c.unreadCount > 0 && (
                        <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-iv-indigo text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                            {c.unreadCount}
                        </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {contextMenu && createPortal(
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-iv-border min-w-[160px] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {onArchive && (
            <button
              onClick={() => {
                if (archivedIds.has(contextMenu.chat._id)) onUnarchive(contextMenu.chat._id);
                else onArchive(contextMenu.chat._id);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-iv-text hover:bg-iv-indigo/5 flex items-center gap-2"
            >
              {archivedIds.has(contextMenu.chat._id) ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {archivedIds.has(contextMenu.chat._id) ? 'Unarchive' : 'Archive'}
            </button>
          )}
          {onMuteToggle && contextMenu.chat.otherUser && (
            <button
                onClick={() => {
                    onMuteToggle(contextMenu.chat.otherUser._id);
                    setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-iv-text hover:bg-iv-indigo/5 flex items-center gap-2"
            >
                {mutedUserIds.has(contextMenu.chat.otherUser._id) ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {mutedUserIds.has(contextMenu.chat.otherUser._id) ? 'Unmute' : 'Mute'}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this chat? This will clear the chat history.')) {
                  onDelete(contextMenu.chat._id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-iv-border mt-1 pt-2"
            >
              <Trash2 size={14} />
              Delete Chat
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
