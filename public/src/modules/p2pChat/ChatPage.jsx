import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getChats } from '../../services/chatService';
import { getAccessToken } from '../../services/api';
import { createSocket } from './socketClient';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewChatBar from './NewChatBar';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        if (!token || !user?._id) return;
        const res = await getChats();
        if (res?.success) setChats(res.data);
      } catch (err) {
        // swallow errors to avoid uncaught runtime exceptions in dev
      }
    })();
  }, [user?._id]);

  const currentUserId = user?._id;
  const activeChat = useMemo(() => chats.find(c => c._id === activeChatId) || null, [chats, activeChatId]);

  useEffect(() => {
    if (!socket) return;
    const onGroupCreated = async (payload) => {
      try {
        const res = await getChats();
        if (res?.success) setChats(res.data);
      } catch {}
      const name = payload?.group?.name || 'New Group';
      toast.success(`You were added to ${name}`);
      setBanner({ message: `You were added to ${name}`, chatId: payload?._id, ts: Date.now() });
      setTimeout(() => setBanner(null), 6000);
    };
    socket.on('group:created', onGroupCreated);
    return () => {
      socket.off('group:created', onGroupCreated);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <NewChatBar chats={chats} currentUserId={currentUserId} onChatCreated={(chat) => {
            const other = (chat.participants || []).find(p => (p._id || p).toString() !== (currentUserId || '').toString());
            const mapped = {
              _id: chat._id,
              otherUser: other,
              lastMessage: chat.lastMessage ? { content: chat.lastMessage.content, createdAt: chat.lastMessage.createdAt, status: chat.lastMessage.status } : null,
              updatedAt: chat.updatedAt
            };
            setChats((prev) => {
              const exists = prev.some(c => c._id === mapped._id);
              const list = exists ? prev.map(c => c._id === mapped._id ? mapped : c) : [mapped, ...prev];
              return list;
            });
            setActiveChatId(chat._id);
          }} />
          {banner && (
            <div className="mx-3 my-2 rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 flex items-center justify-between">
              <span className="text-sm truncate">{banner.message}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => banner.chatId && setActiveChatId(banner.chatId)}
                  className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                >Open</button>
                <button
                  onClick={() => setBanner(null)}
                  className="text-xs px-2 py-1 rounded hover:bg-green-100"
                >Dismiss</button>
              </div>
            </div>
          )}
          <ChatList chats={chats} onSelect={setActiveChatId} activeChatId={activeChatId} socket={socket} currentUserId={currentUserId} />
        </div>
        <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          {activeChat ? (
            <ChatWindow chat={activeChat} socket={socket} currentUserId={currentUserId} />
          ) : (
            <div className="h-[70vh] flex items-center justify-center p-8 bg-gray-50">
              <div className="text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">💬</div>
                <p className="text-gray-700 font-medium">Select a chat to start messaging</p>
                <p className="text-gray-500 text-sm mt-1">Choose a conversation from the left to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
