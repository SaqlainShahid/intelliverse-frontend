import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { searchUsers, createOrGetChat, getPeers, getTopInteractions, autoCreateGroup, getGroupMeta } from '../../services/chatService';
import { Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function NewChatBar({ onChatCreated, chats = [], currentUserId }) {
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [meta, setMeta] = useState({ departments: [], batches: [] });
  const [groupType, setGroupType] = useState('department');
  const [groupKey, setGroupKey] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [memberEmailsText, setMemberEmailsText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await searchUsers(q, 8);
        if (res?.success) setResults(res.data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const startChat = async (userId) => {
    const res = await createOrGetChat(userId);
    if (res?.success && res.data) {
      onChatCreated?.(res.data);
      setQuery('');
      setResults([]);
      setShowQuick(false);
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
    if (showQuick) {
      loadTop();
    }
  }, [topWindowDays, topSort, showQuick]);

  const recent = Array.from(new Map(
    (chats || [])
      .map(c => c.otherUser)
      .filter(Boolean)
      .map(u => [u._id, u])
  ).values());

  return (
    <div className="border-b border-iv-border p-4">
      <div className="flex gap-2 items-center">
        <input
          className="flex-1 border-2 border-iv-indigo/20 bg-white/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-iv-indigo focus:ring-1 focus:ring-iv-indigo text-iv-text placeholder:text-iv-muted transition-all duration-200"
          placeholder="Search users by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
          className="h-11 w-11 flex items-center justify-center rounded-xl border border-iv-border bg-white/50 hover:bg-iv-indigo/10 text-iv-text transition-all duration-200"
          aria-label="Quick contacts"
          title="Quick contacts"
        >
          <Users className="h-5 w-5" />
        </button>
        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={async () => {
              const next = !showAdmin;
              setShowAdmin(next);
              if (next && meta.departments.length === 0 && meta.batches.length === 0) {
                setMetaLoading(true);
                try {
                  const res = await getGroupMeta();
                  if (res?.success) setMeta(res.data || { departments: [], batches: [] });
                } finally {
                  setMetaLoading(false);
                }
              }
            }}
            className="h-11 px-4 flex items-center justify-center rounded-xl border border-iv-border bg-white/50 hover:bg-iv-indigo/10 text-iv-text text-xs font-medium transition-all duration-200"
            aria-label="Auto-create groups"
            title="Auto-create groups"
          >
            Admin
          </button>
        )}
      </div>
      {loading && (
        <div className="text-xs text-iv-muted mt-2 px-1">Searching...</div>
      )}
      {!!results.length && (
        <div className="mt-2 bg-iv-glass backdrop-blur-xl border border-iv-border rounded-xl shadow-lg overflow-hidden">
          {results.map((u) => (
            <button
              key={u._id}
              onClick={() => startChat(u._id)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-b border-iv-border last:border-0 transition-colors"
            >
              <span className="font-medium text-iv-text">{u.profile?.firstName} {u.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{u.email}</span>
            </button>
          ))}
        </div>
      )}
      {showQuick && (
        <div className="mt-2 bg-iv-glass backdrop-blur-xl border border-iv-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30">Top interacted</div>
          <div className="px-3 py-2 flex items-center gap-2 border-t border-iv-border bg-white/30">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTopWindowDays(7)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${topWindowDays === 7 ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}
              >7d</button>
              <button
                type="button"
                onClick={() => setTopWindowDays(0)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${topWindowDays === 0 ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}
              >All</button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTopSort('time')}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${topSort === 'time' ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}
              >Recent</button>
              <button
                type="button"
                onClick={() => setTopSort('count')}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${topSort === 'count' ? 'bg-iv-indigo text-white' : 'bg-white/50 text-iv-text hover:bg-white'}`}
              >Count</button>
            </div>
          </div>
          {topLoading && (
            <div className="px-4 py-3 text-xs text-iv-muted">Loading top...</div>
          )}
          {(!topLoading && topList.length > 0) && topList.map(t => (
            <button
              key={`top-${t.chatId}`}
              onClick={() => startChat(t.otherUser._id)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border first:border-0 transition-colors"
            >
              <span className="text-iv-text">{t.otherUser?.profile?.firstName} {t.otherUser?.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{t.messageCount} msgs</span>
            </button>
          ))}
          {(!topLoading && topList.length === 0) && (
            <div className="px-4 py-3 text-xs text-iv-muted">No interactions yet</div>
          )}
          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30 border-t border-iv-border">Recent</div>
          {(recent || []).map(u => (
            <button
              key={`recent-${u._id}`}
              onClick={() => startChat(u._id)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border transition-colors"
            >
              <span className="text-iv-text">{u.profile?.firstName} {u.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{u.email}</span>
            </button>
          ))}
          <div className="px-4 py-3 text-xs font-semibold text-iv-muted uppercase tracking-wider bg-white/30 border-t border-iv-border">Department</div>
          {peersLoading && (
            <div className="px-4 py-3 text-xs text-iv-muted">Loading peers...</div>
          )}
          {(!peersLoading && peers.length > 0) && peers.map(u => (
            <button
              key={`peer-${u._id}`}
              onClick={() => startChat(u._id)}
              className="w-full text-left p-3 hover:bg-iv-indigo/5 flex justify-between border-t border-iv-border transition-colors"
            >
              <span className="text-iv-text">{u.profile?.firstName} {u.profile?.lastName}</span>
              <span className="text-xs text-iv-muted">{u.email}</span>
            </button>
          ))}
          {(!peersLoading && peers.length === 0) && (
            <div className="px-4 py-3 text-xs text-iv-muted">No peers found</div>
          )}
        </div>
      )}
      {showAdmin && user?.role === 'admin' && (
        <div className="mt-2 bg-white border rounded-lg">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 flex items-center justify-between">
            <span>Auto-create groups</span>
            {metaLoading && <span className="text-[10px] text-gray-400">Loading meta…</span>}
          </div>
          <div className="px-3 py-2 border-t flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGroupType('department')}
              className={`px-2 py-1 text-xs rounded ${groupType === 'department' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >Department</button>
            <button
              type="button"
              onClick={() => setGroupType('batch')}
              className={`px-2 py-1 text-xs rounded ${groupType === 'batch' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >Batch</button>
            <button
              type="button"
              onClick={() => setGroupType('course')}
              className={`px-2 py-1 text-xs rounded ${groupType === 'course' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >Course</button>
          </div>
          <div className="px-3 py-2 border-t space-y-2">
            {groupType === 'department' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 shrink-0">Department</label>
                <select
                  value={groupKey}
                  onChange={(e) => setGroupKey(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">Select</option>
                  {(meta.departments || []).map((d) => (
                    <option key={`dept-${d}`} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            {groupType === 'batch' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 shrink-0">Semester</label>
                <select
                  value={groupKey}
                  onChange={(e) => setGroupKey(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">Select</option>
                  {(meta.batches || []).map((b) => (
                    <option key={`batch-${b}`} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
            {groupType === 'course' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-700 shrink-0">Course code</label>
                  <input
                    value={groupKey}
                    onChange={(e) => setGroupKey(e.target.value)}
                    placeholder="Optional"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Member emails (comma/newline separated)</label>
                  <textarea
                    value={memberEmailsText}
                    onChange={(e) => setMemberEmailsText(e.target.value)}
                    rows={3}
                    className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="student1@univ.edu, student2@univ.edu"
                  />
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 shrink-0">Name</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={groupType === 'department' ? 'Department group name' : groupType === 'batch' ? 'Batch group name' : 'Course group name'}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 shrink-0">Description</label>
              <input
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Optional"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  const type = groupType;
                  let key = (groupKey || '').trim();
                  if (type === 'batch') {
                    if (!key) return toast.error('Select a semester');
                    if (isNaN(Number(key))) return toast.error('Semester must be a number');
                  }
                  if (type === 'department') {
                    if (!key) return toast.error('Select a department');
                  }
                  if (type === 'course') {
                    const emails = (memberEmailsText || '')
                      .split(/[\s,;]+/)
                      .map(x => x.trim())
                      .filter(Boolean);
                    if (emails.length < 2) return toast.error('Add at least 2 member emails');
                  }
                  const name = (groupName || '').trim();
                  const description = (groupDesc || '').trim();
                  const payload = { type, key: key || undefined, name: name || undefined, description: description || undefined };
                  if (type === 'course') {
                    payload.memberEmails = (memberEmailsText || '')
                      .split(/[\s,;]+/)
                      .map(x => x.trim())
                      .filter(Boolean);
                  }
                  setCreating(true);
                  try {
                    const res = await autoCreateGroup(payload);
                    if (res?.success) {
                      if (res.created) toast.success('Group created');
                      else if (res.updated) toast.success('Group updated');
                      else toast.success('Group saved');
                      setGroupName('');
                      setGroupDesc('');
                      setGroupKey('');
                      setMemberEmailsText('');
                    } else {
                      toast.error(res?.message || 'Unable to auto-create group');
                    }
                  } catch (e) {
                    toast.error('Failed to auto-create group');
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className={`text-xs px-3 py-1 rounded ${creating ? 'bg-gray-300 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroupName('');
                  setGroupDesc('');
                  setGroupKey('');
                  setMemberEmailsText('');
                }}
                className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
