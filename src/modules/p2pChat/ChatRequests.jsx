import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPendingRequests, getAllRequests, acceptChatRequest, declineChatRequest, deleteChatRequest } from '../../services/chatService';
import toast from 'react-hot-toast';
import { getRoleColor, getRoleBadge, getMessageRequirement } from '../../utils/chatPermissions';
import {
  Clock, CheckCircle, X, MessageCircle, Trash2, Search, SlidersHorizontal,
  RefreshCw, Send, Inbox, MailCheck, Building2, MapPin, Mail, CalendarDays,
  UserCheck, Loader2, ArrowRight, ChevronDown, ChevronLeft
} from 'lucide-react';
import ChatRequestStatusModal from './ChatRequestStatusModal';
import ConfirmModal from './ConfirmModal';

// ── Custom Role Dropdown ──
const ROLE_OPTIONS = [
  { value: 'all',     label: 'All Roles' },
  { value: 'student', label: 'Students'  },
  { value: 'faculty', label: 'Faculty'   },
  { value: 'hod',     label: 'HOD'       },
  { value: 'admin',   label: 'Admin'     },
];

const RoleDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ROLE_OPTIONS.find(o => o.value === value) || ROLE_OPTIONS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-all whitespace-nowrap ${
          open
            ? 'bg-white border-violet-400 text-violet-700 shadow-md ring-2 ring-violet-400/20'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-white'
        }`}>
        <SlidersHorizontal className="w-4 h-4 text-slate-400" />
        {selected.label}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1.5 space-y-0.5">
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  value === opt.value
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}>
                {opt.label}
                {value === opt.value && <CheckCircle className="w-3.5 h-3.5 text-violet-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: '', message: '', userName: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, requestId: null, userName: '' });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([getPendingRequests(), getAllRequests()]);
      if (pendingRes.success) setPendingRequests(pendingRes.data);
      if (allRes.success) setAllRequests(allRes.data);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, sender) => {
    setAcceptingId(requestId);
    try {
      const res = await acceptChatRequest(requestId);
      if (res.success) {
        await loadRequests();
        setStatusModal({ isOpen: true, status: 'accepted', message: `You are now connected with ${sender.profile?.firstName || sender.firstName}. Start chatting!`, userName: `${sender.profile?.firstName || sender.firstName} ${sender.profile?.lastName || sender.lastName}` });
      }
    } catch (error) {
      setStatusModal({ isOpen: true, status: 'error', message: error.response?.data?.message || 'Failed to accept request.', userName: `${sender.profile?.firstName || sender.firstName} ${sender.profile?.lastName || sender.lastName}` });
    } finally { setAcceptingId(null); }
  };

  const handleDecline = async (requestId, sender) => {
    setDecliningId(requestId);
    try {
      const res = await declineChatRequest(requestId);
      if (res.success) {
        await loadRequests();
        setStatusModal({ isOpen: true, status: 'declined', message: `You have declined the chat request from ${sender.profile?.firstName || sender.firstName}.`, userName: `${sender.profile?.firstName || sender.firstName} ${sender.profile?.lastName || sender.lastName}` });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline request');
    } finally { setDecliningId(null); }
  };

  const handleDelete = async (requestId) => {
    setDeletingId(requestId);
    try {
      const res = await deleteChatRequest(requestId);
      if (res.success) { await loadRequests(); toast.success('Request cancelled'); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    } finally { setDeletingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 font-medium text-sm font-['Inter']">Loading requests…</p>
        </div>
      </div>
    );
  }

  const incomingCount = allRequests?.incoming?.filter(r => r.status === 'pending')?.length || 0;
  const acceptedCount = allRequests?.incoming?.filter(r => r.status === 'accepted')?.length || 0;
  const outgoingCount = allRequests?.outgoing?.filter(r => r.status === 'pending')?.length || 0;

  const filterRequests = (requests) => {
    if (!requests) return [];
    return requests.filter(req => {
      const sender = req.sender || {};
      const receiver = req.receiver || {};
      const name = `${sender.profile?.firstName || sender.firstName || ''} ${sender.profile?.lastName || sender.lastName || ''} ${receiver.profile?.firstName || receiver.firstName || ''} ${receiver.profile?.lastName || receiver.lastName || ''}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase()) && (filterRole === 'all' || sender.role === filterRole || receiver.role === filterRole);
    });
  };

  const TABS = [
    { id: 'pending',  label: 'Incoming',  Icon: Inbox,       count: incomingCount },
    { id: 'accepted', label: 'Accepted',  Icon: MailCheck,   count: acceptedCount },
    { id: 'outgoing', label: 'Sent',      Icon: Send,        count: outgoingCount },
  ];

  const STAT_CARDS = [
    { label: 'Incoming', value: incomingCount, Icon: Inbox,     color: 'text-violet-600', bg: 'from-violet-50 to-indigo-50/60', border: 'border-violet-100' },
    { label: 'Accepted', value: acceptedCount, Icon: UserCheck,  color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50/60',   border: 'border-emerald-100' },
    { label: 'Sent',     value: outgoingCount, Icon: Send,       color: 'text-sky-600',     bg: 'from-sky-50 to-blue-50/60',        border: 'border-sky-100'     },
  ];

  return (
    <div className="min-h-screen relative p-4 sm:p-6 md:p-8 font-['Inter']" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #faf5ff 40%, #f0f9ff 100%)' }}>

      {/* Aura background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header Card ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-7">
            <div className="flex items-center gap-4">
              {/* Back button */}
              <button onClick={() => navigate(-1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:border-violet-300 hover:text-violet-600 text-slate-500 transition-all shadow-sm flex-shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200/60 flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-[Outfit] font-extrabold text-slate-900 tracking-tight leading-tight">Chat Requests</h1>
                <p className="text-[13px] text-slate-500 mt-0.5">Manage your incoming and outgoing message requests</p>
              </div>
            </div>
            <button onClick={loadRequests}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-all shadow-md shadow-violet-200/50 hover:shadow-lg hover:-translate-y-px active:translate-y-0">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {STAT_CARDS.map(({ label, value, Icon, color, bg, border }) => (
              <div key={label} className={`bg-gradient-to-br ${bg} rounded-xl p-4 border ${border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{label}</span>
                </div>
                <div className={`text-3xl font-[Outfit] font-extrabold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search + Filter ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
              />
            </div>
            <div className="relative">
              <RoleDropdown value={filterRole} onChange={setFilterRole} />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {TABS.map(({ id, label, Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200/60'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {activeTab === 'pending' && (
          <PendingList requests={filterRequests(pendingRequests)} onAccept={handleAccept} onDecline={handleDecline} acceptingId={acceptingId} decliningId={decliningId} />
        )}
        {activeTab === 'accepted' && (
          <AcceptedList requests={filterRequests(allRequests?.incoming?.filter(r => r.status === 'accepted') || [])} onOpenChat={(userId) => navigate(`/chat/${userId}`)} />
        )}
        {activeTab === 'outgoing' && (
          <OutgoingList requests={filterRequests(allRequests?.outgoing?.filter(r => r.status === 'pending') || [])}
            onDelete={(id, name) => setConfirmModal({ isOpen: true, requestId: id, userName: name })} deletingId={deletingId} />
        )}
      </div>

      <ChatRequestStatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ isOpen: false, status: '', message: '', userName: '' })}
        status={statusModal.status} message={statusModal.message} userName={statusModal.userName} />

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, requestId: null, userName: '' })}
        onConfirm={() => handleDelete(confirmModal.requestId)}
        title="Cancel Chat Request?" message={`Cancel your request to ${confirmModal.userName}? This cannot be undone.`}
        confirmText="Yes, Cancel" cancelText="Keep" variant="danger" />
    </div>
  );
};

