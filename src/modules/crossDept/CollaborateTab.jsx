import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Users, Tag, Building2, CheckCircle2, Loader2, Trash2, XCircle, MessageSquare, UserCheck, UserX, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket } from '../../services/socket';
import { DEPARTMENT_LIST } from '../../constants/departments';
import { createCollabRequest, getCollabRequests, respondToCollab, closeCollabRequest, deleteCollabRequest, acceptRespondent, declineRespondent, startTeamChat } from '../../services/collabService';

const ROLES = ['faculty', 'hod', 'student'];
const ROLE_COLORS = { faculty: 'bg-violet-100 text-violet-700', hod: 'bg-indigo-100 text-indigo-700', student: 'bg-emerald-100 text-emerald-700' };

const STATUS_STYLES = {
  pending:  'bg-amber-50  text-amber-700  border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-slate-100 text-slate-500  border-slate-200',
};

function RequestCard({ req, currentUser, onRespond, onClose, onDelete, onAccept, onDecline, onStartTeamChat }) {
  const [showRespond, setShowRespond] = useState(false);
  const [respondMsg, setRespondMsg]   = useState('');
  const [acting, setActing]           = useState(false);
  const [teamStarting, setTeamStarting] = useState(false);

  const myId = (currentUser?._id || currentUser?.id)?.toString();
  const isOwner = !!(myId && (
    req.requestedBy?._id?.toString() === myId ||
    (currentUser?.email && req.requestedBy?.email === currentUser.email)
  ));
  const myResponse = req.respondents?.find(r => r.user?._id?.toString() === myId || r.user?.toString() === myId);
  const alreadyResponded = !!myResponse;
  const canRespond = !isOwner && !alreadyResponded && req.status === 'open';

  const acceptedCount = req.respondents?.filter(r => r.status === 'accepted').length || 0;

  const handleRespond = async () => {
    setActing(true);
    try { await onRespond(req._id, respondMsg); setShowRespond(false); setRespondMsg(''); }
    finally { setActing(false); }
  };

  const handleTeamChat = async () => {
    setTeamStarting(true);
    try { await onStartTeamChat(req._id); }
    finally { setTeamStarting(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition-all ${req.status === 'closed' ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:shadow-md'}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${req.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {req.status}
            </span>
            {req.topic && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                <Tag className="w-3 h-3" />{req.topic}
              </span>
            )}
            {req.teamChatId && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                <MessagesSquare className="w-3 h-3" /> Team chat active
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 leading-snug">{req.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{req.description}</p>
        </div>

        {isOwner && req.status === 'open' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onClose(req._id)} title="Close request"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors border border-slate-200">
              <XCircle className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(req._id)} title="Delete"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <Users className="w-3 h-3" />
          {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName}
          {req.requestedBy?.profile?.department && ` · ${req.requestedBy.profile.department}`}
        </span>
        {req.targetRoles?.map(role => (
          <span key={role} className={`px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-600'}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        ))}
        {req.targetDepartments?.map(dept => (
          <span key={dept} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            <Building2 className="w-3 h-3" />{dept}
          </span>
        ))}
        <span className="text-slate-400">{new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>

      {/* ── Respondents (owner view) ──────────────────────────────────── */}
      {isOwner && req.respondents?.length > 0 && (
        <div className="border-t border-slate-50 pt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {req.respondents.length} interested · {acceptedCount} accepted
          </p>
          {req.respondents.map((r) => (
            <div key={r._id} className={`flex items-center gap-3 rounded-xl p-3 border ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {(r.user?.profile?.firstName || '?')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {r.user?.profile?.firstName} {r.user?.profile?.lastName}
                  {r.user?.profile?.designation && <span className="ml-1 font-normal text-slate-500">· {r.user.profile.designation}</span>}
                </p>
                <p className="text-[11px] text-slate-500">{r.user?.profile?.department}</p>
                {r.message && <p className="text-[11px] text-slate-500 mt-0.5 italic">"{r.message}"</p>}
              </div>
              {/* Status badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>
                {r.status || 'pending'}
              </span>
              {/* Accept / Decline buttons — only when pending (treat missing status as pending) */}
              {(!r.status || r.status === 'pending') && req.status === 'open' && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onAccept(req._id, r._id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    <UserCheck className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={() => onDecline(req._id, r._id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <UserX className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              )}
              {/* Re-accept if declined */}
              {r.status === 'declined' && req.status === 'open' && (
                <button onClick={() => onAccept(req._id, r._id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors flex-shrink-0">
                  <UserCheck className="w-3.5 h-3.5" /> Accept
                </button>
              )}
            </div>
          ))}

          {/* Start Team Chat */}
          {acceptedCount > 0 && (
            <button onClick={handleTeamChat} disabled={teamStarting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-1">
              <MessagesSquare className="w-4 h-4" />
              {teamStarting ? 'Creating…' : req.teamChatId ? 'Open Team Chat' : `Start Team Chat (${acceptedCount} member${acceptedCount !== 1 ? 's' : ''})`}
            </button>
          )}
        </div>
      )}

      {/* ── Respondent summary (non-owner view) ──────────────────────── */}
      {!isOwner && req.respondents?.length > 0 && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-50">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {req.respondents.length} person{req.respondents.length !== 1 ? 's' : ''} interested
          {myResponse && (
            <span className={`ml-2 font-bold px-2 py-0.5 rounded-full border text-[10px] ${STATUS_STYLES[myResponse.status]}`}>
              Your status: {myResponse.status}
            </span>
          )}
        </p>
      )}

      {/* ── Express Interest (non-owner, not yet responded) ───────────── */}
      {canRespond && (
        showRespond ? (
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <textarea value={respondMsg} onChange={e => setRespondMsg(e.target.value)} rows={2}
              placeholder="Add a short message — your background, relevant skills (optional)…"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
            <div className="flex gap-2">
              <button onClick={handleRespond} disabled={acting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />{acting ? 'Sending…' : "I'm Interested"}
              </button>
              <button onClick={() => { setShowRespond(false); setRespondMsg(''); }}
                className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 text-slate-500 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowRespond(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Express Interest
          </button>
        )
      )}
    </div>
  );
}

export default function CollaborateTab() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const canPost   = ['faculty', 'hod', 'admin'].includes(user?.role);

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMine, setViewMine]   = useState(false);

  // Create form state
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic]           = useState('');
  const [targetDepts, setTargetDepts] = useState([]);
  const [targetRoles, setTargetRoles] = useState(['faculty']);
  const [creating, setCreating]     = useState(false);

  const toggleDept = (d) => setTargetDepts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const toggleRole = (r) => setTargetRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCollabRequests(viewMine ? { mine: true, status: 'all' } : { status: 'open' });
      if (res?.success) setRequests(res.data);
    } catch { /* interceptor handles */ }
    finally { setLoading(false); }
  }, [viewMine]);

  useEffect(() => { load(); }, [load]);

  // Real-time: reload when someone responds to one of our requests
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => load();
    socket.on('collab:response', handler);
    return () => socket.off('collab:response', handler);
  }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return toast.error('Title and description are required');
    if (targetRoles.length === 0) return toast.error('Select at least one target role');
    setCreating(true);
    try {
      const res = await createCollabRequest({ title: title.trim(), description: description.trim(), topic: topic.trim() || undefined, targetDepartments: targetDepts, targetRoles });
      if (res?.success) {
        toast.success('Collaboration request posted');
        setRequests(prev => [res.data, ...prev]);
        setTitle(''); setDescription(''); setTopic(''); setTargetDepts([]); setTargetRoles(['faculty']);
        setShowCreate(false);
      }
    } catch { toast.error('Failed to post request'); }
    finally { setCreating(false); }
  };

  const handleRespond = async (id, message) => {
    const res = await respondToCollab(id, message);
    if (res?.success) {
      toast.success("Interest noted — the requester has been notified");
      setRequests(prev => prev.map(r => r._id === id ? { ...r, respondents: [...(r.respondents || []), { user: { _id: user._id, email: user.email, profile: user.profile }, message, status: 'pending', respondedAt: new Date() }] } : r));
    }
  };

  const handleAccept = async (requestId, respondentId) => {
    const res = await acceptRespondent(requestId, respondentId);
    if (res?.success) {
      toast.success('Member accepted');
      setRequests(prev => prev.map(r => r._id === requestId ? {
        ...r, respondents: r.respondents.map(resp =>
          resp._id === respondentId ? { ...resp, status: 'accepted' } : resp
        )
      } : r));
    }
  };

  const handleDecline = async (requestId, respondentId) => {
    const res = await declineRespondent(requestId, respondentId);
    if (res?.success) {
      toast.success('Member declined');
      setRequests(prev => prev.map(r => r._id === requestId ? {
        ...r, respondents: r.respondents.map(resp =>
          resp._id === respondentId ? { ...resp, status: 'declined' } : resp
        )
      } : r));
    }
  };

  const handleStartTeamChat = async (requestId) => {
    const res = await startTeamChat(requestId);
    if (res?.success) {
      toast.success('Team chat ready!');
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, teamChatId: res.data.chatId } : r));
      navigate(`/chat/${res.data.chatId}`);
    }
  };

  const handleClose = async (id) => {
    await closeCollabRequest(id);
    toast.success('Request closed');
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'closed' } : r));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collaboration request?')) return;
    await deleteCollabRequest(id);
    toast.success('Deleted');
    setRequests(prev => prev.filter(r => r._id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMine(false)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${!viewMine ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
            Open Requests
          </button>
          {canPost && (
            <button onClick={() => setViewMine(v => !v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${viewMine ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
              My Requests
            </button>
          )}
        </div>
        {canPost && (
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Post Request
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && canPost && (
        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">New Collaboration Request</h3>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="e.g. Looking for co-researchers in AI & Healthcare"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe your project, what you need, and what collaborators would gain…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Topic / Area <span className="normal-case font-normal">(optional)</span></label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Machine Learning, Renewable Energy, Finance"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Looking for <span className="font-normal normal-case">(select roles)</span></label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${targetRoles.includes(r) ? ROLE_COLORS[r] + ' border-current' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Target Departments <span className="font-normal normal-case">(leave empty for all)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENT_LIST.filter(d => d !== 'Other').map(d => (
                <button key={d} type="button" onClick={() => toggleDept(d)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${targetDepts.includes(d) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-500 hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {creating ? 'Posting…' : 'Post Request'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}

      {!loading && requests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">{viewMine ? "You haven't posted any requests yet" : "No open collaboration requests"}</p>
          {canPost && !viewMine && <p className="text-slate-400 text-sm mt-1">Be the first to post one!</p>}
        </div>
      )}

      {!loading && requests.map(req => (
        <RequestCard key={req._id} req={req} currentUser={user}
          onRespond={handleRespond}
          onClose={handleClose}
          onDelete={handleDelete}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onStartTeamChat={handleStartTeamChat} />
      ))}
    </div>
  );
}
