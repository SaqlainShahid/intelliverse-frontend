import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { searchUsers, createOrGetChat, getPeers, getTopInteractions, canMessage } from '../../services/chatService';
import { Users, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canMessageWithoutApproval, getRoleBadge } from '../../utils/chatPermissions';
import SendChatRequestModal from './SendChatRequestModal';

export default function NewChatBar({ onChatCreated, chats = [] }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [peers, setPeers] = useState([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [topList, setTopList] = useState([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topWindowDays, setTopWindowDays] = useState(7);
  const [topSort, setTopSort] = useState('time');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Simple text search — no filter params
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await searchUsers(q, 12);
        if (res?.success) setResults(res.data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const startChat = async (targetUser) => {
    try {
      const needsApproval = !canMessageWithoutApproval(user?.role, targetUser.role);
      if (needsApproval) {
        const permCheck = await canMessage(targetUser._id);
        if (permCheck?.data?.canMessage) {
          const res = await createOrGetChat(targetUser._id);
          if (res?.success && res.data) {
            onChatCreated?.(res.data);
            setQuery('');
            setResults([]);
            setShowQuick(false);
          }
        } else {
          setSelectedUser(targetUser);
          setRequestModalOpen(true);
          setQuery('');
          setResults([]);
        }
      } else {
        const res = await createOrGetChat(targetUser._id);
        if (res?.success && res.data) {
          onChatCreated?.(res.data);
          setQuery('');
          setResults([]);
          setShowQuick(false);
        }
      }
    } catch {
      toast.error('Failed to start chat');
    }
  };

  const loadPeers = async () => {
    setPeersLoading(true);
    try {
      const res = await getPeers(10);
      if (res?.success) setPeers(res.data);
    } finally {
      setPeersLoading(false);
    }
  };

  const loadTop = async () => {
    setTopLoading(true);
    try {
      const res = await getTopInteractions({ limit: 10, windowDays: topWindowDays, sort: topSort });
      if (res?.success) setTopList(res.data);
    } finally {
      setTopLoading(false);
    }
  };

  useEffect(() => {
    if (showQuick) loadTop();
  }, [topWindowDays, topSort, showQuick]);

  const recent = Array.from(new Map(
    (chats || []).map(c => c.otherUser).filter(Boolean).map(u => [u._id, u])
  ).values());

  return (
    <>
    <div className="p-4 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors z-10" />
            <input
              className="w-full border border-slate-200 bg-white/80 rounded-2xl pl-10 pr-10 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-slate-800 placeholder:text-slate-400 text-[13px] font-medium transition-all duration-200"
              style={{ backdropFilter: 'blur(10px)' }}
              placeholder="Search by name or email…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick contacts toggle */}
          <button
            type="button"
            onClick={async () => {
              const next = !showQuick;
              setShowQuick(next);
              if (next) {
                if (peers.length === 0) await loadPeers();
                if (topList.length === 0) await loadTop();
              }
            }}
            className={`h-11 w-11 flex items-center justify-center rounded-2xl border transition-all ${
              showQuick
                ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-500 px-1 mt-2 animate-pulse">
            <div className="h-1.5 w-1.5 bg-current rounded-full" />
            Searching…
          </div>
        )}

        {/* Results */}
        {!!results.length && (
          <div className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
              <button onClick={() => { setQuery(''); setResults([]); }} className="text-[10px] text-slate-400 hover:text-slate-600">
                Clear
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c4b5fd transparent' }}>
              {results.map(u => (
                <button
                  key={u._id}
                  onClick={() => startChat(u)}
                  className="w-full text-left px-3 py-2.5 hover:bg-violet-50/60 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white shadow overflow-hidden">
                    {u.profile?.avatar
                      ? <img src={`http://localhost:5000${u.profile.avatar}`} alt="" className="h-full w-full object-cover" />
                      : (u.profile?.firstName || 'U')[0].toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-violet-700 transition-colors">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </span>
                      <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700">
                        {getRoleBadge(u.role)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {[
                        u.profile?.designation,
                        u.profile?.department,
                        u.profile?.employeeType
                          ? u.profile.employeeType.charAt(0).toUpperCase() + u.profile.employeeType.slice(1)
                          : null,
                        u.email,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-400 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-sm">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="mt-2 text-center py-5 text-[12px] text-slate-400 font-medium">
            No users found
          </div>
        )}
      </div>

      {/* Quick contacts panel */}
      {showQuick && (
        <div className="mt-2 bg-iv-glass backdrop-blur-xl border border-iv-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30">Top interacted</div>
          <div className="px-3 py-2 flex items-center gap-2 border-t border-iv-border bg-white/30">
            <div className="flex items-center gap-1">
              {[{ v: 7, label: '7d' }, { v: 0, label: 'All' }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setTopWindowDays(v)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${topWindowDays === v ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[{ v: 'time', label: 'Recent' }, { v: 'count', label: 'Count' }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setTopSort(v)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${topSort === v ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {topLoading && <div className="px-4 py-3 text-xs text-iv-muted">Loading top...</div>}
          {!topLoading && topList.map(t => (
            <button key={`top-${t.chatId}`} onClick={() => startChat(t.otherUser)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border first:border-0 transition-colors">
              <span className="text-iv-text">{t.otherUser?.profile?.firstName} {t.otherUser?.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{t.messageCount} msgs</span>
            </button>
          ))}
          {!topLoading && topList.length === 0 && <div className="px-4 py-3 text-xs text-iv-muted">No interactions yet</div>}

          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30 border-t border-iv-border">Recent</div>
          {recent.map(u => (
            <button key={`recent-${u._id}`} onClick={() => startChat(u)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border transition-colors">
              <span className="text-iv-text">{u.profile?.firstName} {u.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{u.email}</span>
            </button>
          ))}

          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30 border-t border-iv-border">Department</div>
          {peersLoading && <div className="px-4 py-3 text-xs text-iv-muted">Loading peers...</div>}
          {!peersLoading && peers.map(u => (
            <button key={`peer-${u._id}`} onClick={() => startChat(u)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border transition-colors">
              <span className="text-iv-text">{u.profile?.firstName} {u.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{u.email}</span>
            </button>
          ))}
          {!peersLoading && peers.length === 0 && <div className="px-4 py-3 text-xs text-iv-muted">No peers found</div>}
        </div>
      )}
    </div>

    <SendChatRequestModal
      user={selectedUser}
      isOpen={requestModalOpen}
      onClose={() => { setRequestModalOpen(false); setSelectedUser(null); }}
      onSuccess={() => { toast.success('Chat request sent!'); setRequestModalOpen(false); setSelectedUser(null); }}
    />
    </>
  );
}
