import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getChats, getArchivedChats, archiveChat, unarchiveChat, deleteChat, getMutedUsers, muteUser, unmuteUser, getPendingRequests, createOrGetChat } from '../../services/chatService';
import { getAccessToken } from '../../services/api';
import { createSocket } from './socketClient';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewChatBar from './NewChatBar';
import { Archive, Mail } from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId: routeChatId, userId } = useParams();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [banner, setBanner] = useState(null);
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [mutedUserIds, setMutedUserIds] = useState(new Set());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (userId) {
      console.log("Initiating direct chat with userId:", userId);
      // Basic ObjectId validation (24 hex chars)
      const isValidId = /^[0-9a-fA-F]{24}$/.test(userId);
      if (!isValidId) {
        console.error("Invalid userId format in URL:", userId);
        return;
      }

      (async () => {
        try {
          const res = await createOrGetChat(userId);
          console.log("Chat initiation response:", res);
          if (res?.success && res.data?._id) {
            navigate(`/chat/${res.data._id}`, { replace: true });
          } else {
            toast.error(res?.message || "Failed to start chat session");
          }
        } catch (err) {
          console.error("Failed to initiate direct chat:", err);
          toast.error("Unable to start chat with this user");
        }
      })();
    }
  }, [userId, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        if (!token || !user?._id) return;
        const [resChats, resArchived, resMuted, resPending] = await Promise.all([
            getChats(),
            getArchivedChats(),
            getMutedUsers(),
            getPendingRequests()
        ]);
        if (resChats?.success) setChats(resChats.data);
        if (resArchived?.success) setArchivedIds(new Set(resArchived.data));
        if (resMuted?.success) setMutedUserIds(new Set(resMuted.data.map(u => u._id)));
        if (resPending?.success) setPendingRequestsCount(resPending.data.length);
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
    <div className="h-[calc(100vh-4.5rem)] relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #fdfcff 0%, #f8f5ff 40%, #f5f8ff 70%, #fdfcff 100%)' }}
    >
      {/* ── Premium Animated Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

        {/* Animated morphing blobs */}
        <div style={{
          position:'absolute', top:'-15%', right:'-8%', width:680, height:680,
          background:'radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(196,181,253,0.1) 40%, transparent 70%)',
          borderRadius:'50%', filter:'blur(48px)', animation:'float1 12s ease-in-out infinite'
        }} />
        <div style={{
          position:'absolute', bottom:'-20%', left:'-10%', width:750, height:750,
          background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(129,140,248,0.08) 40%, transparent 70%)',
          borderRadius:'50%', filter:'blur(60px)', animation:'float2 15s ease-in-out infinite'
        }} />
        <div style={{
          position:'absolute', top:'35%', left:'25%', width:450, height:450,
          background:'radial-gradient(circle, rgba(236,72,153,0.07) 0%, rgba(251,207,232,0.05) 50%, transparent 70%)',
          borderRadius:'50%', filter:'blur(70px)', animation:'float3 18s ease-in-out infinite'
        }} />
        <div style={{
          position:'absolute', top:'10%', left:'45%', width:320, height:320,
          background:'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
          borderRadius:'50%', filter:'blur(50px)', animation:'float1 20s ease-in-out infinite reverse'
        }} />

        {/* SVG Wave Pattern Overlay */}
        <svg style={{ position:'absolute', bottom:0, left:0, right:0, width:'100%', opacity:0.035 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(139,92,246,1)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
        </svg>
        <svg style={{ position:'absolute', bottom:0, left:0, right:0, width:'100%', opacity:0.025 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(99,102,241,1)" d="M0,256L60,240C120,224,240,192,360,181.3C480,171,600,181,720,197.3C840,213,960,235,1080,224C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
        </svg>

        {/* Floating sparkle particles */}
        {[
          { top:'12%', left:'8%', size:4, delay:'0s', dur:'6s' },
          { top:'30%', left:'88%', size:3, delay:'1.5s', dur:'8s' },
          { top:'60%', left:'15%', size:5, delay:'3s', dur:'7s' },
          { top:'75%', left:'72%', size:3, delay:'0.8s', dur:'9s' },
          { top:'20%', left:'55%', size:4, delay:'2s', dur:'6.5s' },
          { top:'85%', left:'40%', size:3, delay:'4s', dur:'8s' },
          { top:'45%', left:'92%', size:4, delay:'1s', dur:'7.5s' },
        ].map((p, i) => (
          <div key={i} style={{
            position:'absolute', top:p.top, left:p.left,
            width:p.size, height:p.size,
            background:'rgba(139,92,246,0.5)',
            borderRadius:'50%',
            animation:`sparkle ${p.dur} ${p.delay} ease-in-out infinite`,
            boxShadow:`0 0 ${p.size * 2}px rgba(139,92,246,0.4)`,
          }} />
        ))}

        {/* Fine grid overlay for depth */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'radial-gradient(circle, rgba(139,92,246,0.08) 1px, transparent 1px)',
          backgroundSize:'36px 36px',
        }} />

        {/* Corner radial vignettes */}
        <div style={{ position:'absolute', top:0, right:0, width:300, height:300, background:'radial-gradient(circle at top right, rgba(167,139,250,0.12), transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:300, height:300, background:'radial-gradient(circle at bottom left, rgba(99,102,241,0.1), transparent 70%)' }} />
      </div>

      {/* CSS Keyframes injected */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(25px) scale(0.97)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 33%{transform:translateY(-20px) scale(1.03) rotate(5deg)} 66%{transform:translateY(15px) scale(0.98) rotate(-3deg)} }
        @keyframes sparkle { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.5)} }
      `}</style>

      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 h-full overflow-hidden">
        {/* Sidebar */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full overflow-y-auto animate-in slide-in-from-left duration-500"
          style={{
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(167,139,250,0.2)',
            boxShadow: '0 4px 6px rgba(139,92,246,0.04), 0 12px 40px rgba(139,92,246,0.08), 0 32px 64px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
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
            navigate(`/chat/${chat._id}`);
          }} />
          
          <div className="px-4 py-3 flex items-center gap-3">
             <button 
               onClick={() => navigate('/chat/requests')}
               className="group relative text-[12px] font-bold flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-white hover:shadow-lg"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
             >
               <Mail size={14} />
               <span>REQUESTS</span>
               {pendingRequestsCount > 0 && (
                 <span className="bg-white text-violet-600 text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center ml-1">
                   {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                 </span>
               )}
             </button>
             
             <button 
               onClick={() => setShowArchived(!showArchived)}
               className={`text-[12px] font-bold flex items-center gap-2 px-5 py-2.5 rounded-full transition-all border ${showArchived ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-transparent border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'}`}
             >
               <Archive size={14} />
               <span>ARCHIVED</span>
               <span className="text-violet-400">✦</span>
             </button>
          </div>

          {banner && (
            <div className="mx-4 mt-4 mb-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 backdrop-blur-sm shadow-sm p-3 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-300">
              <span className="text-xs font-bold text-emerald-800 truncate">{banner.message}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => banner.chatId && setActiveChatId(banner.chatId)}
                  className="text-[10px] uppercase font-black px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >Open</button>
                <button
                  onClick={() => setBanner(null)}
                  className="text-[10px] uppercase font-black px-3 py-1.5 rounded-lg bg-white/50 text-emerald-800 hover:bg-white transition-colors"
                >Dismiss</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar py-2">
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

        {/* Chat Window Container */}
        <div className="md:col-span-7 lg:col-span-8 overflow-hidden h-full flex flex-col animate-in slide-in-from-right duration-500"
          style={{
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(167,139,250,0.18)',
            boxShadow: '0 4px 6px rgba(139,92,246,0.04), 0 12px 40px rgba(139,92,246,0.08), 0 32px 64px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.98)',
          }}
        >
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
            <div className="h-full flex items-center justify-center p-12 bg-gradient-to-b from-transparent to-indigo-50/20">
              <div className="max-w-md w-full text-center space-y-6">
                <div className="relative mx-auto h-32 w-32 flex items-center justify-center">
                  {/* Decorative Glowing Rings */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  
                  <div className="relative z-10 h-20 w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-4xl transform hover:scale-110 transition-transform duration-500 cursor-default">
                    💬
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Select a conversation</h3>
                  <p className="text-gray-500 font-medium text-lg max-w-xs mx-auto leading-relaxed">
                    Choose a chat from the sidebar or search for a new peer to start messaging.
                  </p>
                </div>
                
                <div className="flex justify-center gap-3 pt-4">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="h-2 w-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