// ── Empty State ──
const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-7 h-7 text-slate-300" />
    </div>
    <h3 className="text-[15px] font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-[13px] text-slate-400">{sub}</p>
  </div>
);

// ── Pending ──
const PendingList = ({ requests, onAccept, onDecline, acceptingId, decliningId }) => {
  if (!requests.length) return <EmptyState icon={Inbox} title="No Incoming Requests" sub="You're all caught up! New requests will appear here." />;
  return (
    <div className="space-y-3">
      {requests.map(req => (
        <RequestCard key={req._id} request={req}>
          <div className="flex gap-2.5 mt-4">
            <button onClick={() => onDecline(req._id, req.sender)} disabled={decliningId === req._id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[13px] font-semibold hover:bg-red-100 transition-all disabled:opacity-50">
              {decliningId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Decline
            </button>
            <button onClick={() => onAccept(req._id, req.sender)} disabled={acceptingId === req._id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold shadow-md shadow-emerald-200/50 transition-all disabled:opacity-50">
              {acceptingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Accept
            </button>
          </div>
        </RequestCard>
      ))}
    </div>
  );
};

// ── Accepted ──
const AcceptedList = ({ requests, onOpenChat }) => {
  if (!requests.length) return <EmptyState icon={UserCheck} title="No Accepted Connections" sub="Accept requests to start chatting with peers." />;
  return (
    <div className="space-y-3">
      {requests.map(req => {
        const sender = req.sender || req;
        const senderId = sender._id || sender.id;
        return (
          <RequestCard key={req._id} request={req} accepted>
            <button onClick={() => onOpenChat(senderId)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold shadow-md shadow-violet-200/50 transition-all">
              <MessageCircle className="w-4 h-4" />
              Open Chat
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </RequestCard>
        );
      })}
    </div>
  );
};

// ── Outgoing ──
const OutgoingList = ({ requests, onDelete, deletingId }) => {
  if (!requests.length) return <EmptyState icon={Send} title="No Sent Requests" sub="Start a conversation to send a chat request." />;
  return (
    <div className="space-y-3">
      {requests.map(req => {
        const name = `${req.receiver?.profile?.firstName || req.receiver?.firstName || ''} ${req.receiver?.profile?.lastName || req.receiver?.lastName || ''}`.trim();
        return (
          <RequestCard key={req._id} request={req} outgoing>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[12px] font-medium">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Waiting for response…
              </div>
              <button onClick={() => onDelete(req._id, name)} disabled={deletingId === req._id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[13px] font-semibold hover:bg-red-100 transition-all disabled:opacity-50">
                {deletingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Cancel Request
              </button>
            </div>
          </RequestCard>
        );
      })}
    </div>
  );
};

// ── Request Card ──
const RequestCard = ({ request, children, accepted, outgoing }) => {
  const sender = request.sender || request;
  const receiver = request.receiver || request;
  const person = outgoing ? receiver : sender;
  const firstName = person.profile?.firstName || person.firstName || '';
  const lastName = person.profile?.lastName || person.lastName || '';
  const avatarUrl = person.profile?.avatar
    ? `http://localhost:5000${person.profile.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=6d28d9&color=fff&size=128`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <img src={avatarUrl} alt={firstName}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=6d28d9&color=fff&size=128`; }} />
          {accepted && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-slate-900 font-['Inter'] truncate">{firstName} {lastName}</h3>
            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-100">
              {getRoleBadge(person.role)}
            </span>
            {accepted && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Connected</span>}
            {outgoing && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>}
          </div>
          <div className="space-y-0.5">
            {person.profile?.designation && (
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{person.profile.designation}</span>
              </p>
            )}
            {person.profile?.department && (
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{person.profile.department}</span>
              </p>
            )}
            {person.email && (
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{person.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex-shrink-0 flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Message preview */}
      {request.message && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Message</p>
          <p className="text-[13px] text-slate-600 italic leading-relaxed">"{request.message}"</p>
        </div>
      )}

      {children}
    </div>
  );
};

export default ChatRequests;
