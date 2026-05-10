import React, { useState, useEffect } from 'react';
import { getQueries, replyToQuery, escalateQuery, transferQuery, addQueryCollaborator, setQueryTopicTags, getTopicAnalytics } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { MessageSquare, AlertOctagon, Send, Loader2, Tag, BarChart2, X, ArrowRightLeft, TrendingUp, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const TOPIC_TAGS = ['Fee', 'Transcript', 'Internship', 'Scholarship', 'Registration', 'Grading', 'Course Drop', 'Leave', 'Hostel', 'Other'];

const TOPIC_COLORS = {
  Fee: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Transcript: 'bg-sky-100 text-sky-700 border-sky-200',
  Internship: 'bg-violet-100 text-violet-700 border-violet-200',
  Scholarship: 'bg-amber-100 text-amber-700 border-amber-200',
  Registration: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Grading: 'bg-rose-100 text-rose-700 border-rose-200',
  'Course Drop': 'bg-orange-100 text-orange-700 border-orange-200',
  Leave: 'bg-teal-100 text-teal-700 border-teal-200',
  Hostel: 'bg-pink-100 text-pink-700 border-pink-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',    classes: 'bg-amber-50 text-amber-700 border-amber-200',       bar: 'bg-gradient-to-r from-amber-400 to-orange-400' },
  resolved:  { label: 'Resolved',   classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-gradient-to-r from-emerald-400 to-teal-500'  },
  escalated: { label: 'Escalated',  classes: 'bg-rose-50 text-rose-700 border-rose-200',          bar: 'bg-gradient-to-r from-rose-400 to-red-500'      },
  answered:  { label: 'AI Answer',  classes: 'bg-sky-50 text-sky-700 border-sky-200',             bar: 'bg-gradient-to-r from-sky-400 to-indigo-400'    },
};

// ─── Query card ───────────────────────────────────────────────────────────────
const QueryCard = ({ query, onReply, onEscalate, onTransfer, onAddCollaborator, onTagUpdate, processingId, departments }) => {
  const [replyText, setReplyText]         = useState('');
  const [transferDept, setTransferDept]   = useState('');
  const [transferNote, setTransferNote]   = useState('');
  const [collabDept, setCollabDept]       = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [localTags, setLocalTags]         = useState(query.topicTags || []);
  const [savingTags, setSavingTags]       = useState(false);
  const [expanded, setExpanded]           = useState(true);

  const toggleTag = (tag) => setLocalTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  const saveTags  = async () => {
    setSavingTags(true);
    try { await onTagUpdate(query._id, localTags); setShowTagPicker(false); }
    finally { setSavingTags(false); }
  };

  const sc      = STATUS_CONFIG[query.status] || STATUS_CONFIG.pending;
  const initials = `${query.userId?.profile?.firstName?.[0] || ''}${query.userId?.profile?.lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-indigo-200/50"
      style={{ boxShadow: '0 2px 12px -4px rgba(0,0,0,0.06)' }}>
      {/* Gradient status bar */}
      <div className={`h-[3px] w-full ${sc.bar}`} />

      <div className="p-5">
        {/* ── Card header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-[13px] flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#6d28d9,#4f46e5)' }}>
              {initials}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-800 leading-tight">
                {query.userId?.profile?.firstName} {query.userId?.profile?.lastName}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">{query.userId?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sc.classes}`}>{sc.label}</span>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              {new Date(query.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
              query.tag === 'IT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              query.tag === 'Finance' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>{query.tag}</span>
            <button onClick={() => setExpanded(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
            </button>
          </div>
        </div>

        {expanded && (
          <>
            {/* Message bubble */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[14px] text-slate-700 leading-relaxed">{query.message}</p>
            </div>

            {/* AI suggestion */}
            {query.aiResponse && (
              <div className="mt-3 p-3.5 rounded-2xl border border-indigo-100 flex gap-3"
                style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  <span className="text-white text-[9px] font-black">AI</span>
                </div>
                <p className="text-[12px] text-indigo-800 leading-relaxed">
                  <span className="font-bold">Suggestion: </span>{query.aiResponse}
                </p>
              </div>
            )}

            {/* Topic tags */}
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              {localTags.map(tag => (
                <span key={tag} className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${TOPIC_COLORS[tag] || TOPIC_COLORS.Other}`}>{tag}</span>
              ))}
              <button onClick={() => setShowTagPicker(p => !p)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                <Tag className="w-3 h-3" />{localTags.length === 0 ? 'Add tags' : 'Edit'}
              </button>
            </div>

            {showTagPicker && (
              <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all ${
                        localTags.includes(tag) ? TOPIC_COLORS[tag] || TOPIC_COLORS.Other : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
                      }`}>{tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveTags} disabled={savingTags}
                    className="text-[11px] px-3 py-1.5 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {savingTags ? 'Saving…' : 'Save tags'}
                  </button>
                  <button onClick={() => { setLocalTags(query.topicTags || []); setShowTagPicker(false); }}
                    className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Collaborators */}
            {Array.isArray(query?.collaboratorStatuses) && query.collaboratorStatuses.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Collaborators</span>
                {query.collaboratorStatuses.map((cs, i) => (
                  <span key={i} className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${cs.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {cs.department?.name || 'Unknown'} · {cs.status}
                  </span>
                ))}
              </div>
            )}

            {/* Transfer history */}
            {Array.isArray(query?.transfers) && query.transfers.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transfer History</p>
                {query.transfers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{t.fromDepartment?.name || 'Unassigned'}</span>
                    <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                    <span className="font-semibold text-slate-700">{t.toDepartment?.name || 'Unassigned'}</span>
                    {t.note && <span className="text-slate-400 italic">· "{t.note}"</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {query.status === 'pending' && (
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                {/* Reply */}
                <div className="flex gap-2">
                  <input type="text" placeholder="Type a reply to resolve…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all"
                    value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <button onClick={() => { if (!replyText.trim()) return; onReply(query._id, replyText, () => setReplyText('')); }}
                    disabled={processingId === query._id || !replyText.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-white disabled:opacity-40 flex-shrink-0 hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}>
                    <Send className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEscalate(query._id)} disabled={processingId === query._id}
                    title="Escalate to HelpDesk"
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 flex-shrink-0 transition-colors">
                    <AlertOctagon className="w-4 h-4" />
                  </button>
                </div>

                {/* Transfer + Collab */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-1.5">
                    <select value={transferDept} onChange={e => setTransferDept(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-0">
                      <option value="">Transfer to…</option>
                      {departments.filter(d => d !== query.tag).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={() => onTransfer(query._id, transferDept, transferNote, () => { setTransferDept(''); setTransferNote(''); })}
                      disabled={processingId === query._id || !transferDept}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 flex-shrink-0">
                      Send
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <select value={collabDept} onChange={e => setCollabDept(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-0">
                      <option value="">Add collaborator…</option>
                      {departments.filter(d => d !== query.tag).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={() => onAddCollaborator(query._id, collabDept, () => setCollabDept(''))}
                      disabled={processingId === query._id || !collabDept}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 flex-shrink-0">
                      Add
                    </button>
                  </div>
                </div>

                <input type="text" placeholder="Optional transfer note…"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all"
                  value={transferNote} onChange={e => setTransferNote(e.target.value)} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main dashboard ───────────────────────────────────────────────────────────
const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [queries, setQueries]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedDept, setSelectedDept]     = useState(user?.profile?.department || '');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedQueue, setSelectedQueue]   = useState('all');
  const [processingId, setProcessingId]     = useState(null);
  const [showAnalytics, setShowAnalytics]   = useState(false);
  const [analytics, setAnalytics]           = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const baseDepartments = ['IT', 'Finance', 'Exams', 'Admissions', 'Hostel', 'Library', 'Career', 'Other'];
  const departments = user?.profile?.department && !baseDepartments.includes(user.profile.department)
    ? [...baseDepartments, user.profile.department] : baseDepartments;

  useEffect(() => {
    fetchQueries();
    const socket = getSocket();
    if (socket) {
      socket.on('query:new', (q) => {
        const col = (q?.collaboratingDepartments || []).map(d => typeof d === 'string' ? d : d?.name).filter(Boolean);
        if ((!selectedDept || q.tag === selectedDept || col.includes(selectedDept)) && (!selectedStatus || q.status === selectedStatus)) {
          setQueries(p => [q, ...p]); toast('New query received', { icon: '🔔' });
        }
      });
      socket.on('query:update', (q) => {
        const col = (q?.collaboratingDepartments || []).map(d => typeof d === 'string' ? d : d?.name).filter(Boolean);
        const match = (!selectedDept || q.tag === selectedDept || col.includes(selectedDept)) && (!selectedStatus || q.status === selectedStatus);
        setQueries(prev => {
          if (!match) return prev.filter(x => x._id !== q._id);
          const idx = prev.findIndex(x => x._id === q._id);
          if (idx === -1) return [q, ...prev];
          const c = [...prev]; c[idx] = q; return c;
        });
      });
    }
    return () => { if (socket) { socket.off('query:new'); socket.off('query:update'); } };
  }, [selectedDept, selectedStatus]);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await getQueries({ department: selectedDept, status: selectedStatus });
      if (res.success) {
        setQueries((Array.isArray(res.data) ? res.data : []).filter(q => {
          if (selectedQueue === 'awaiting-owner') return q.ownerStatus !== 'resolved' && (q.collaboratorStatuses || []).every(cs => cs.status === 'resolved');
          if (selectedQueue === 'awaiting-collaborators') return (q.collaboratorStatuses || []).some(cs => cs.status !== 'resolved');
          return true;
        }));
      }
    } catch { toast.error('Failed to fetch queries'); }
    finally { setLoading(false); }
  };

  const handleReply          = async (id, text, cb) => { try { setProcessingId(id); await replyToQuery(id, text, 'resolved'); toast.success('Reply sent & resolved'); cb?.(); fetchQueries(); } catch { toast.error('Failed to reply'); } finally { setProcessingId(null); } };
  const handleEscalate       = async (id)           => { try { setProcessingId(id); await escalateQuery(id); toast.success('Query escalated'); fetchQueries(); } catch { toast.error('Failed to escalate'); } finally { setProcessingId(null); } };
  const handleTransfer       = async (id, d, n, cb) => { try { setProcessingId(id); await transferQuery(id, d, n); toast.success('Query transferred'); cb?.(); fetchQueries(); } catch { toast.error('Failed to transfer'); } finally { setProcessingId(null); } };
  const handleAddCollaborator = async (id, d, cb)  => { try { setProcessingId(id); await addQueryCollaborator(id, d); toast.success('Collaborator added'); cb?.(); fetchQueries(); } catch { toast.error('Failed to add'); } finally { setProcessingId(null); } };
  const handleTagUpdate      = async (id, tags)    => { try { await setQueryTopicTags(id, tags); toast.success('Tags saved'); fetchQueries(); } catch { toast.error('Failed to save tags'); } };
  const fetchAnalytics       = async ()            => { setAnalyticsLoading(true); try { const r = await getTopicAnalytics(selectedDept ? { department: selectedDept } : {}); if (r.success) setAnalytics(r.data); } catch { toast.error('Failed to load analytics'); } finally { setAnalyticsLoading(false); } };
  const toggleAnalytics      = ()                  => { const n = !showAnalytics; setShowAnalytics(n); if (n && analytics.length === 0) fetchAnalytics(); };

  const pendingCount   = queries.filter(q => q.status === 'pending').length;
  const resolvedCount  = queries.filter(q => q.status === 'resolved').length;
  const escalatedCount = queries.filter(q => q.status === 'escalated').length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4f46e5 100%)', boxShadow: '0 20px 60px -10px rgba(79,70,229,0.45)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#818cf8,transparent 70%)' }} />

        <div className="relative flex items-center justify-between p-7">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 mb-2">
                IntelliVerse · AI Routing
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">Department Queries</h1>
              <p className="text-indigo-200 text-[13px] mt-0.5">Manage and resolve student inquiries routed by AI</p>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            {[
              { label: 'Pending',   val: pendingCount,   c: 'bg-amber-400/20 border-amber-400/30 text-amber-200'   },
              { label: 'Resolved',  val: resolvedCount,  c: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200' },
              { label: 'Escalated', val: escalatedCount, c: 'bg-rose-400/20 border-rose-400/30 text-rose-200'      },
            ].map(({ label, val, c }) => (
              <div key={label} className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border ${c}`}>
                <span className="text-[24px] font-black leading-none">{val}</span>
                <span className="text-[10px] font-semibold mt-0.5 opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center gap-2"
        style={{ boxShadow: '0 2px 12px -4px rgba(0,0,0,0.06)' }}>
        <button onClick={toggleAnalytics}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all ${showAnalytics ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'}`}
          style={showAnalytics ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' } : {}}>
          <TrendingUp className="w-3.5 h-3.5" /> Topic Analytics
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {[
          { val: selectedDept,   set: setSelectedDept,   opts: [['', 'All Departments'], ...departments.map(d => [d, d])] },
          { val: selectedStatus, set: setSelectedStatus, opts: [['pending','Pending'],['resolved','Resolved'],['escalated','Escalated'],['answered','AI Answered']] },
          { val: selectedQueue,  set: setSelectedQueue,  opts: [['all','All Queues'],['awaiting-owner','Awaiting Owner'],['awaiting-collaborators','Awaiting Collaborators']] },
        ].map(({ val, set, opts }, i) => (
          <div key={i} className="relative">
            <select value={val} onChange={e => set(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        ))}

        <div className="flex-1" />

        <button onClick={fetchQueries}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
          {queries.length} result{queries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Analytics panel ──────────────────────────────────────────────── */}
      {showAnalytics && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px -8px rgba(109,40,217,0.12)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50"
            style={{ background: 'linear-gradient(135deg,#f9f7ff,#f0f0ff)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                <BarChart2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Topic Frequency</span>
            </div>
            <button onClick={fetchAnalytics}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 px-2.5 py-1 rounded-lg hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="p-5">
            {analyticsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
            ) : analytics.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-6">No topic tags yet — tag queries to see trends.</p>
            ) : (
              <div className="space-y-3">
                {(() => { const max = analytics[0]?.count || 1; return analytics.map(({ _id: tag, count }) => (
                  <div key={tag} className="flex items-center gap-3">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold w-28 text-center flex-shrink-0 ${TOPIC_COLORS[tag] || TOPIC_COLORS.Other}`}>{tag}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${(count / max) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                    </div>
                    <span className="text-[12px] font-black text-slate-600 w-6 text-right">{count}</span>
                  </div>
                )); })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Query list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-[13px] text-slate-400 font-medium">Loading queries…</p>
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
            <MessageSquare className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="text-[15px] font-bold text-slate-500">No queries found</p>
          <p className="text-[13px] text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map(q => (
            <QueryCard key={q._id} query={q}
              onReply={handleReply} onEscalate={handleEscalate}
              onTransfer={handleTransfer} onAddCollaborator={handleAddCollaborator}
              onTagUpdate={handleTagUpdate} processingId={processingId}
              departments={departments} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
