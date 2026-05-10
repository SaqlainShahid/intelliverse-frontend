import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getTheme } from '../../styles/theme';
import { 
  Users, 
  BookOpen, 
  Plus, 
  ChevronRight, 
  Zap, 
  X,
  Link as LinkIcon,
  Search,
  CalendarDays,
  Target,
  Trophy,
  MessageSquare,
  MapPin,
  Briefcase,
  LifeBuoy,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Star
} from 'lucide-react';
import logo from '../../logo-intelliverse-transparent.png.png';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme('student');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Join modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/user/stats').catch(() => ({ data: { data: {} } }));
      setStats(statsRes.data.data);
      const eventsRes = await api.get('/events?limit=3').catch(() => ({ data: { data: [] } }));
      setEvents(eventsRes.data.data || []);
      const clubsRes = await api.get('/clubs?limit=3').catch(() => ({ data: { data: [] } }));
      setClubs(clubsRes.data.data || []);
      
      // GCR Connect: Fetch classes
      const classesRes = await api.get('/classroom/my-classes').catch(() => ({ data: { data: [] } }));
      setClasses(classesRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
        setShowJoinModal(false);
        setClassCode('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid class code');
    } finally {
      setJoining(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'indigo' }) => {
    const colors = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500', glow: 'rgba(99,102,241,0.25)', ring: 'rgba(99,102,241,0.18)', line: 'rgba(99,102,241,0.09)', shadow: '0 4px 20px rgba(99,102,241,0.08), 0 12px 40px rgba(99,102,241,0.06)' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500', glow: 'rgba(139,92,246,0.25)', ring: 'rgba(139,92,246,0.18)', line: 'rgba(139,92,246,0.09)', shadow: '0 4px 20px rgba(139,92,246,0.08), 0 12px 40px rgba(139,92,246,0.06)' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', glow: 'rgba(245,158,11,0.25)', ring: 'rgba(245,158,11,0.18)', line: 'rgba(245,158,11,0.09)', shadow: '0 4px 20px rgba(245,158,11,0.08), 0 12px 40px rgba(245,158,11,0.06)' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', glow: 'rgba(16,185,129,0.25)', ring: 'rgba(16,185,129,0.18)', line: 'rgba(16,185,129,0.09)', shadow: '0 4px 20px rgba(16,185,129,0.08), 0 12px 40px rgba(16,185,129,0.06)' },
    };
    const c = colors[color] || colors.indigo;
    return (
      <div 
        className="bg-white rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-2 flex flex-col justify-between h-full cursor-pointer relative overflow-hidden border border-gray-100/80"
        style={{ fontFamily: "'Inter', sans-serif", boxShadow: c.shadow }}
      >
        {/* ── Premium Pattern Overlays ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">

          {/* Bottom gradient wash */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
            background: `linear-gradient(to top, ${c.glow}, transparent)`,
          }} />
          {/* Large corner glow blob */}
          <div style={{
            position: 'absolute', top: '-25%', right: '-15%',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${c.glow} 0%, transparent 65%)`,
            filter: 'blur(15px)',
            transition: 'transform 0.5s, opacity 0.5s',
          }} className="group-hover:scale-130 group-hover:opacity-90" />
          {/* Decorative ring */}
          <div style={{
            position: 'absolute', bottom: -25, right: -25,
            width: 100, height: 100, borderRadius: '50%',
            border: `3px solid ${c.ring}`,
            transition: 'transform 0.5s',
          }} className="group-hover:scale-110" />
          <div style={{
            position: 'absolute', bottom: -5, right: 30,
            width: 50, height: 50, borderRadius: '50%',
            border: `2px solid ${c.ring}`,
            opacity: 0.5,
          }} />
          {/* Dot accents */}
          <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: c.ring }} />
          <div style={{ position: 'absolute', top: 16, right: 30, width: 4, height: 4, borderRadius: '50%', background: c.ring, opacity: 0.5 }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} ${c.text} transition-transform group-hover:scale-110`}>
              <Icon size={20} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{title}</h3>
            <div className="flex items-baseline gap-2 mb-1.5">
              <p className="text-4xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
            </div>
            <p className="text-[11px] font-medium text-gray-400 tracking-wide">{subtitle}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Google Font Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      {/* ── RESTORED PREVIOUS DASHBOARD HERO ── */}
      <div className="pt-10 pb-4 sticky top-0 z-[100] px-2 sm:px-8 w-full max-w-[1400px] mx-auto pointer-events-none mb-14">
        <div className={`bg-white/10 backdrop-blur-[50px] border border-white/40 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden pointer-events-auto transition-all duration-700`} style={{ boxShadow: `0 30px 70px -20px ${theme.shadow}` }}>
          <div className={`p-0.5 sm:p-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20`}>
            {/* Ultra-Glass Nav Strip */}
            <div className="bg-white/10 backdrop-blur-3xl rounded-t-[2.4rem] sm:rounded-t-[2.9rem] px-4 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-2 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-xl bg-white text-white transform hover:rotate-12 transition-all duration-500 hover:scale-110 p-2">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-[0.25em]">Student Portal</h1>
                  <div className="flex items-center gap-2 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                    <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em]">System Live</p>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-5">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight mb-0.5">Authenticated User</p>
                    <p className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">{user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full border-2 border-white/80 shadow-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-indigo-600 text-xs font-black">
                    {(user?.profile?.displayName || user?.profile?.firstName)?.charAt(0)}
                 </div>
              </div>
            </div>

            {/* High-Translucency Artistic Welcome Area */}
            <div className={`relative overflow-hidden rounded-b-[2.4rem] sm:rounded-b-[2.9rem] p-6 sm:p-10 bg-gradient-to-br ${theme.gradient} mix-blend-normal`}>
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/30 rounded-full blur-[60px] animate-pulse"></div>
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                   <div className="hidden lg:flex w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-3xl border border-white/30 items-center justify-center text-white shadow-2xl">
                       <Trophy size={28} strokeWidth={1.5} className="drop-shadow-lg" />
                   </div>
                   <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight leading-tight">
                      Welcome back, <br className="hidden sm:block"/><span className="text-white/90">{user?.profile?.displayName || user?.profile?.firstName}!</span> 👋
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
                
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setShowJoinModal(true)}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2"
                   >
                      <Plus size={16} /> Join a Class
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-12">
        {/* ── Statistics Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={CalendarDays} title="Events Joined" value={stats?.eventsJoined || 0} subtitle="Registered Activities" color="indigo" />
          <StatCard icon={Target} title="Club Memberships" value={stats?.clubsMemberships || 0} subtitle="Community Engagement" color="violet" />
          <StatCard icon={Trophy} title="Achievements" value={stats?.achievements || 0} subtitle="Success Milestones" color="amber" />
          <StatCard icon={MessageSquare} title="Unread Messages" value={stats?.unreadMessages || 0} subtitle="Direct Communications" color="emerald" />
        </div>

        {/* ── NEW MODULE: MY CLASSES (GCR CONNECT) ── */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={24} />
                 </div>
                 <div>
                    <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">My Classes</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Connected Academic Mainframes</p>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <div key={cls._id} className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_12px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.1)] hover:-translate-y-2 transition-all duration-500">
                     <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <Zap size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Live Link</span>
                     </div>
                     <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2 truncate">{cls.name}</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">{cls.section} • {cls.faculty?.profile?.firstName} {cls.faculty?.profile?.lastName}</p>
                     
                     <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                        <button 
                           onClick={() => navigate(`/classroom/${cls._id}`)}
                           className="flex-1 h-12 bg-gray-50 text-gray-900 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                        >
                           Go to Class
                        </button>
                        <button 
                           onClick={() => navigate(`/classroom/${cls._id}`)}
                           className="w-12 h-12 bg-gray-50 text-gray-400 rounded-[1.2rem] flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all"
                        >
                           <ChevronRight size={20} />
                        </button>
                     </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
                      <LinkIcon size={30} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No classes joined</p>
                   <button onClick={() => setShowJoinModal(true)} className="mt-3 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">Join Now</button>
                </div>
              )}
           </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 lg:gap-12">
          {/* ── Upcoming Events Container ── */}
          <div className="bg-white/80 backdrop-blur-3xl border border-indigo-50 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CalendarDays size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Upcoming Events</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Campus Feed</p>
                </div>
              </div>
              <a href="/events" className="group flex items-center gap-2 text-indigo-600 text-[11px] font-semibold tracking-wide hover:gap-3 transition-all">
                View All <ArrowRight size={14} />
              </a>
            </div>

            {events.length > 0 ? (
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event._id} className="group p-6 rounded-[2rem] border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-xl transition-all duration-500">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{event.title}</h3>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm text-[11px] font-medium text-gray-500">
                        <CalendarDays size={13} className="text-indigo-500" /> {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm text-[11px] font-medium text-gray-500">
                        <MapPin size={13} className="text-indigo-500" /> {event.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <CalendarDays className="mx-auto text-gray-200 mb-4" size={36} strokeWidth={1.2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wide">No activities scheduled</p>
              </div>
            )}
          </div>

          {/* ── Popular Clubs Container ── */}
          <div className="bg-white/80 backdrop-blur-3xl border border-indigo-50 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Target size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Popular Clubs</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Community Discovery</p>
                </div>
              </div>
              <a href="/clubs" className="group flex items-center gap-2 text-indigo-600 text-[11px] font-semibold tracking-wide hover:gap-3 transition-all">
                Explore <ArrowRight size={14} />
              </a>
            </div>

            {clubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {clubs.map((club) => (
                  <div key={club._id} className="p-6 rounded-[2rem] border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-2">{club.name}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-6 line-clamp-2">{club.description}</p>
                    </div>
                    <button className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
                      Join Club
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <Target className="mx-auto text-gray-200 mb-4" size={36} strokeWidth={1.2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wide">Discovery phase</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Control Center ── */}
        <div className="bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-3 bg-indigo-50 rounded-2xl">
                <Sparkles className="text-indigo-600" size={20} strokeWidth={1.8} />
             </div>
             <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Student Quick Controls</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Fast access to essential services</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: LifeBuoy, title: "Get Help", desc: "Access the Helpdesk Support", href: "/helpdesk", color: "indigo" },
              { icon: Briefcase, title: "Career Path", desc: "Expert tips & Job resources", href: "/career", color: "emerald" },
              { icon: MessageSquare, title: "Peer-to-Peer", desc: "Message fellow students", href: "/p2p-chat", color: "purple" },
            ].map((action) => (
              <a
                key={action.title}
                href={action.href}
                className={`p-8 rounded-[2.5rem] border border-${action.color}-50 bg-${action.color}-50/30 hover:bg-white hover:shadow-2xl transition-all duration-500 group text-center flex flex-col items-center`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${action.color}-50 flex items-center justify-center text-${action.color}-600 mb-5 group-hover:scale-110 transition-all duration-300`}>
                  <action.icon size={24} strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-[11px] font-medium text-gray-400">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Join Class Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-2xl" onClick={() => setShowJoinModal(false)} />
           <div className="relative w-full max-w-xl bg-white/80 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-white/20 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl"><Search size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Join a Class</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enter code to join</p>
                    </div>
                 </div>
                 <button onClick={() => setShowJoinModal(false)} className="w-12 h-12 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleJoinClass} className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Class Code</label>
                    <input 
                       value={classCode}
                       onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                       className="w-full h-16 px-8 bg-white border border-gray-100 rounded-2xl text-xl font-black tracking-widest shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all text-center"
                       placeholder="E.G. 123456"
                       maxLength={6}
                    />
                 </div>
                 <button 
                    disabled={joining}
                    className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {joining ? 'Joining...' : 'Join Now'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
