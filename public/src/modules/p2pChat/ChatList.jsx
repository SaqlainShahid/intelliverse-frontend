import React, { useEffect, useState } from 'react';

export default function ChatList({ chats, onSelect, activeChatId, socket, currentUserId }) {
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!socket) return;
    const onPresence = ({ userId, status }) => {
      setPresence((p) => ({ ...p, [userId]: status }));
    };
    socket.on('presence', onPresence);
    return () => {
      socket.off('presence', onPresence);
    };
  }, [socket]);

  return (
    <div className="divide-y">
      {chats.map((c) => {
        const isGroup = c.type === 'group' || (!!c.group && !c.otherUser);
        const other = c.otherUser;
        const status = presence[other?._id] || 'offline';
        const last = c.lastMessage;
        const lastTime = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const active = activeChatId === c._id;
        return (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={`w-full p-3 transition-colors duration-150 ${active ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <span className="text-sm font-semibold">
                    {(isGroup ? (c.group?.name || 'G') : (other?.profile?.firstName || 'U')).toString().charAt(0)}
                  </span>
                </div>
                {!isGroup && <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 truncate">
                    {isGroup ? (c.group?.name || 'Group') : `${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`}
                  </span>
                  <span className="text-xs text-gray-500 ml-2 shrink-0">{lastTime}</span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {last ? (last.content?.trim() ? last.content : (last.attachments && last.attachments.length ? '[Attachment]' : 'No messages yet')) : 'No messages yet'}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
