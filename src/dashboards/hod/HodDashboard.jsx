import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo-intelliverse-transparent.png.png';
import {
  Users, BookOpen, FileText, Clock, Calendar, CheckCircle2,
  ChevronRight, Plus, BarChart3, Bell, ShieldCheck, Zap, X,
  Share2, Upload, Briefcase, LayoutDashboard, UserCheck, GraduationCap,
  Mail, MessageCircle, AlertTriangle, MoreVertical, ShieldOff
} from 'lucide-react';

const HodDashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [loading, setLoading]                               = useState(true);
  const [tab, setTab]                                       = useState('overview');
  const [hodStats, setHodStats]                             = useState(null);
  const [pendingFaculty, setPendingFaculty]                 = useState([]);
  const [approvedFaculty, setApprovedFaculty]               = useState([]);
  const [approvalTab, setApprovalTab]                       = useState('pending');
  const [rejectionReason, setRejectionReason]               = useState('');
  const [selectedFacultyToReject, setSelectedFacultyToReject]   = useState(null);
  const [selectedFacultyToApprove, setSelectedFacultyToApprove] = useState(null);
  const [facultyStats, setFacultyStats]                     = useState(null);
  const [classes, setClasses]                               = useState([]);
  const [students, setStudents]                             = useState([]);
  const [showDeployModal, setShowDeployModal]               = useState(false);
  const [newClassData, setNewClassData]                     = useState({ name: '', section: '' });
  const [deploying, setDeploying]                           = useState(false);
  const [showActionModal, setShowActionModal]               = useState(false);
  const [selectedActionTarget, setSelectedActionTarget]     = useState(null);
  const [actionForm, setActionForm]                         = useState({ type: 'warning', message: '' });
  const [actionLoading, setActionLoading]                   = useState(false);

  useEffect(() => { loadAllData(); }, [approvalTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const hodStatsRes = await api.get('/hod/stats').catch(() => null);
      if (hodStatsRes) setHodStats(hodStatsRes.data.data);

      if (approvalTab === 'pending') {
        const r = await api.get('/hod/pending-faculty').catch(() => ({ data: { data: { pendingFaculty: [] } } }));
        setPendingFaculty(r.data.data.pendingFaculty);
      } else {
        const r = await api.get('/hod/approved-faculty').catch(() => ({ data: { data: { approvedFaculty: [] } } }));
        setApprovedFaculty(r.data.data.approvedFaculty);
      }

      const fs = await api.get('/faculty/stats').catch(() => ({ data: { data: {} } }));
      setFacultyStats(fs.data.data);
      const cl = await api.get('/classroom/my-classes').catch(() => ({ data: { data: [] } }));
      setClasses(cl.data.data || []);
      const st = await api.get('/faculty/students').catch(() => ({ data: { data: [] } }));
      setStudents(st.data.data || []);
    } catch { toast.error('Some data failed to load'); }
    finally { setLoading(false); }
  };

  const approveFaculty = async (id) => {
    try {
      await api.post(`/hod/approve/${id}`, {});
      toast.success('Faculty approved!');
      setSelectedFacultyToApprove(null);
      loadAllData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to approve'); }
  };

  const rejectFaculty = async (id) => {
    if (!rejectionReason.trim()) return toast.error('Rejection reason required');
    try {
      await api.post(`/hod/reject/${id}`, { rejectionReason });
      toast.success('Faculty rejected');
      setSelectedFacultyToReject(null);
      setRejectionReason('');
      loadAllData();
    } catch { toast.error('Failed to reject'); }
  };

  const handleDeployClass = async (e) => {
    e.preventDefault();
    if (!newClassData.name) return toast.error('Class name required');
    setDeploying(true);
    try {
      const res = await api.post('/classroom/create', newClassData);
      if (res.data.success) {
        toast.success('Class created!');
        setClasses([res.data.data, ...classes]);
        setShowDeployModal(false);
        setNewClassData({ name: '', section: '' });
      }
    } catch { toast.error('Failed to create class'); }
    finally { setDeploying(false); }
  };

  const copyCode = (code) => { navigator.clipboard.writeText(code); toast.success('Code copied!', { icon: '📋' }); };

  const handlePerformAction = async () => {
    if (!actionForm.message.trim()) return toast.error('Please enter a message');
    setActionLoading(true);
    try {
      await api.post('/hod/perform-action', {
        targetId: selectedActionTarget._id, actionType: actionForm.type, message: actionForm.message
      });
      toast.success('Action dispatched');
      setShowActionModal(false);
      setActionForm({ type: 'warning', message: '' });
    } catch { toast.error('Failed to perform action'); }
    finally { setActionLoading(false); }
  };

  if (loading && !hodStats) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-800 border-t-white rounded-full animate-spin" />
        <Zap className="absolute inset-0 m-auto text-white animate-pulse" size={28} />
      </div>
    </div>
  );

  const displayName = user?.profile?.displayName || user?.profile?.firstName;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 pb-24 selection:bg-slate-900 selection:text-white">

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[55%] h-[55%] bg-indigo-100/50 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 w-[45%] h-[45%] bg-emerald-50/60 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-10 space-y-10">

        {/* ── Header ── */}
        <header className="relative bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.09)] overflow-hidden">
          {/* Bold top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-900 via-slate-600 to-slate-400" />
          {/* Dot overlay top-right */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle,rgba(0,0,0,0.045) 1px,transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse 55% 70% at 100% 0%,black 0%,transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 70% at 100% 0%,black 0%,transparent 70%)',
          }} />

          <div className="px-8 py-8 lg:px-12 lg:py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-slate-900/6 rounded-3xl blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-xl p-3">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="px-3.5 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                    Department Head
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative" />
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-400">{displayName}</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-[0.18em]">
                  <GraduationCap size={13} className="text-slate-400" />
                  {user?.profile?.department} · Academic Lead
                </p>
              </div>
            </div>

            {/* Session pill */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-900 rounded-2xl shadow-xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Session Active</p>
                <p className="text-base font-black text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Navigation ── */}
        <nav className="flex flex-wrap items-center gap-2 p-2 bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] w-fit shadow-lg">
          {[
            { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
            { id: 'approvals',  label: 'Faculty',    icon: UserCheck, count: pendingFaculty.length },
            { id: 'classrooms', label: 'My Classes', icon: BookOpen },
            { id: 'students',   label: 'Students',   icon: Users },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                tab === t.id
                  ? 'bg-slate-900 text-white shadow-xl'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-white/60'
              }`}>
              <t.icon size={15} />
              {t.label}
              {t.count > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${tab === t.id ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="space-y-10">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-10">

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Total Faculty',    val: hodStats?.stats?.total    || 0, icon: Users,         trend: 'Verified',     trendColor: 'text-emerald-400', dark: false },
                  { label: 'Pending Requests', val: hodStats?.stats?.pending  || 0, icon: Clock,         trend: 'Action Needed',trendColor: 'text-amber-400',   dark: true  },
                  { label: 'Active Classes',   val: classes.length            || 0, icon: BookOpen,      trend: 'Running',      trendColor: 'text-sky-400',     dark: false },
                  { label: 'Total Students',   val: students.length           || 0, icon: GraduationCap, trend: 'Registered',   trendColor: 'text-emerald-400', dark: false },
                  { label: 'Assignments',      val: facultyStats?.assignments || 0, icon: FileText,      trend: 'In Progress',  trendColor: 'text-violet-400',  dark: false },
                  { label: 'Pending Reviews',  val: facultyStats?.pendingReviews||0,icon: Clock,         trend: 'Grade Needed', trendColor: 'text-rose-400',    dark: false },
                ].map((s, i) => (
                  <div key={i}
                    className={`relative rounded-[2.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-default ${
                      s.dark
                        ? 'bg-slate-900 border-slate-700/60 shadow-2xl'
                        : 'bg-white/80 backdrop-blur-xl border-white/90 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]'
                    }`}>
                    {/* Top accent bar */}
                    <div className="h-[3px]" style={{
                      background: s.dark
                        ? 'linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))'
                        : 'linear-gradient(90deg,#0f172a,#475569,rgba(71,85,105,0.2))'
                    }} />
                    {/* Dot overlay */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      backgroundImage: `radial-gradient(circle,${s.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} 1.2px,transparent 1.2px)`,
                      backgroundSize: '18px 18px',
                      maskImage: 'radial-gradient(ellipse 85% 75% at 100% 100%,black 0%,transparent 65%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 100% 100%,black 0%,transparent 65%)',
                    }} />
                    <div className="p-7 relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-13 h-13 p-3 rounded-2xl flex items-center justify-center shadow-lg ${
                          s.dark ? 'bg-white/15 backdrop-blur-sm' : 'bg-slate-900'
                        }`} style={{ width: '3.25rem', height: '3.25rem' }}>
                          <s.icon size={22} className="text-white" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          s.dark
                            ? `${s.trendColor} bg-white/10`
                            : `${s.trendColor} bg-slate-50 border border-slate-100`
                        }`}>
                          {s.trend}
                        </span>
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.22em] mb-2 ${s.dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {s.label}
                      </p>
                      <p className={`text-5xl font-black tracking-tighter leading-none ${s.dark ? 'text-white' : 'text-slate-900'}`}>
                        {s.val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                  {/* Executive Tools */}
                  <div className="relative bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]">
                    <div className="h-[3px] bg-gradient-to-r from-slate-900 via-slate-600 to-slate-300" />
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                          <BarChart3 size={22} className="text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 tracking-tight">Executive Tools</h2>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Quick actions for department management</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Uploads',     icon: Upload,   iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-700',  action: () => navigate('/chat') },
                          { label: 'Assignments', icon: FileText, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', action: () => setTab('classrooms') },
                          { label: 'Alerts',      icon: Bell,     iconBg: 'bg-amber-100',   iconColor: 'text-amber-700',   action: () => toast('No pending alerts', { icon: '🔔' }) },
                          { label: 'Registry',    icon: Users,    iconBg: 'bg-slate-100',   iconColor: 'text-slate-700',   action: () => setTab('approvals') },
                        ].map((tool, i) => (
                          <button key={i} onClick={tool.action}
                            className="group flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-2xl hover:-translate-y-2 hover:border-slate-200 transition-all duration-400">
                            <div className={`w-14 h-14 rounded-2xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                              <tool.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">{tool.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Create Class Banner */}
                  <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    {/* Dot overlay */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)',
                      backgroundSize: '20px 20px',
                    }} />
                    <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                          <Zap size={26} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white tracking-tight">Create Classroom</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Launch a new classroom for your students</p>
                        </div>
                      </div>
                      <button onClick={() => setShowDeployModal(true)}
                        className="flex items-center gap-2.5 px-8 h-12 bg-white text-slate-900 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300 flex-shrink-0">
                        <Plus size={16} /> New Class
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Sidebar */}
                <div className="space-y-6">
                  <div className="relative bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]">
                    <div className="h-[3px] bg-gradient-to-r from-slate-900 via-slate-600 to-slate-300" />
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                            <ShieldCheck size={16} className="text-white" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">System Status</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between items-center mb-2.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uptime</p>
                            <p className="text-sm font-black text-slate-900">99.9%</p>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-600" style={{ width: '99.9%' }} />
                          </div>
                        </div>
                        {[
                          { label: 'Active Classes', val: classes.length },
                          { label: 'Pending Reviews', val: facultyStats?.pendingReviews || 0 },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-t border-gray-100">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label}</span>
                            <span className="text-base font-black text-slate-900">{m.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 pointer-events-none" style={{
                      backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)',
                      backgroundSize: '18px 18px',
                    }} />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[3rem]" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5 border border-white/10">
                        <Bell size={22} className="text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight mb-1">All Clear</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No urgent department alerts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FACULTY APPROVALS */}
          {tab === 'approvals' && (
            <div className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-8 py-7 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserCheck size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Faculty List</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Manage all department faculty members</p>
                  </div>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  {['pending', 'approved'].map(t => (
                    <button key={t} onClick={() => setApprovalTab(t)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        approvalTab === t ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-700'
                      }`}>
                      {t === 'pending' ? `Pending (${pendingFaculty.length})` : 'Verified'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8">
                {approvalTab === 'pending' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingFaculty.length > 0 ? pendingFaculty.map((f) => (
                      <div key={f._id}
                        className="group bg-white border border-gray-100 rounded-[2rem] p-7 hover:border-slate-300 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg">
                              {f.profile.firstName[0]}
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900 tracking-tight">{f.profile.firstName} {f.profile.lastName}</h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{f.profile.designation || 'Faculty'}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100">
                            Pending
                          </span>
                        </div>
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-600 border border-gray-100">
                            <Mail size={13} className="text-slate-400" />{f.email}
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-600 border border-gray-100">
                            <Calendar size={13} className="text-slate-400" />Joined {new Date(f.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-3 pt-5 border-t border-gray-100">
                          <button onClick={() => setSelectedFacultyToApprove(f)}
                            className="flex-1 h-11 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.03] active:scale-95 transition-all">
                            Approve
                          </button>
                          <button onClick={() => setSelectedFacultyToReject(f)}
                            className="flex-1 h-11 rounded-2xl bg-white border border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                            Reject
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 size={36} className="text-gray-300" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Queue Clear</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="pb-5 px-3">Faculty</th>
                          <th className="pb-5 px-3">Role</th>
                          <th className="pb-5 px-3">Verified On</th>
                          <th className="pb-5 px-3">Status</th>
                          <th className="pb-5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {approvedFaculty.map((f) => (
                          <tr key={f._id} className="hover:bg-gray-50/60 transition-colors group">
                            <td className="px-3 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-md">
                                  {f.profile.firstName[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">{f.profile.firstName} {f.profile.lastName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{f.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-5 text-xs font-bold text-slate-500 uppercase tracking-wide">{f.profile.designation}</td>
                            <td className="px-3 py-5 text-xs text-slate-400">{new Date(f.approvedAt || f.updatedAt).toLocaleDateString()}</td>
                            <td className="px-3 py-5">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                Verified
                              </span>
                            </td>
                            <td className="px-3 py-5 text-right">
                              <button onClick={() => { setSelectedActionTarget(f); setShowActionModal(true); }}
                                className="p-2.5 bg-white border border-gray-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-lg transition-all">
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CLASSROOMS */}
          {tab === 'classrooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div key={cls._id}
                  className="group relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-8 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden">
                  {/* corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/60 rounded-bl-[3rem] -mr-4 -mt-4" />

                  <div className="flex-1 mb-6 relative z-10">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors mb-2">
                      {cls.name}
                    </h3>
                    {cls.section && (
                      <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md">
                        {cls.section}
                      </span>
                    )}

                    <div className="mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Access Code</p>
                        <p className="text-lg font-black text-slate-900 tracking-[0.35em] font-mono">{cls.code}</p>
                      </div>
                      <button onClick={() => copyCode(cls.code)}
                        className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-600 border border-gray-100 shadow-md hover:scale-110 active:scale-95 transition-all">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Users size={14} className="text-slate-400" />
                      {cls.students?.length || 0} Students
                    </div>
                    <button onClick={() => navigate(`/classroom/${cls._id}`)}
                      className="flex items-center gap-2 px-5 h-10 bg-slate-900 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
                      View <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={() => setShowDeployModal(true)}
                className="group min-h-[280px] bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:border-slate-400 hover:bg-slate-50/50 hover:-translate-y-1 transition-all duration-500">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-slate-800 group-hover:bg-white group-hover:shadow-xl group-hover:border-slate-200 group-hover:scale-110 transition-all duration-500 mb-4">
                  <Plus size={30} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-700 transition-colors">New Classroom</p>
              </button>
            </div>
          )}

          {/* STUDENTS */}
          {tab === 'students' && (
            <div className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-8 py-7 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Students</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{students.length} enrolled in your department</p>
                  </div>
                </div>
                <div className="relative w-full sm:w-72">
                  <Zap size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input placeholder="Search students…"
                    className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-8 py-5">Student</th>
                      <th className="px-8 py-5">ID</th>
                      <th className="px-8 py-5">GPA</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-md">
                              {s.firstName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{s.firstName} {s.lastName}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-500 tracking-widest font-mono">{s.studentId}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            s.cgpa >= 3.5
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>GPA {s.cgpa || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => { setSelectedActionTarget(s); setShowActionModal(true); }}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-lg transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Create Class */}
      {showDeployModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setShowDeployModal(false)} />
          <div className="relative w-full max-w-lg bg-white border border-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                  <Plus size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">New Classroom</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new classroom hub</p>
                </div>
              </div>
              <button onClick={() => setShowDeployModal(false)}
                className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDeployClass} className="p-8 space-y-5">
              {[
                { label: 'Class Name', key: 'name', placeholder: 'e.g. Systems Analysis' },
                { label: 'Section', key: 'section', placeholder: 'e.g. SEM-4-A' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 block mb-2">{f.label}</label>
                  <input value={newClassData[f.key]} onChange={e => setNewClassData({ ...newClassData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all" />
                </div>
              ))}
              <button disabled={deploying}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-2">
                {deploying ? 'Creating…' : 'Create Classroom'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Approve */}
      {selectedFacultyToApprove && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setSelectedFacultyToApprove(null)} />
          <div className="relative w-full max-w-md bg-white border border-white rounded-[3rem] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
            <div className="text-center mb-8">
              <div className="w-18 h-18 inline-flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-full p-5 mb-5 shadow-xl">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">Approve Faculty</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Grant department access</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3 mb-7">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-semibold">Name</span>
                <span className="font-black text-slate-900">{selectedFacultyToApprove.profile.firstName} {selectedFacultyToApprove.profile.lastName}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-slate-400 font-semibold">Email</span>
                <span className="font-bold text-slate-600">{selectedFacultyToApprove.email}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedFacultyToApprove(null)} className="flex-1 h-12 bg-gray-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={() => approveFaculty(selectedFacultyToApprove._id)} className="flex-1 h-12 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:scale-[1.03] transition-all">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject */}
      {selectedFacultyToReject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setSelectedFacultyToReject(null)} />
          <div className="relative w-full max-w-md bg-white border border-white rounded-[3rem] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
            <div className="text-center mb-8">
              <div className="w-18 h-18 inline-flex items-center justify-center bg-rose-50 border border-rose-100 rounded-full p-5 mb-5 shadow-xl">
                <X size={36} className="text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">Reject Faculty</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Provide rejection reason</p>
            </div>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection…" rows={3}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-200 transition-all resize-none mb-6" />
            <div className="flex gap-4">
              <button onClick={() => setSelectedFacultyToReject(null)} className="flex-1 h-12 bg-gray-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={() => rejectFaculty(selectedFacultyToReject._id)} className="flex-1 h-12 bg-rose-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Action */}
      {showActionModal && selectedActionTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowActionModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-white overflow-hidden">
            <div className="bg-slate-900 px-8 py-7 text-white flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-black">
                  {(selectedActionTarget.profile?.firstName || selectedActionTarget.firstName || '?')[0]}
                </div>
                <div>
                  <p className="text-base font-black tracking-tight">{selectedActionTarget.profile?.firstName || selectedActionTarget.firstName} {selectedActionTarget.profile?.lastName || selectedActionTarget.lastName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Departmental Action</p>
                </div>
              </div>
              <button onClick={() => setShowActionModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Action Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'warning',    label: 'Warning',  icon: AlertTriangle, active: 'bg-amber-50 border-amber-200 text-amber-600',   inactive: 'bg-gray-50 border-gray-100 text-slate-400' },
                    { id: 'meeting',    label: 'Meeting',  icon: Mail,          active: 'bg-indigo-50 border-indigo-200 text-indigo-600', inactive: 'bg-gray-50 border-gray-100 text-slate-400' },
                    { id: 'rule-break', label: 'Rule',     icon: Zap,           active: 'bg-rose-50 border-rose-200 text-rose-600',       inactive: 'bg-gray-50 border-gray-100 text-slate-400' },
                    { id: 'revoke',     label: 'Revoke',   icon: ShieldOff,     active: 'bg-rose-50 border-rose-200 text-rose-600',       inactive: 'bg-gray-50 border-gray-100 text-slate-400' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setActionForm({ ...actionForm, type: t.id })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${actionForm.type === t.id ? t.active : t.inactive}`}>
                      <t.icon size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Message</label>
                <textarea value={actionForm.message} onChange={e => setActionForm({ ...actionForm, message: e.target.value })}
                  rows={3} placeholder="Enter official communication…"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handlePerformAction} disabled={actionLoading}
                  className="flex-1 h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <Zap size={15} />{actionLoading ? 'Processing…' : 'Dispatch Action'}
                </button>
                <button onClick={() => navigate(`/chat/user/${selectedActionTarget._id}`)} title="Direct Chat"
                  className="w-12 h-12 rounded-2xl border border-gray-200 text-slate-400 hover:text-slate-900 hover:bg-gray-50 hover:shadow-lg transition-all flex items-center justify-center">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HodDashboard;
