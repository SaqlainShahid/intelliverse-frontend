import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, X, Building2, GraduationCap, BookOpen, ShieldCheck,
  UserCircle, Briefcase, Award, MessageSquare, Megaphone, Users,
  Loader2, Network, Clock, CheckCircle2, XCircle, ShieldAlert,
  ThumbsUp, Eye, Flame, Plus, BarChart2, Mail, Handshake, Tag, Clock as ClockIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleBadge, canMessageWithoutApproval } from '../../utils/chatPermissions';
import { DEPARTMENT_LIST } from '../../constants/departments';
import {
  searchUsers, createOrGetChat, canMessage,
  autoCreateGroup, getGroupMeta, broadcastMessage,
  submitGroupRequest, getGroupRequests, approveGroupRequest, rejectGroupRequest,
  getDirectoryStats,
} from '../../services/chatService';
import { getForumPosts, upvoteForumPost } from '../../services/forumService';
import SendChatRequestModal from '../p2pChat/SendChatRequestModal';
import AskQuestionModal from '../forum/AskQuestionModal';
import CollaborateTab from './CollaborateTab';
import AnalyticsTab from './AnalyticsTab';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const CHIP_GRADIENTS = {
  violet:  { bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', shadow: '0 4px 14px rgba(124,58,237,0.38)' },
  indigo:  { bg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', shadow: '0 4px 14px rgba(79,70,229,0.38)' },
  emerald: { bg: 'linear-gradient(135deg,#059669,#0d9488)', shadow: '0 4px 14px rgba(5,150,105,0.32)' },
  amber:   { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: '0 4px 14px rgba(217,119,6,0.32)'  },
  rose:    { bg: 'linear-gradient(135deg,#e11d48,#dc2626)', shadow: '0 4px 14px rgba(225,29,72,0.32)'  },
};
function Chip({ active, onClick, children, color = 'violet' }) {
  const g = CHIP_GRADIENTS[color] || CHIP_GRADIENTS.violet;
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
        active ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/40'
      }`}
      style={active ? { background: g.bg, boxShadow: g.shadow } : {}}>
      {children}
    </button>
  );
}

const FORUM_CATEGORIES = ['All', 'Academic', 'Campus Life', 'Finance', 'Career', 'Events', 'Housing', 'Other'];
const FORUM_CAT_COLORS = {
  Academic: 'bg-indigo-100 text-indigo-700', 'Campus Life': 'bg-emerald-100 text-emerald-700',
  Finance: 'bg-amber-100 text-amber-700', Career: 'bg-violet-100 text-violet-700',
  Events: 'bg-sky-100 text-sky-700', Housing: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
};

// ─── Department colour map ───────────────────────────────────────────────────
const DEPT_COLORS = {
  'Computer Science':      { bg: 'bg-blue-50',   ring: 'ring-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'Software Engineering':  { bg: 'bg-violet-50',  ring: 'ring-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  'Electrical Engineering':{ bg: 'bg-yellow-50', ring: 'ring-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Mechanical Engineering':{ bg: 'bg-orange-50', ring: 'ring-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Civil Engineering':     { bg: 'bg-stone-50',  ring: 'ring-stone-200',  text: 'text-stone-700',  dot: 'bg-stone-500' },
  'Business Administration':{ bg: 'bg-emerald-50',ring: 'ring-emerald-200',text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Mathematics':           { bg: 'bg-sky-50',    ring: 'ring-sky-200',    text: 'text-sky-700',    dot: 'bg-sky-500' },
  'Physics':               { bg: 'bg-cyan-50',   ring: 'ring-cyan-200',   text: 'text-cyan-700',   dot: 'bg-cyan-500' },
  'Chemistry':             { bg: 'bg-lime-50',   ring: 'ring-lime-200',   text: 'text-lime-700',   dot: 'bg-lime-500' },
  'Other':                 { bg: 'bg-slate-50',  ring: 'ring-slate-200',  text: 'text-slate-600',  dot: 'bg-slate-400' },
};
const getDeptColor = (dept) => DEPT_COLORS[dept] || DEPT_COLORS['Other'];

// ─── Directory: user card ────────────────────────────────────────────────────
function UserCard({ u, onMessage, onDeptClick, onBookSlot, onExpertiseClick }) {
  const initials = `${u.profile?.firstName?.[0] || ''}${u.profile?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const dc = getDeptColor(u.profile?.department);
  const empType = u.profile?.employeeType;
  const activeHours = u.officeHours?.filter(h => h.isActive) || [];
  const expertise   = u.expertise || [];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all overflow-hidden">
      {/* Main row */}
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
          {u.profile?.avatar
            ? <img src={`http://localhost:5000${u.profile.avatar}`} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-800 leading-tight">{u.profile?.firstName} {u.profile?.lastName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 uppercase tracking-wide">{getRoleBadge(u.role)}</span>
            {empType && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${empType === 'permanent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {empType.charAt(0).toUpperCase() + empType.slice(1)}
              </span>
            )}
          </div>
          {u.profile?.designation && <p className="text-[13px] text-slate-600 font-medium">{u.profile.designation}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {u.profile?.department && (
              <button type="button" onClick={() => onDeptClick(u.profile.department)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg ring-1 transition-all hover:opacity-80 ${dc.bg} ${dc.ring} ${dc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />{u.profile.department}
              </button>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate-400"><Mail className="w-3 h-3" />{u.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => onMessage(u)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </button>
          {activeHours.length > 0 && (
            <button onClick={() => onBookSlot(u)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
              <ClockIcon className="w-3.5 h-3.5" /> Book Slot
            </button>
          )}
        </div>
      </div>

      {/* Expertise + office hours strip */}
      {(expertise.length > 0 || activeHours.length > 0) && (
        <div className="px-4 pb-3 space-y-2 border-t border-slate-50 pt-3">
          {expertise.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {expertise.map(tag => (
                <button key={tag} type="button" onClick={() => onExpertiseClick(tag)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors">
                  <Tag className="w-3 h-3" />{tag}
                </button>
              ))}
            </div>
          )}
          {activeHours.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeHours.slice(0, 3).map((h, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                  <ClockIcon className="w-3 h-3 text-emerald-500" />
                  {h.day} {h.startTime}–{h.endTime}{h.location ? ` · ${h.location}` : ''}
                </span>
              ))}
              {activeHours.length > 3 && <span className="text-[11px] text-slate-400">+{activeHours.length - 3} more</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Forum: question card ────────────────────────────────────────────────────
function ForumCard({ post, onUpvote, onClick }) {
  const [optimistic, setOptimistic] = useState(null);
  const handleUpvote = async (e) => {
    e.stopPropagation();
    const next = !post.isUpvoted;
    setOptimistic({ count: post.upvoteCount + (next ? 1 : -1), isUpvoted: next });
    try { await onUpvote(post._id); } finally { setOptimistic(null); }
  };
  const upvoteCount = optimistic?.count ?? post.upvoteCount ?? 0;
  const isUpvoted   = optimistic?.isUpvoted ?? post.isUpvoted ?? false;
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group">
      {/* Stats */}
      <div className="flex flex-col items-center gap-2 min-w-[44px]">
        <button onClick={handleUpvote}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all ${isUpvoted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'}`}>
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">{upvoteCount}</span>
        </button>
        <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border ${post.hasAcceptedAnswer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-400'}`}>
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">{post.answerCount ?? 0}</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${FORUM_CAT_COLORS[post.category] || FORUM_CAT_COLORS.Other}`}>{post.category}</span>
          {post.hasAcceptedAnswer && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Answered</span>}
          {post.forwardedToFaculty && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Faculty</span>}
        </div>
        <h3 className="text-[14px] font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">{post.title}</h3>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          <span className="font-medium text-slate-500">{post.author?.profile?.firstName} {post.author?.profile?.lastName}</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'directory',   label: 'Directory',   Icon: Users },
  { id: 'forum',       label: 'Forum',       Icon: MessageSquare },
  { id: 'collaborate', label: 'Collaborate', Icon: Handshake },
  { id: 'groups',      label: 'Groups',      Icon: BarChart2,   restricted: 'canManageGroups' },
  { id: 'broadcast',   label: 'Broadcast',   Icon: Megaphone,   restricted: 'canBroadcast' },
  { id: 'approvals',   label: 'Approvals',   Icon: ShieldAlert, restricted: 'canApproveGroups' },
  { id: 'analytics',   label: 'Analytics',   Icon: BarChart2,   restricted: 'canApproveGroups' },
];

export default function CrossDeptPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'directory');

  // Role flags
  const isAdmin  = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isHod    = user?.role === 'hod';
  const canManageGroups  = isAdmin || isFaculty;
  const canBroadcast     = isAdmin || isFaculty;
  const canApproveGroups = isAdmin || isHod;

  // ── Directory state ──────────────────────────────────────────────────────
  const [query, setQuery]                 = useState('');
  const [results, setResults]             = useState([]);
  const [searching, setSearching]         = useState(false);
  const [filterRole, setFilterRole]           = useState('all');
  const [filterScope, setFilterScope]         = useState('all');
  const [filterCrossDepts, setFilterCrossDepts] = useState([]);
  const [filterDesig, setFilterDesig]         = useState('all');
  const [filterEmpType, setFilterEmpType]     = useState('all');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedUser, setSelectedUser]       = useState(null);

  const [filterExpertise, setFilterExpertise] = useState('');
  const hasActiveFilter = filterRole !== 'all' || filterScope !== 'all' || filterCrossDepts.length > 0 || filterDesig !== 'all' || filterEmpType !== 'all' || filterExpertise !== '';

  // ── Directory stats (browse mode) ────────────────────────────────────────
  const [dirStats, setDirStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'directory' || dirStats) return;
    setStatsLoading(true);
    getDirectoryStats()
      .then(res => { if (res?.success) setDirStats(res.data); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'directory') return;
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q && !hasActiveFilter) { setResults([]); return; }
      setSearching(true);
      try {
        const res = await searchUsers(q, 20, {
          role: filterRole,
          scope: filterScope,
          departments: filterScope === 'cross' && filterCrossDepts.length > 0 ? filterCrossDepts : undefined,
          designation: filterDesig,
          employeeType: filterEmpType,
          expertise: filterExpertise || undefined,
        });
        if (res?.success) setResults(res.data);
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, filterRole, filterScope, filterCrossDepts, filterDesig, filterEmpType, filterExpertise, activeTab]);

  const handleBookSlot = async (targetUser) => {
    try {
      const activeHours = targetUser.officeHours?.filter(h => h.isActive) || [];
      const slotList = activeHours.map(h => `• ${h.day} ${h.startTime}–${h.endTime}${h.location ? ` (${h.location})` : ''}`).join('\n');
      const preMsg = `Hi ${targetUser.profile?.firstName}, I'd like to book one of your office hours slots:\n\n${slotList}\n\nPlease let me know which slot works best.`;
      const needsApproval = !canMessageWithoutApproval(user?.role, targetUser.role);
      if (needsApproval) {
        const permCheck = await canMessage(targetUser._id);
        if (!permCheck?.data?.canMessage) { setSelectedUser(targetUser); setRequestModalOpen(true); return; }
      }
      const res = await createOrGetChat(targetUser._id);
      if (res?.success && res.data?._id) {
        // Navigate to chat — pre-filled message is for context; actual sending is manual
        navigate(`/chat/${res.data._id}`, { state: { prefilledMsg: preMsg } });
      }
    } catch { toast.error('Failed to open chat'); }
  };

  const handleMessage = async (targetUser) => {
    try {
      const needsApproval = !canMessageWithoutApproval(user?.role, targetUser.role);
      if (needsApproval) {
        const permCheck = await canMessage(targetUser._id);
        if (!permCheck?.data?.canMessage) { setSelectedUser(targetUser); setRequestModalOpen(true); return; }
      }
      const res = await createOrGetChat(targetUser._id);
      if (res?.success && res.data?._id) navigate(`/chat/${res.data._id}`);
    } catch { toast.error('Failed to start chat'); }
  };

  // ── Forum state ──────────────────────────────────────────────────────────
  const [forumPosts, setForumPosts]     = useState([]);
  const [forumLoading, setForumLoading] = useState(false);
  const [forumLoaded, setForumLoaded]   = useState(false);
  const [forumCategory, setForumCategory] = useState('All');
  const [forumSort, setForumSort]       = useState('newest');
  const [forumSearch, setForumSearch]   = useState('');
  const [forumSearchInput, setForumSearchInput] = useState('');
  const [forumTotal, setForumTotal]     = useState(0);
  const [showAskModal, setShowAskModal] = useState(false);

  const loadForum = useCallback(async () => {
    setForumLoading(true);
    try {
      const params = { sort: forumSort, page: 1, limit: 20 };
      if (forumCategory !== 'All') params.category = forumCategory;
      if (forumSearch) params.search = forumSearch;
      const res = await getForumPosts(params);
      if (res?.success) { setForumPosts(res.data); setForumTotal(res.total); setForumLoaded(true); }
    } catch { /* interceptor handles toast */ }
    finally { setForumLoading(false); }
  }, [forumCategory, forumSort, forumSearch]);

  useEffect(() => {
    if (activeTab === 'forum') loadForum();
  }, [activeTab, forumCategory, forumSort, forumSearch]);

  // Debounce forum search input
  useEffect(() => {
    const t = setTimeout(() => setForumSearch(forumSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [forumSearchInput]);

  const handleForumUpvote = async (postId) => {
    const res = await upvoteForumPost(postId);
    if (res?.success) setForumPosts(prev => prev.map(p =>
      p._id === postId ? { ...p, upvoteCount: res.data.upvoteCount, isUpvoted: res.data.isUpvoted } : p
    ));
  };

  // ── Groups state ─────────────────────────────────────────────────────────
  const [meta, setMeta]                   = useState({ departments: [], batches: [] });
  const [metaLoaded, setMetaLoaded]       = useState(false);
  const [groupType, setGroupType]         = useState('department');
  const [groupKey, setGroupKey]           = useState('');
  const [groupName, setGroupName]         = useState('');
  const [groupDesc, setGroupDesc]         = useState('');
  const [memberEmailsText, setMemberEmailsText] = useState('');
  const [creating, setCreating]           = useState(false);

  const ensureMeta = async () => {
    if (metaLoaded) return;
    try {
      const res = await getGroupMeta();
      if (res?.success) setMeta(res.data || { departments: [], batches: [] });
      setMetaLoaded(true);
    } catch {}
  };

  useEffect(() => { if (activeTab === 'groups') ensureMeta(); }, [activeTab]);

  const resetGroupForm = () => { setGroupKey(''); setGroupName(''); setGroupDesc(''); setMemberEmailsText(''); };

  const handleCreateGroup = async () => {
    const key = groupKey.trim();
    if (groupType === 'department' && !key) return toast.error('Select a department');
    if (groupType === 'batch' && (!key || isNaN(Number(key)))) return toast.error('Select a semester');
    if (groupType === 'course') {
      const emails = memberEmailsText.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
      if (emails.length < 2) return toast.error('Add at least 2 member emails');
    }
    const payload = { type: groupType, key: key || undefined, name: groupName.trim() || undefined, description: groupDesc.trim() || undefined };
    if (groupType === 'course') payload.memberEmails = memberEmailsText.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
    setCreating(true);
    try {
      const res = await autoCreateGroup(payload);
      if (res?.success) { toast.success(res.created ? 'Group created' : 'Group updated'); resetGroupForm(); }
      else toast.error(res?.message || 'Unable to create group');
    } catch { toast.error('Failed to create group'); }
    finally { setCreating(false); }
  };

  const handleSubmitRequest = async () => {
    const key = groupKey.trim();
    if (groupType === 'department' && !key) return toast.error('Select a department');
    if (groupType === 'batch' && (!key || isNaN(Number(key)))) return toast.error('Select a semester');
    if (groupType === 'course') {
      const emails = memberEmailsText.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
      if (emails.length < 2) return toast.error('Add at least 2 member emails');
    }
    const emails = groupType === 'course' ? memberEmailsText.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean) : [];
    setCreating(true);
    try {
      const res = await submitGroupRequest({ type: groupType, key: key || undefined, name: groupName.trim() || undefined, description: groupDesc.trim() || undefined, memberEmails: emails });
      if (res?.success) { toast.success('Request submitted — your HOD has been notified'); resetGroupForm(); }
      else toast.error(res?.message || 'Failed to submit request');
    } catch { toast.error('Failed to submit request'); }
    finally { setCreating(false); }
  };

  // ── Broadcast state ──────────────────────────────────────────────────────
  const [broadcastMsg, setBroadcastMsg]                 = useState('');
  const [broadcastGroupName, setBroadcastGroupName]     = useState('');
  const [broadcastMode, setBroadcastMode]               = useState('all'); // 'all' | 'my_dept' | 'select'
  const [broadcastSelectedDepts, setBroadcastSelectedDepts] = useState([]);
  const [broadcasting, setBroadcasting]                 = useState(false);

  const toggleBroadcastDept = (dept) =>
    setBroadcastSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return toast.error('Enter a message first');
    if (broadcastMode === 'select' && broadcastSelectedDepts.length === 0)
      return toast.error('Select at least one department');

    const filters =
      broadcastMode === 'my_dept'  ? { scope: 'same' } :
      broadcastMode === 'select'   ? { departments: broadcastSelectedDepts } :
      {};

    setBroadcasting(true);
    try {
      const res = await broadcastMessage(broadcastMsg.trim(), filters, broadcastGroupName.trim());
      if (res?.success) {
        toast.success(`Broadcast sent to ${res.data.recipientCount} user${res.data.recipientCount !== 1 ? 's' : ''}`);
        setBroadcastMsg(''); setBroadcastGroupName('');
        setBroadcastMode('all'); setBroadcastSelectedDepts([]);
        if (res.data?.chatId) navigate(`/chat/${res.data.chatId}`);
      } else toast.error(res?.message || 'Broadcast failed');
    } catch (e) { toast.error(e?.message || 'Broadcast failed'); }
    finally { setBroadcasting(false); }
  };

  const broadcastLabel =
    broadcastMode === 'my_dept' ? `My Department (${user?.profile?.department || 'unknown'})` :
    broadcastMode === 'select'  ? broadcastSelectedDepts.length === 0 ? 'Select departments below' :
      broadcastSelectedDepts.length === 1 ? broadcastSelectedDepts[0] :
      `${broadcastSelectedDepts.length} departments` :
    'Entire University';

  // ── Approvals state ──────────────────────────────────────────────────────
  const [groupRequests, setGroupRequests]   = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [rejectReason, setRejectReason]     = useState('');
  const [rejectingId, setRejectingId]       = useState(null);

  const loadGroupRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await getGroupRequests('pending');
      if (res?.success) { setGroupRequests(res.data); setRequestsLoaded(true); }
    } catch { toast.error('Failed to load group requests'); }
    finally { setRequestsLoading(false); }
  };

  useEffect(() => { if (activeTab === 'approvals') loadGroupRequests(); }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      const res = await approveGroupRequest(id);
      if (res?.success) {
        toast.success('Group created and approved');
        setGroupRequests(prev => prev.filter(r => r._id !== id));
        if (res.data?.chatId) navigate(`/chat/${res.data.chatId}`);
      }
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    try {
      await rejectGroupRequest(id, rejectReason);
      toast.success('Request rejected');
      setGroupRequests(prev => prev.filter(r => r._id !== id));
      setRejectingId(null); setRejectReason('');
    } catch { toast.error('Failed to reject'); }
  };

  // Visible tabs for this user
  const visibleTabs = TABS.filter(t => {
    if (!t.restricted) return true;
    if (t.restricted === 'canManageGroups')  return canManageGroups;
    if (t.restricted === 'canBroadcast')     return canBroadcast;
    if (t.restricted === 'canApproveGroups') return canApproveGroups;
    return false;
  });

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 45%, #9333ea 100%)',
          boxShadow: '0 20px 60px -10px rgba(109,40,217,0.55), 0 4px 20px -4px rgba(79,70,229,0.3)',
          minHeight: '220px',
        }}>
        {/* Grid mesh */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Bottom glow */}
        <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#818cf8 0%,transparent 70%)' }} />

        {/* ── Two-column layout ── */}
        <div className="relative flex items-stretch">

          {/* Left: content */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 mb-3">
                IntelliVerse
              </span>
              <h1 className="text-[28px] font-black text-white tracking-tight leading-tight">
                Cross-Departmental<br />Hub
              </h1>
              <p className="text-indigo-200 text-[13px] mt-2 font-medium">Connect · Collaborate · Discover</p>
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2.5 mt-6">
              {[
                { label: 'Members',  val: dirStats?.totals?.total   ?? '—', icon: Users },
                { label: 'Faculty',  val: dirStats?.totals?.faculty  ?? '—', icon: BookOpen },
                { label: 'Students', val: dirStats?.totals?.students ?? '—', icon: GraduationCap },
              ].map(({ label, val, icon: Ic }) => (
                <div key={label} className="flex items-center gap-2 rounded-2xl px-3.5 py-2 border border-white/20"
                  style={{ background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Ic className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-[15px] leading-none">{typeof val === 'number' ? val.toLocaleString() : val}</p>
                    <p className="text-indigo-200 text-[10px] font-semibold">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: network graph decoration */}
          <div className="hidden md:block relative w-64 flex-shrink-0 overflow-hidden">
            {/* Radial glow behind graph */}
            <div className="absolute inset-0 opacity-40"
              style={{ background: 'radial-gradient(circle at 55% 50%, #a855f7 0%, transparent 65%)' }} />

            <svg viewBox="0 0 240 220" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Connection lines from hub */}
              {[
                [120,110, 195,38], [120,110, 218,108], [120,110, 188,178],
                [120,110, 62,178], [120,110, 32,95],   [120,110, 88,28],
              ].map(([x1,y1,x2,y2],i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 3" />
              ))}
              {/* Cross-links between nodes */}
              {[
                [195,38, 218,108],[218,108, 188,178],[62,178, 32,95],[32,95, 88,28]
              ].map(([x1,y1,x2,y2],i) => (
                <line key={`c${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
              {/* Pulse ring on hub */}
              <circle cx="120" cy="110" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <circle cx="120" cy="110" r="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            </svg>

            {/* Center hub icon */}
            <div className="absolute" style={{ left: '120px', top: '110px', transform: 'translate(-50%,-50%)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,0.35)' }}>
                <Network className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Department node pills */}
            {[
              { label: 'CS',        x: 195, y: 38  },
              { label: 'SE',        x: 218, y: 108 },
              { label: 'Physics',   x: 188, y: 178 },
              { label: 'Business',  x: 62,  y: 178 },
              { label: 'Civil',     x: 32,  y: 95  },
              { label: 'Maths',     x: 88,  y: 28  },
            ].map(({ label, x, y }) => (
              <div key={label} className="absolute"
                style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%,-50%)' }}>
                <div className="px-2 py-0.5 rounded-full text-[10px] font-black text-white whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm">
        {visibleTabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                active ? 'text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/60'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 4px 14px rgba(109,40,217,0.4)',
              } : {}}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {id === 'approvals' && groupRequests.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${active ? 'bg-white text-violet-700' : 'bg-rose-500 text-white'}`}>
                  {groupRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: DIRECTORY                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <section className="space-y-4">

          {/* ── Search bar ─────────────────────────────────────────────── */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', padding: '1.5px', borderRadius: '16px' }}>
              <div className="w-full h-full bg-white rounded-2xl" />
            </div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, email or designation…"
              className="relative w-full pl-11 pr-10 py-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none shadow-sm group-focus-within:shadow-indigo-100 group-focus-within:shadow-lg transition-all z-10" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-400 text-slate-400 transition-colors z-10">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Filters ────────────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-slate-200/70" style={{ boxShadow: '0 4px 24px -8px rgba(99,102,241,0.1), 0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80"
              style={{ background: 'linear-gradient(135deg, #f9f7ff 0%, #f5f3ff 100%)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6d28d9,#4f46e5)' }}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
                  </svg>
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">Refine Results</span>
              </div>
              {hasActiveFilter && (
                <button type="button" onClick={() => { setFilterRole('all'); setFilterScope('all'); setFilterCrossDepts([]); setFilterDesig('all'); setFilterEmpType('all'); setFilterExpertise(''); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 bg-white transition-all">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
          <div className="bg-white divide-y divide-slate-50">
            {/* Role */}
            <div className="flex items-center gap-4 px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[{ v: 'all', label: 'All', Icon: UserCircle }, { v: 'student', label: 'Student', Icon: GraduationCap }, { v: 'faculty', label: 'Faculty', Icon: BookOpen }, { v: 'hod', label: 'HOD', Icon: ShieldCheck }]
                  .map(({ v, label, Icon }) => (
                    <Chip key={v} active={filterRole === v} onClick={() => setFilterRole(v)} color="violet"><Icon className="w-3.5 h-3.5" />{label}</Chip>
                  ))}
              </div>
            </div>

            {/* Scope */}
            <div className="flex items-center gap-4 px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scope</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[{ v: 'all', label: 'All Depts' }, { v: 'same', label: 'My Dept' }, { v: 'cross', label: 'Cross Dept' }]
                  .map(({ v, label }) => (
                    <Chip key={v} active={filterScope === v} onClick={() => { setFilterScope(v); setFilterCrossDepts([]); }} color="indigo">
                      <Building2 className="w-3.5 h-3.5" />{label}
                    </Chip>
                  ))}
              </div>
            </div>

            {/* Cross-dept: multi-department picker */}
            {filterScope === 'cross' && (
              <div className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex items-center gap-1.5 w-16 flex-shrink-0 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">
                    Depts
                    {filterCrossDepts.length > 0 && <span className="block normal-case font-bold text-indigo-500">{filterCrossDepts.length} ✓</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENT_LIST.filter(d => d !== 'Other').map(d => (
                    <button key={d} type="button"
                      onClick={() => setFilterCrossDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                        filterCrossDepts.includes(d)
                          ? 'text-white border-transparent'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                      style={filterCrossDepts.includes(d) ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 3px 10px rgba(79,70,229,0.35)' } : {}}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="flex items-center gap-4 px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {[{ v: 'all', label: 'Any', Icon: UserCircle }, { v: 'dr', label: 'Dr.', Icon: Award }, { v: 'professor', label: 'Professor', Icon: BookOpen }]
                  .map(({ v, label, Icon }) => (
                    <Chip key={v} active={filterDesig === v} onClick={() => setFilterDesig(v)} color="emerald"><Icon className="w-3.5 h-3.5" />{label}</Chip>
                  ))}
                <div className="w-px h-5 bg-slate-200 mx-0.5" />
                {[{ v: 'all', label: 'Any', Icon: UserCircle }, { v: 'permanent', label: 'Permanent', Icon: Briefcase }, { v: 'visiting', label: 'Visiting', Icon: GraduationCap }]
                  .map(({ v, label, Icon }) => (
                    <Chip key={`emp-${v}`} active={filterEmpType === v} onClick={() => setFilterEmpType(v)} color="amber"><Icon className="w-3.5 h-3.5" />{label}</Chip>
                  ))}
              </div>
            </div>

            {/* Expertise search */}
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skills</span>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={filterExpertise} onChange={e => setFilterExpertise(e.target.value)}
                  placeholder="e.g. Machine Learning, Finance…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-[12px] border border-slate-200 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-all" />
                {filterExpertise && (
                  <button onClick={() => setFilterExpertise('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-500 text-slate-400 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
          </div>

          {/* ── Browse state (no search / filter) ──────────────────────── */}
          {!query.trim() && !hasActiveFilter && (
            <div className="space-y-4">
              {/* Stat strip */}
              {dirStats && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Members', value: dirStats.totals.total,   icon: Users,          grad: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-200' },
                    { label: 'Faculty & Staff', value: dirStats.totals.faculty, icon: BookOpen,      grad: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200' },
                    { label: 'Students',        value: dirStats.totals.students, icon: GraduationCap, grad: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
                  ].map(({ label, value, icon: Ic, grad, shadow }) => (
                    <div key={label} className={`rounded-2xl p-4 bg-gradient-to-br ${grad} text-white shadow-lg ${shadow}`}>
                      <Ic className="w-5 h-5 opacity-80 mb-2" />
                      <p className="text-2xl font-black">{value.toLocaleString()}</p>
                      <p className="text-[11px] font-semibold mt-0.5 opacity-80">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Department cards */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Browse by Department</p>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                </div>
                {statsLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>}
                {!statsLoading && dirStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dirStats.departments.map(dept => {
                      const dc = getDeptColor(dept.name);
                      return (
                        <button key={dept.name} type="button"
                          onClick={() => { setFilterScope('cross'); setFilterCrossDepts([dept.name]); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border ring-1 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] ${dc.bg} ${dc.ring}`}>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dc.dot} bg-opacity-15 border border-current border-opacity-10`}>
                            <Building2 className={`w-5 h-5 ${dc.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${dc.text}`}>{dept.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {dept.faculty > 0 && `${dept.faculty} Faculty`}
                              {dept.faculty > 0 && dept.students > 0 && ' · '}
                              {dept.students > 0 && `${dept.students} Students`}
                            </p>
                          </div>
                          <span className={`text-[13px] font-black px-2.5 py-1 rounded-xl ${dc.text} bg-white/60 border ${dc.ring}`}>
                            {dept.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Search / filter results ─────────────────────────────────── */}
          {(query.trim() || hasActiveFilter) && (
            <div className="space-y-2">
              {searching && (
                <div className="flex items-center gap-2 text-sm text-indigo-500 animate-pulse px-1">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                </div>
              )}
              {!searching && results.length > 0 && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                  {results.map(u => (
                    <UserCard key={u._id} u={u}
                      onMessage={handleMessage}
                      onBookSlot={handleBookSlot}
                      onDeptClick={(dept) => { setFilterScope('cross'); setFilterCrossDepts([dept]); setQuery(''); }}
                      onExpertiseClick={(tag) => { setFilterExpertise(tag); setQuery(''); }} />
                  ))}
                </>
              )}
              {!searching && results.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No users match your search
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: FORUM                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'forum' && (
        <section className="space-y-4">
          {/* Forum toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={forumSearchInput} onChange={e => setForumSearchInput(e.target.value)} placeholder="Search questions…"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
            </div>
            {user?.role === 'student' && (
              <button onClick={() => setShowAskModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0">
                <Plus className="w-4 h-4" /> Ask Question
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap">
            {FORUM_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setForumCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  forumCategory === cat
                    ? cat === 'All' ? 'bg-slate-800 border-slate-800 text-white' : `${FORUM_CAT_COLORS[cat]} border-current`
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>{cat}</button>
            ))}
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 border border-slate-100">
            {[{ v: 'newest', label: 'Newest', Icon: Clock }, { v: 'active', label: 'Active', Icon: Flame }, { v: 'upvotes', label: 'Top', Icon: ThumbsUp }, { v: 'unanswered', label: 'Unanswered', Icon: MessageSquare }]
              .map(({ v, label, Icon }) => (
                <button key={v} onClick={() => setForumSort(v)}
                  className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${forumSort === v ? 'bg-white shadow-sm text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
          </div>

          {forumTotal > 0 && <p className="text-xs text-slate-400">{forumTotal} question{forumTotal !== 1 ? 's' : ''}</p>}

          {/* Post list */}
          {forumLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}
          {!forumLoading && forumPosts.length > 0 && (
            <div className="space-y-3">
              {forumPosts.map(post => (
                <ForumCard key={post._id} post={post} onUpvote={handleForumUpvote} onClick={() => navigate(`/forum/${post._id}`, { state: { from: 'cross-dept' } })} />
              ))}
              {forumPosts.length < forumTotal && (
                <button onClick={loadForum} className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                  Load more
                </button>
              )}
            </div>
          )}
          {!forumLoading && forumLoaded && forumPosts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No questions found</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to ask!</p>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: COLLABORATE                                                  */}
      {activeTab === 'collaborate' && <CollaborateTab />}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: GROUPS                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'groups' && canManageGroups && (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">{isAdmin ? 'Auto-create Groups' : 'Request Group Creation'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isAdmin ? 'Create department, batch, or course groups instantly' : 'Submit a request — your HOD will review and approve it'}</p>
          </div>

          <div className="flex gap-2">
            {['department', 'batch', 'course'].map(t => (
              <button key={t} type="button" onClick={() => setGroupType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${groupType === t ? 'bg-violet-600 border-violet-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {groupType === 'department' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium shrink-0 w-24">Department</label>
                <select value={groupKey} onChange={e => setGroupKey(e.target.value)} className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="">Select…</option>
                  {(meta.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            {groupType === 'batch' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium shrink-0 w-24">Semester</label>
                <select value={groupKey} onChange={e => setGroupKey(e.target.value)} className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="">Select…</option>
                  {(meta.batches || []).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            {groupType === 'course' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 font-medium shrink-0 w-24">Course code</label>
                  <input value={groupKey} onChange={e => setGroupKey(e.target.value)} placeholder="Optional" className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Member emails (comma or newline separated)</label>
                  <textarea value={memberEmailsText} onChange={e => setMemberEmailsText(e.target.value)} rows={3} placeholder="student1@univ.edu, student2@univ.edu"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-medium shrink-0 w-24">Name</label>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name…" className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-medium shrink-0 w-24">Description</label>
              <input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Optional" className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetGroupForm} className="px-4 py-1.5 rounded-xl text-xs border border-slate-200 text-slate-500 hover:bg-slate-50">Reset</button>
              {isAdmin ? (
                <button type="button" onClick={handleCreateGroup} disabled={creating}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Creating…' : 'Create Group'}
                </button>
              ) : (
                <button type="button" onClick={handleSubmitRequest} disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {creating ? 'Submitting…' : 'Submit for HOD Approval'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: BROADCAST                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'broadcast' && canBroadcast && (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Broadcast Message</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Send a message to your department, specific departments, or the whole university
            </p>
          </div>

          {/* Recipient mode */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Send to</label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: 'all',      label: 'All Departments' },
                { v: 'my_dept',  label: 'My Department' },
                { v: 'select',   label: 'Cross-Department' },
              ].map(({ v, label }) => (
                <button key={v} type="button"
                  onClick={() => { setBroadcastMode(v); setBroadcastSelectedDepts([]); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    broadcastMode === v
                      ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* My dept info chip */}
          {broadcastMode === 'my_dept' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl">
              <span className="text-xs font-semibold text-rose-700">
                Broadcasting to: <span className="font-bold">{user?.profile?.department || 'your department'}</span>
              </span>
            </div>
          )}

          {/* Multi-department checkbox grid */}
          {broadcastMode === 'select' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Pick departments
                  {broadcastSelectedDepts.length > 0 && (
                    <span className="ml-2 normal-case font-semibold text-rose-600">
                      ({broadcastSelectedDepts.length} selected)
                    </span>
                  )}
                </label>
                {broadcastSelectedDepts.length > 0 && (
                  <button type="button" onClick={() => setBroadcastSelectedDepts([])}
                    className="text-[11px] text-slate-400 hover:text-red-500 font-semibold">
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEPARTMENT_LIST.filter(d => d !== 'Other').concat(['Other']).map(dept => {
                  const checked = broadcastSelectedDepts.includes(dept);
                  return (
                    <button key={dept} type="button" onClick={() => toggleBroadcastDept(dept)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                        checked
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50/40'
                      }`}>
                      <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                        checked ? 'bg-rose-600 border-rose-600' : 'border-slate-300'
                      }`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{dept}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Group name <span className="normal-case font-normal">(optional)</span>
            </label>
            <input value={broadcastGroupName} onChange={e => setBroadcastGroupName(e.target.value)}
              placeholder={
                broadcastMode === 'all'     ? 'e.g. University-wide Announcement' :
                broadcastMode === 'my_dept' ? `e.g. ${user?.profile?.department || 'Department'} Notice` :
                broadcastSelectedDepts.length > 0 ? `e.g. ${broadcastSelectedDepts[0]} & others Notice` :
                'e.g. Department Notice'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all" />
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Message</label>
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={4}
              placeholder="Type your broadcast message…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none transition-all" />
          </div>

          <button type="button" onClick={handleBroadcast}
            disabled={broadcasting || !broadcastMsg.trim() || (broadcastMode === 'select' && broadcastSelectedDepts.length === 0)}
            className="w-full py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Megaphone className="w-4 h-4" />
            {broadcasting ? 'Sending…' : `Broadcast to ${broadcastLabel}`}
          </button>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: APPROVALS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'approvals' && canApproveGroups && (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Group Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">Faculty-submitted group creation requests awaiting your review</p>
            </div>
            <button type="button" onClick={loadGroupRequests} disabled={requestsLoading}
              className="text-xs font-semibold text-violet-600 hover:underline disabled:opacity-50">
              Refresh
            </button>
          </div>

          {requestsLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>}
          {!requestsLoading && requestsLoaded && groupRequests.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">No pending group requests</div>
          )}
          {!requestsLoading && groupRequests.map(req => (
            <div key={req._id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{req.name || `${req.type.charAt(0).toUpperCase() + req.type.slice(1)} Group`}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">{req.type}</span>
                    {req.key && <span className="text-[11px] text-slate-500">· {req.key}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Requested by <span className="font-medium text-slate-600">{req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName}</span>
                    {' '}· {req.requestedBy?.profile?.department} · {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  {req.description && <p className="text-xs text-slate-500 mt-1">{req.description}</p>}
                  {req.memberEmails?.length > 0 && <p className="text-xs text-slate-400 mt-1">{req.memberEmails.length} member emails</p>}
                </div>
                <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </div>
              {rejectingId === req._id ? (
                <div className="space-y-2">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleReject(req._id)} className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600">Confirm Reject</button>
                    <button type="button" onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-1 rounded-xl text-xs border border-slate-200 text-slate-500 hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleApprove(req._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Create
                  </button>
                  <button type="button" onClick={() => setRejectingId(req._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ANALYTICS                                                    */}
      {activeTab === 'analytics' && canApproveGroups && <AnalyticsTab />}
    </div>

    {/* Modals */}
    <SendChatRequestModal
      user={selectedUser} isOpen={requestModalOpen}
      onClose={() => { setRequestModalOpen(false); setSelectedUser(null); }}
      onSuccess={() => { toast.success('Chat request sent!'); setRequestModalOpen(false); setSelectedUser(null); }}
    />
    {showAskModal && user?.role === 'student' && (
      <AskQuestionModal
        onClose={() => setShowAskModal(false)}
        onCreated={() => { setShowAskModal(false); loadForum(); }}
      />
    )}
    </>
  );
}
