import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Clock, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  BarChart3,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  X,
  Share2,
  Upload,
  Link
} from 'lucide-react';
import { getTheme } from '../../styles/theme';
import logo from '../../logo-intelliverse-transparent.png.png';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme(user?.role);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Modal states
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newClassData, setNewClassData] = useState({ name: '', section: '' });
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/user/stats').catch(() => ({ data: { data: {} } }));
      setStats(statsRes.data.data);

      const classesRes = await api.get('/classroom/my-classes').catch(() => ({ data: { data: [] } }));
      setClasses(classesRes.data.data || []);

      const studentsRes = await api.get('/faculty/students').catch(() => ({ data: { data: [] } }));
      setStudents(studentsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployClass = async (e) => {
    e.preventDefault();
    if (!newClassData.name) return toast.error('Class name is required');
    
    setDeploying(true);
    try {
      const res = await api.post('/classroom/create', newClassData);
      if (res.data.success) {
        toast.success('Class created successfully!');
        setClasses([res.data.data, ...classes]);
        setShowDeployModal(false);
        setNewClassData({ name: '', section: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setDeploying(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Class Code Copied!', {
      icon: '📋',
      style: { borderRadius: '1rem', background: '#333', color: '#fff' }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className={`w-20 h-20 border-4 border-${theme.primary}/10 border-t-${theme.primary} rounded-full animate-spin`} />
          <Zap className={`absolute inset-0 m-auto text-${theme.primary} animate-pulse`} size={30} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 text-gray-900 pb-20 relative overflow-hidden">
      {/* ── Ambient Background Art ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-${theme.primary}/5 rounded-full blur-[120px] opacity-40 animate-pulse`} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' fill='%23${theme.primaryRgb?.replace('#', '') || '4f46e5'}' fill-opacity='0.1'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-10">
        
        {/* ── Header ── */}
        <header className="relative group animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="relative bg-white/40 backdrop-blur-[50px] border border-white/60 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden">
            <div className={`absolute top-[-50px] right-[-50px] w-40 h-40 bg-${theme.primary}/10 rounded-full blur-3xl`} />
            <div className="flex items-center gap-8 relative z-10">
              <div className="relative">
                <div className={`absolute -inset-2 bg-gradient-to-br ${theme.gradient} rounded-[2rem] blur opacity-30 animate-pulse`} />
                <div className={`w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-white shadow-2xl relative p-4`}>
                   <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-4 py-1 rounded-full bg-${theme.primary}/10 text-${theme.primary} text-[10px] font-black uppercase tracking-[0.2em] border border-${theme.primary}/20`}>
                    Faculty Dashboard
                  </span>
                  <div className={`w-2 h-2 rounded-full bg-${theme.primary} animate-pulse`} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">
                  Welcome, <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>{user?.profile?.displayName || user?.profile?.firstName}</span>
                </h1>
                <p className="mt-4 text-gray-500 font-bold text-xs uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                  <BookOpen size={14} className={`text-${theme.primary}`} />
                  {user?.profile?.designation} • {user?.profile?.department}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-3xl flex items-center gap-4 group hover:bg-emerald-500/20 transition-all">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                     <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Status Valid</p>
                    <p className="text-xs font-bold text-emerald-800">Account Verified</p>
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
           {[
             { label: 'Active Classes', val: classes.length || 0, icon: BookOpen, color: theme.primary },
             { label: 'Total Students', val: students.length || 0, icon: Users, color: 'blue-500' },
             { label: 'Assignments', val: stats?.assignments || 0, icon: FileText, color: 'purple-500' },
             { label: 'Pending Reviews', val: stats?.pendingReviews || 0, icon: Clock, color: 'orange-500' }
           ].map((stat, i) => (
             <div key={i} className="group relative bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl bg-${stat.color}/10 text-${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                     <stat.icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                     <ArrowUpRight size={12} /> Live
                  </div>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors">{stat.label}</p>
                <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tighter">{stat.val}</h3>
             </div>
           ))}
        </div>

        {/* ── Class Broadcast ── */}
        <section className="animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
           <div className={`relative bg-gradient-to-r ${theme.gradient} rounded-[3.5rem] p-1 shadow-2xl overflow-hidden group`}>
              <div className="relative bg-black/10 backdrop-blur-3xl rounded-[3.3rem] px-10 py-8 flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 animate-pulse">
                       <Zap size={30} />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Classroom Management</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                       </div>
                       <h3 className="text-xl font-black text-white tracking-tight">Create your virtual classrooms and share codes with students to start sharing notes and assignments.</h3>
                    </div>
                 </div>
                 <button 
                  onClick={() => setShowDeployModal(true)}
                  className="px-10 py-5 bg-white text-gray-900 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                 >
                    <Plus size={18} />
                    Create New Class
                 </button>
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── My Classes ── */}
          <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-left-6 duration-1000 delay-400">
            <div id="class-list" className="bg-white/40 backdrop-blur-[50px] border border-white/60 rounded-[3.5rem] shadow-2xl overflow-hidden min-h-[500px]">
               <div className="px-10 py-8 border-b border-white/40 flex items-center justify-between bg-white/20">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl bg-${theme.primary}/10 text-${theme.primary}`}>
                        <Calendar size={24} />
                     </div>
                     <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-gray-900">My Classes</h2>
                  </div>
               </div>
               
               <div className="p-10">
                 {classes.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {classes.map((cls) => (
                       <div key={cls._id} className="group relative bg-white/60 border border-white rounded-[2.5rem] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:bg-white transition-all duration-500">
                          <div className="flex justify-between items-start mb-8">
                             <div>
                               <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{cls.name}</h3>
                               <span className={`px-4 py-1.5 rounded-xl bg-${theme.primary}/5 text-${theme.primary} text-[9px] font-black uppercase tracking-widest border border-${theme.primary}/10`}>
                                 {cls.section}
                               </span>
                             </div>
                             <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                                <Link size={20} />
                             </div>
                          </div>
                          
                          {/* ── Class Code ── */}
                          <div className="mb-8 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group/code">
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Class Code</p>
                                <p className="text-lg font-black text-gray-900 tracking-[0.2em] font-mono">{cls.code}</p>
                             </div>
                             <button 
                                onClick={() => copyCode(cls.code)}
                                className="p-3 rounded-xl bg-white text-gray-400 hover:text-emerald-500 hover:shadow-lg transition-all"
                             >
                                <Share2 size={18} />
                             </button>
                          </div>
                          
                          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Users size={14} />
                                {cls.students?.length || 0} Students
                             </div>
                             <button 
                                onClick={() => navigate(`/classroom/${cls._id}`)}
                                className={`flex items-center gap-2 px-6 h-12 rounded-2xl bg-${theme.primary} text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-${theme.primary}/20 hover:scale-105 transition-all`}
                             >
                                Go to Class
                                <ChevronRight size={14} />
                             </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-24 bg-gray-50/30 rounded-[3.5rem] border-2 border-dashed border-gray-200">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mx-auto mb-6">
                         <Zap size={40} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">No classes found</p>
                      <button onClick={() => setShowDeployModal(true)} className={`mt-6 text-${theme.primary} text-[11px] font-black uppercase tracking-widest hover:underline`}>Create Your First Class</button>
                   </div>
                 )}
               </div>
            </div>

            {/* ── Student Census ── */}
            <div id="student-list" className="bg-white/40 backdrop-blur-[50px] border border-white/60 rounded-[3.5rem] shadow-2xl overflow-hidden">
               <div className="px-10 py-8 border-b border-white/40 bg-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl bg-emerald-50 text-emerald-600`}>
                        <Users size={24} />
                     </div>
                     <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Student List</h2>
                  </div>
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full min-w-[800px]">
                   <thead>
                     <tr className="bg-white/30 border-b border-white/40 text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <th className="px-10 py-6 text-left">Student Name</th>
                       <th className="px-10 py-6 text-left">Student ID</th>
                       <th className="px-10 py-6 text-left">CGPA</th>
                       <th className="px-10 py-6 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/20">
                     {students.map((student) => (
                       <tr key={student._id} className="hover:bg-white/40 transition-colors group">
                         <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-${theme.primary}/10 flex items-center justify-center text-${theme.primary} font-black`}>{student.firstName[0]}</div>
                              <div>
                                 <p className="text-sm font-black text-gray-800 leading-none">{student.firstName} {student.lastName}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Verified Student</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-10 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">{student.studentId}</td>
                         <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                              student.cgpa >= 3.5 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            }`}>GPA: {student.cgpa}</span>
                         </td>
                         <td className="px-10 py-6 text-right">
                           <button className={`p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-${theme.primary} hover:text-white transition-all`}><ChevronRight size={18} /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-1000 delay-500">
            <div className="bg-white/40 backdrop-blur-[50px] border border-white/60 rounded-[3.5rem] p-10 shadow-2xl">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600"><BarChart3 size={24} /></div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Quick Tools</h2>
               </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Uploads', icon: Upload, color: 'blue-500', action: () => navigate('/chat') },
                    { label: 'Tasks', icon: FileText, color: 'purple-500', action: () => document.getElementById('class-list')?.scrollIntoView({ behavior: 'smooth' }) },
                    { label: 'Notifications', icon: Bell, color: 'orange-500', action: () => toast('No pending class alerts', { icon: '🔔' }) },
                    { label: 'Registry', icon: Users, color: 'emerald-500', action: () => document.getElementById('student-list')?.scrollIntoView({ behavior: 'smooth' }) }
                  ].map((act, i) => (
                    <button 
                      key={i} 
                      onClick={act.action}
                      className="group flex flex-col items-center justify-center p-8 bg-white/40 border border-white/60 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-${act.color}/10 text-${act.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><act.icon size={28} /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-gray-900">{act.label}</span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-[50px] border border-white/60 rounded-[3.5rem] p-10 shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <ShieldCheck size={20} className={`text-${theme.primary}`} />
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">System Status</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Uptime</p>
                     <p className="text-sm font-black text-gray-900">99.9%</p>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className={`h-full bg-gradient-to-r ${theme.gradient} w-[99%]`} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Class Modal ── */}
      {showDeployModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-2xl" onClick={() => setShowDeployModal(false)} />
           <div className="relative w-full max-w-xl bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/40 shadow-[0_60px_120px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="p-10 border-b border-white/20 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl bg-${theme.primary}/10 text-${theme.primary}`}>
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Create New Class</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Set up your virtual classroom</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDeployModal(false)} className="w-12 h-12 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleDeployClass} className="p-12 space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Class Name</label>
                    <input 
                       value={newClassData.name}
                       onChange={(e) => setNewClassData({...newClassData, name: e.target.value})}
                       className="w-full h-16 px-8 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all"
                       placeholder="e.g. Computer Science 101"
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Section / Semester</label>
                    <input 
                       value={newClassData.section}
                       onChange={(e) => setNewClassData({...newClassData, section: e.target.value})}
                       className="w-full h-16 px-8 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all"
                       placeholder="e.g. Section A - Spring 2024"
                    />
                 </div>
                 <button 
                    disabled={deploying}
                    className={`w-full h-20 bg-gradient-to-r ${theme.gradient} text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50`}
                 >
                    {deploying ? 'Creating Class...' : 'Create Class'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
