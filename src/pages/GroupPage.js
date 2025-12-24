import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { searchUsers, updateGroupMembers } from '../services/chatService';
import { Users, Settings, Edit, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GroupPage = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [details, setDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [name, setName] = React.useState('');
  const [announcementOnly, setAnnouncementOnly] = React.useState(false);
  const [roleMentionsEnabled, setRoleMentionsEnabled] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/p2p/chats/${groupId}`);
      const d = res.data?.data || null;
      setDetails(d);
      setName(d?.name || '');
      setAnnouncementOnly(!!(d?.settings && d.settings.announcementOnly));
      setRoleMentionsEnabled(!(d?.settings && d.settings.roleMentionsEnabled === false));
      setLoading(false);
    } catch (e) {
      setError('Failed to load group');
      setLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => { load(); }, [load]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const up = await api.post('/p2p/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = up.data?.data?.url;
      if (url) {
        await api.patch(`/p2p/chats/${groupId}/image`, { image: url });
        await load();
      }
    } catch {}
    setUploading(false);
  };

  const saveName = async () => {
    try {
      await api.patch(`/p2p/chats/${groupId}/name`, { name });
      await load();
    } catch {}
  };

  const toggleSetting = async (key, value) => {
    try {
      await api.patch(`/p2p/chats/${groupId}/settings`, { [key]: value });
      await load();
    } catch {}
  };

  const admins = details?.admins || [];
  const participants = details?.participants || [];
  const isAdmin = admins.some((a) => a._id === (user?._id || ''));
  const [searchText, setSearchText] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [showResults, setShowResults] = React.useState(false);

  return (
    <div className="min-h-screen bg-iv-bg">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-iv-text">Group</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-iv-border flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center">
                  {details?.image ? (
                    <img src={details.image} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10 text-iv-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-iv-text">{details?.name || 'Group'}</div>
                  <div className="text-sm text-iv-muted">{participants.length} members</div>
                </div>
                {isAdmin && (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
                    <div className="px-3 py-2 rounded-xl bg-white border border-iv-border text-iv-muted hover:bg-gray-50 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Change image'}
                    </div>
                  </label>
                )}
              </div>

              <div className="p-6 space-y-4">
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-2 border border-iv-border rounded-xl text-sm" />
                    <button onClick={saveName} className="px-4 py-2 rounded-xl bg-iv-indigo text-white">Save</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-iv-border flex items-center gap-2">
                <Settings className="w-5 h-5 text-iv-indigo" />
                <div className="text-xl font-bold text-iv-text">Settings</div>
              </div>
              <div className="p-6 space-y-6">
                {isAdmin && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-iv-text">Announcement Only</p>
                    <p className="text-sm text-iv-muted">Only admins can send messages</p>
                  </div>
                  <button onClick={() => toggleSetting('announcementOnly', !announcementOnly)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${announcementOnly ? 'bg-iv-indigo' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${announcementOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                )}
                {isAdmin && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-iv-text">Role Mentions</p>
                    <p className="text-sm text-iv-muted">Allow role-based mentions</p>
                  </div>
                  <button onClick={() => toggleSetting('roleMentionsEnabled', !roleMentionsEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${roleMentionsEnabled ? 'bg-iv-indigo' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${roleMentionsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                )}
              </div>
            </div>

            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-iv-border flex items-center gap-2">
                <Edit className="w-5 h-5 text-iv-indigo" />
                <div className="text-xl font-bold text-iv-text">Members</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl overflow-hidden bg-white">
                          {p.profile?.avatar ? (
                            <img src={p.profile.avatar} className="w-full h-full object-cover cursor-pointer" alt="avatar" onClick={() => (window.location.href = `/profile/${p._id}`)} />
                          ) : (
                            <div className="w-full h-full bg-iv-indigo/10 flex items-center justify-center cursor-pointer" onClick={() => (window.location.href = `/profile/${p._id}`)}>👤</div>
                          )}
                        </div>
                        <button className="text-sm text-iv-text font-medium hover:underline" onClick={() => (window.location.href = `/profile/${p._id}`)}>
                          {`${p.profile?.firstName || ''} ${p.profile?.lastName || ''}`.trim() || p.email}
                        </button>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={async () => { await api.patch(`/p2p/chats/${groupId}/admins`, { action: (admins || []).some(a => a._id === p._id) ? 'demote' : 'promote', userId: p._id }); await load(); }} className="text-xs px-2 py-1 rounded border border-iv-border hover:bg-iv-indigo/10">
                            {(admins || []).some(a => a._id === p._id) ? 'Demote' : 'Promote'}
                          </button>
                          <button onClick={async () => { await api.patch(`/p2p/chats/${groupId}/members`, { action: 'remove', userId: p._id }); await load(); }} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="relative">
                    <input
                      value={searchText}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setSearchText(v);
                        if (v.length >= 2) {
                          try {
                            const r = await searchUsers(v, 8);
                            setResults(r?.data || []);
                            setShowResults(true);
                          } catch {
                            setResults([]);
                            setShowResults(false);
                          }
                        } else {
                          setResults([]);
                          setShowResults(false);
                        }
                      }}
                      placeholder="Search users"
                      className="w-full px-3 py-2 border border-iv-border rounded-xl text-sm"
                    />
                    {showResults && results.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-iv-border rounded-xl shadow-lg z-50">
                        {results.map((u) => (
                          <button
                            key={u._id}
                            onClick={async () => {
                              try {
                                await updateGroupMembers(groupId, 'add', u._id);
                                setSearchText('');
                                setResults([]);
                                setShowResults(false);
                                await load();
                              } catch {}
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-iv-indigo/10"
                          >
                            {`${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-iv-border text-xl font-bold text-iv-text">Info</div>
              <div className="p-6 space-y-3">
                <div className="text-sm text-iv-muted">Created</div>
                <div className="text-iv-text font-medium">{details?.createdAt ? new Date(details.createdAt).toLocaleString() : '—'}</div>
                <div className="text-sm text-iv-muted">Admins</div>
                <div className="space-y-2">
                  {(admins || []).map((a) => (
                    <div key={a._id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xl overflow-hidden bg-white">
                        {a.profile?.avatar ? (
                          <img src={a.profile.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <div className="w-full h-full bg-iv-indigo/10 flex items-center justify-center">👤</div>
                        )}
                      </div>
                      <div className="text-sm text-iv-text font-medium">{`${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.trim() || a.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="mt-6 text-iv-muted">Loading...</div>}
        {error && <div className="mt-6 text-red-600">{error}</div>}
      </main>
    </div>
  );
};

export default GroupPage;