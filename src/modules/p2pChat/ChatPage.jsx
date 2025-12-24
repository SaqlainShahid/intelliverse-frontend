import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getChats, getArchivedChats, archiveChat, unarchiveChat, deleteChat, getMutedUsers, muteUser, unmuteUser } from '../../services/chatService';
import { getAccessToken } from '../../services/api';
import { createSocket } from './socketClient';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewChatBar from './NewChatBar';
import { Archive } from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId: routeChatId } = useParams();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [banner, setBanner] = useState(null);
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [mutedUserIds, setMutedUserIds] = useState(new Set());

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
        const [resChats, resArchived, resMuted] = await Promise.all([
            getChats(),
            getArchivedChats(),
            getMutedUsers()
        ]);
        if (resChats?.success) setChats(resChats.data);
        if (resArchived?.success) setArchivedIds(new Set(resArchived.data));
        if (resMuted?.success) setMutedUserIds(new Set(resMuted.data.map(u => u._id)));
      } catch (err) {
      }
    })();
  }, [user?._id]);

  useEffect(() => {
    if (routeChatId && chats.length) {
      const found = chats.find(c => c._id.toString() === routeChatId.toString());
      if (found) {
        setActiveChatId(found._id);
      }
    }
  }, [routeChatId, chats]);

  const currentUserId = user?._id;
  
  const displayedChats = useMemo(() => {
    return chats.filter(c => showArchived ? archivedIds.has(c._id) : !archivedIds.has(c._id));
  }, [chats, showArchived, archivedIds]);

  const activeChat = useMemo(() => chats.find(c => c._id === activeChatId) || null, [chats, activeChatId]);

  const handleArchive = async (chatId) => {
      try {
        const res = await archiveChat(chatId);
        if(res.success) {
            setArchivedIds(prev => new Set([...prev, chatId]));
            if (activeChatId === chatId) setActiveChatId(null);
            toast.success('Chat archived');
        }
      } catch { toast.error('Failed to archive chat'); }
  };

  const handleUnarchive = async (chatId) => {
      try {
        const res = await unarchiveChat(chatId);
        if(res.success) {
            setArchivedIds(prev => {
                const next = new Set(prev);
                next.delete(chatId);
                return next;
            });
            toast.success('Chat unarchived');
        }
      } catch { toast.error('Failed to unarchive chat'); }
  };

  const handleDelete = async (chatId) => {
      try {
        await deleteChat(chatId);
        setChats(prev => prev.filter(c => c._id !== chatId));
        if (activeChatId === chatId) setActiveChatId(null);
        toast.success('Chat deleted');
      } catch { toast.error('Failed to delete chat'); }
  };

  const handleMuteToggle = async (targetUserId) => {
      try {
        if (mutedUserIds.has(targetUserId)) {
            await unmuteUser(targetUserId);
            setMutedUserIds(prev => {
                const next = new Set(prev);
                next.delete(targetUserId);
                return next;
            });
            toast.success('User unmuted');
        } else {
            await muteUser(targetUserId);
            setMutedUserIds(prev => new Set([...prev, targetUserId]));
            toast.success('User muted');
        }
      } catch { toast.error('Failed to update mute status'); }
  };

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
    <div className="h-[calc(100vh-4.5rem)] bg-iv-bg relative overflow-hidden">
       {/* Ambient Background */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-iv-indigo/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6 h-full">
        <div className="md:col-span-1 bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
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
          <div className="px-4 py-2 flex justify-end">
             <button 
               onClick={() => setShowArchived(!showArchived)}
               className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${showArchived ? 'bg-iv-indigo text-white' : 'text-iv-muted hover:bg-iv-indigo/10'}`}
             >
               <Archive size={12} />
               {showArchived ? 'Hide Archived' : 'Archived'}
             </button>
          </div>
          {banner && (
            <div className="mx-3 my-2 rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 flex items-center justify-between shrink-0">
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
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <ChatList 
                chats={displayedChats} 
                onSelect={(id) => { setActiveChatId(id); navigate(`/chat/${id}`); }} 
                activeChatId={activeChatId} 
                socket={socket} 
                currentUserId={currentUserId}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                onMuteToggle={handleMuteToggle}
                mutedUserIds={mutedUserIds}
                archivedIds={archivedIds}
            />
          </div>
        </div>
        <div className="md:col-span-2 bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
          {activeChat ? (
            <ChatWindow 
              chat={activeChat} 
              socket={socket} 
              currentUserId={currentUserId}
              isArchived={archivedIds.has(activeChat._id)}
              onArchive={() => handleArchive(activeChat._id)}
              onUnarchive={() => handleUnarchive(activeChat._id)}
              onLeftGroup={() => { setActiveChatId(null); navigate('/chat'); }}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-transparent">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-iv-indigo/10 text-iv-indigo flex items-center justify-center mb-4 backdrop-blur-sm">
                  <div className="h-10 w-10">💬</div>
                </div>
                <h3 className="text-xl font-bold text-iv-text mb-2">Select a chat to start messaging</h3>
                <p className="text-iv-muted">Choose a conversation from the left to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
