import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getTheme } from '../../styles/theme';
import {
  BookOpen, Plus, ChevronRight, Zap, X, Link as LinkIcon,
  Search, CalendarDays, Target, Trophy, MessageSquare,
  MapPin, Briefcase, LifeBuoy, ArrowRight, Sparkles,
} from 'lucide-react';
import logo from '../../logo-intelliverse-transparent.png.png';

// ─── Stat card ────────────────────────────────────────────────────────────────
const STAT_CONFIGS = [
  {
    icon: CalendarDays, title: 'Events Joined', subtitle: 'Registered Activities',
    key: 'eventsJoined', href: '/events',
    grad: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    shadow: '0 20px 50px -12px rgba(79,70,229,0.45)',
    ring: 'rgba(255,255,255,0.18)',
  },
  {
    icon: Target, title: 'Club Memberships', subtitle: 'Community Engagement',
    key: 'clubsMemberships', href: '/clubs',
    grad: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)',
    shadow: '0 20px 50px -12px rgba(124,58,237,0.45)',
    ring: 'rgba(255,255,255,0.18)',
  },
  {
    icon: LifeBuoy, title: 'Active Tickets', subtitle: 'Helpdesk Support',
    key: 'activeTickets', href: '/helpdesk',
    grad: 'linear-gradient(135deg,#d97706 0%,#f59e0b 100%)',
    shadow: '0 20px 50px -12px rgba(217,119,6,0.4)',
    ring: 'rgba(255,255,255,0.2)',
  },
  {
    icon: MessageSquare, title: 'Unread Messages', subtitle: 'Direct Communications',
    key: 'unreadMessages', href: '/chat',
    grad: 'linear-gradient(135deg,#059669 0%,#10b981 100%)',
    shadow: '0 20px 50px -12px rgba(5,150,105,0.4)',
    ring: 'rgba(255,255,255,0.18)',
  },
];

function StatCard({ cfg, value, onClick }) {
  const { icon: Icon, title, subtitle, grad, shadow, ring } = cfg;
  return (
    <div onClick={onClick} className="relative overflow-hidden rounded-3xl cursor-pointer group transition-all duration-300 hover:-translate-y-2 active:scale-[0.97]"
      style={{ background: grad, boxShadow: shadow }}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)' }} />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.4)' }} />
      {/* Grid dots */}
      <div className="absolute top-4 right-4 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
        ))}
      </div>

      <div className="relative p-6 flex flex-col gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.15)', borderColor: ring }}>
          <Icon size={22} className="text-white" strokeWidth={1.8} />
        </div>

        {/* Value */}
        <div>
          <p className="text-5xl font-black text-white leading-none tracking-tight">
            {value ?? 0}
          </p>
          <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.18em] mt-1">{subtitle}</p>
        </div>

        {/* Label row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15">
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">{title}</span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/15 group-hover:bg-white/25 transition-colors">
            <ChevronRight size={12} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme('student');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, clubsRes, classesRes] = await Promise.allSettled([
        api.get('/user/stats'),
        api.get('/events?limit=3'),
        api.get('/clubs?limit=3'),
        api.get('/classroom/my-classes'),
      ]);
      if (statsRes.status === 'fulfilled')  setStats(statsRes.value.data.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.data || []);
      if (clubsRes.status === 'fulfilled')  setClubs(clubsRes.value.data.data || []);
      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode) return toast.error('Please enter a class code');
    setJoining(true);
    try {
      const res = await api.post('/classroom/join', { code: classCode });
      if (res.data.success) {
        toast.success('Joined class successfully!');
        setClasses([res.data.data, ...classes]);
        setShowJoinModal(false); setClassCode('');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid class code'); }
    finally { setJoining(false); }
  };

  const handleJoinClub = async (e, clubId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/clubs/${clubId}/join`);
      if (res.data.success) {
        toast.success('Successfully joined the club!');
        navigate('/clubs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join club');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header (unchanged — user confirmed it's perfect) ── */}
      <div className="pt-10 pb-4 sticky top-0 z-[100] px-2 sm:px-8 w-full max-w-[1400px] mx-auto pointer-events-none mb-14">
        <div className="bg-white/10 backdrop-blur-[50px] border border-white/40 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden pointer-events-auto transition-all duration-700"
          style={{ boxShadow: `0 30px 70px -20px ${theme.shadow}` }}>
          <div className="p-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20">
            <div className="bg-white/10 backdrop-blur-3xl rounded-t-[2.4rem] sm:rounded-t-[2.9rem] px-4 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-2 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1.2rem] flex items-center justify-center shadow-xl bg-white transform hover:rotate-12 transition-all duration-500 hover:scale-110 p-2">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-[0.25em]">Student Portal</h1>
                  <div className="flex items-center gap-2 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em]">System Live</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight mb-0.5">Authenticated User</p>
                  <p className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">
                    {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white/80 shadow-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-indigo-600 text-xs font-black">
                  {(user?.profile?.displayName || user?.profile?.firstName)?.charAt(0)}
                </div>
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-b-[2.4rem] sm:rounded-b-[2.9rem] p-6 sm:p-10 bg-gradient-to-br ${theme.gradient}`}>
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/30 rounded-full blur-[60px] animate-pulse" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div className="hidden lg:flex w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-3xl border border-white/30 items-center justify-center text-white shadow-2xl">
                    <Trophy size={28} strokeWidth={1.5} className="drop-shadow-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight leading-tight">
                      Welcome back, <br className="hidden sm:block" />
                      <span className="text-white/90">{user?.profile?.displayName || user?.profile?.firstName}!</span> 👋
                    </h2>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        SEM {user?.profile?.semester}
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        GPA {user?.profile?.cgpa || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowJoinModal(true)}
                  className="px-8 py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2">
                  <Plus size={16} /> Join a Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-12">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CONFIGS.map(cfg => (
            <StatCard key={cfg.key} cfg={cfg} value={stats?.[cfg.key] ?? 0} onClick={() => navigate(cfg.href)} />
          ))}
        </div>

        {/* ── My Classes ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <BookOpen size={22} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">My Classes</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Connected Academic Mainframes</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.length > 0 ? classes.map((cls) => (
              <div key={cls._id}
                className="group relative bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-200 cursor-pointer"
                style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 50px -12px rgba(79,70,229,0.2)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(0,0,0,0.06)'}>
                {/* Top accent bar */}
                <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(90deg,#4f46e5,#a855f7)' }} />

                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#eef2ff,#ede9fe)' }}>
                    <Zap size={20} className="text-indigo-600" strokeWidth={1.8} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    Live
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight mb-1 truncate">{cls.name}</h3>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  {cls.section} · {cls.faculty?.profile?.firstName} {cls.faculty?.profile?.lastName}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <button onClick={() => navigate(`/classroom/${cls._id}`)}
                    className="flex-1 h-10 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}>
                    Go to Class
                  </button>
                  <button onClick={() => navigate(`/classroom/${cls._id}`)}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-sm border border-slate-100">
                  <LinkIcon size={24} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">No classes joined</p>
                <button onClick={() => setShowJoinModal(true)}
                  className="text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:underline">
                  Join Now
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Events + Clubs ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Events */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 transition-all duration-300 hover:border-indigo-100"
            style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between mb-7 pb-5 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#eef2ff,#ede9fe)' }}>
                  <CalendarDays size={18} className="text-indigo-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Upcoming Events</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Campus Feed</p>
                </div>
              </div>
              <button onClick={() => navigate('/events')} className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-bold hover:gap-2.5 transition-all uppercase tracking-wider">
                View All <ArrowRight size={13} />
              </button>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev._id}
                    onClick={() => navigate(`/events/${ev._id}`)}
                    className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-indigo-100 transition-all duration-300 cursor-pointer"
                    style={{ '--tw-shadow': 'none' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(79,70,229,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <h3 className="font-bold text-slate-800 text-[14px] mb-2 truncate group-hover:text-indigo-700 transition-colors">{ev.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-500 shadow-sm">
                        <CalendarDays size={11} className="text-indigo-400" /> {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-500 shadow-sm">
                          <MapPin size={11} className="text-indigo-400" /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CalendarDays className="mx-auto text-slate-200 mb-3" size={32} strokeWidth={1.2} />
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide">No activities scheduled</p>
              </div>
            )}
          </div>

          {/* Clubs */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 transition-all duration-300 hover:border-emerald-100"
            style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between mb-7 pb-5 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
                  <Target size={18} className="text-emerald-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Popular Clubs</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Community Discovery</p>
                </div>
              </div>
              <button onClick={() => navigate('/clubs')} className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold hover:gap-2.5 transition-all uppercase tracking-wider">
                Explore <ArrowRight size={13} />
              </button>
            </div>

            {clubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clubs.map(club => (
                  <div key={club._id}
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-emerald-100 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(5,150,105,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800 text-[14px] mb-1 group-hover:text-emerald-700 transition-colors">{club.name}</h3>
                      <p className="text-slate-400 text-[12px] leading-relaxed line-clamp-2">{club.description}</p>
                    </div>
                    <button 
                      onClick={(e) => handleJoinClub(e, club._id)}
                      className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                      Join Club
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Target className="mx-auto text-slate-200 mb-3" size={32} strokeWidth={1.2} />
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide">Discovery phase</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Controls ── */}
        <div className="rounded-3xl border border-slate-100 overflow-hidden"
          style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,0.07)' }}>
          {/* Header */}
          <div className="px-7 py-5 border-b border-slate-50 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg,#f9f7ff,#f0f4ff)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <Sparkles size={16} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Quick Controls</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fast access to essential services</p>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-white p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: LifeBuoy,     title: 'Get Help',    desc: 'Access Helpdesk Support',   href: '/helpdesk', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', light: '#eef2ff', accent: '#4f46e5' },
                { icon: Briefcase,   title: 'Career Path', desc: 'Expert tips & Job resources', href: '/career',  grad: 'linear-gradient(135deg,#059669,#10b981)', light: '#ecfdf5', accent: '#059669' },
                { icon: MessageSquare, title: 'Peer-to-Peer', desc: 'Message fellow students', href: '/p2p-chat', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', light: '#f5f3ff', accent: '#7c3aed' },
              ].map(action => (
                <div key={action.title} onClick={() => navigate(action.href)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                  style={{ background: action.light }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 32px -8px ${action.accent}40`; e.currentTarget.style.borderColor = `${action.accent}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-lg"
                    style={{ background: action.grad }}>
                    <action.icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-800 mb-1">{action.title}</h3>
                  <p className="text-[11px] font-medium text-slate-400">{action.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-bold transition-all group-hover:gap-2" style={{ color: action.accent }}>
                    Open <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Join Class Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowJoinModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-7 py-5 border-b border-slate-50 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#f9f7ff,#eef2ff)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  <Search size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Join a Class</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter code to join</p>
                </div>
              </div>
              <button onClick={() => setShowJoinModal(false)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleJoinClass} className="p-7 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Class Code</label>
                <input
                  value={classCode}
                  onChange={e => setClassCode(e.target.value.toUpperCase())}
                  className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black tracking-[0.3em] text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                  placeholder="E.G. 123456"
                  maxLength={6}
                />
              </div>
              <button disabled={joining}
                className="w-full h-13 py-3.5 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-50 transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>
                {joining ? 'Joining...' : 'Join Now →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
