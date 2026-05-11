// src/components/Dashboard.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Calendar, 
  HelpCircle, 
  Briefcase, 
  Search,
  Bot,
  Users,
  Shield,
  Sparkles,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GlassCard, FeatureCard, StatCard } from '../dashboards/shared';
import eventsService from '../services/eventsService';
import helpdeskService from '../services/helpdeskService';
import { getChats } from '../services/chatService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = React.useState([]);

  const modules = [
    {
      id: 'chat',
      title: 'Chat',
      description: 'Connect with peers and faculty instantly.',
      icon: MessageCircle,
      color: 'text-blue-400',
      path: '/chat',
      available: true
    },
    {
      id: 'events',
      title: 'Events & Clubs',
      description: 'Discover campus happenings.',
      icon: Calendar,
      color: 'text-iv-emerald',
      path: '/events',
      available: true
    },
    {
      id: 'helpdesk',
      title: 'HelpDesk',
      description: 'Submit and track service requests.',
      icon: HelpCircle,
      color: 'text-iv-orange',
      path: '/helpdesk',
      available: true
    },
    {
      id: 'lost-found',
      title: 'Lost & Found',
      description: 'Report lost or found items.',
      icon: Search,
      color: 'text-pink-400',
      path: '/lost-found',
      available: true
    },
    {
      id: 'ai-chat',
      title: 'Cross-Department Communication',
      description: 'Smart tagging and routing of student queries to departments.',
      icon: Bot,
      color: 'text-iv-indigo',
      path: '/ask-intelliverse',
      available: true
    }
  ];

  // Role-based modules
  if (user?.role === 'student') {
    modules.push({
      id: 'career',
      title: 'Career Portal',
      description: 'AI-powered career guidance.',
      icon: Briefcase,
      color: 'text-purple-400',
      path: '/career',
      available: true
    });
  } else if (user?.role === 'admin' || user?.role === 'faculty') {
    modules.push({
      id: 'career-admin',
      title: 'Career Management',
      description: 'Manage internships and jobs.',
      icon: Briefcase,
      color: 'text-purple-400',
      path: '/career/admin',
      available: true
    });
  }

  if (user?.role === 'admin') {
    modules.unshift({
      id: 'admin',
      title: 'Admin Panel',
      description: 'Manage users and system settings.',
      icon: Shield,
      color: 'text-red-400',
      path: '/admin',
      available: true,
      badge: 'Admin'
    });
  }

  React.useEffect(() => {
    const load = async () => {
      const next = [];
      try {
        const evRes = await eventsService.list({ status: 'upcoming', sortBy: 'date', limit: 200 });
        const evs = evRes?.data || [];
        const upcomingCount = evs.length;
        const todayStr = new Date().toISOString().slice(0, 10);
        const meetingsToday = evs.filter((e) => {
          try { return new Date(e.date).toISOString().slice(0, 10) === todayStr; } catch { return false; }
        }).length;
        if (upcomingCount > 0) next.push({ label: 'Upcoming Events', value: String(upcomingCount), icon: Calendar, color: 'text-blue-500', delay: 0.9 });
        if (meetingsToday > 0) next.push({ label: 'Meetings Today', value: String(meetingsToday), icon: Users, color: 'text-purple-500', delay: 1.0 });
      } catch {}
      try {
        const tRes = await helpdeskService.getAllTickets({ status: 'open', limit: 1 });
        const pending = tRes?.data?.pagination?.totalTickets || (tRes?.data?.tickets || []).length || 0;
        if (pending > 0) next.push({ label: 'Pending Tickets', value: String(pending), icon: HelpCircle, color: 'text-iv-orange', delay: 1.1 });
      } catch {}
      try {
        const cRes = await getChats();
        const chats = cRes?.data || [];
        const active = chats.length;
        if (active > 0) next.push({ label: 'Active Chats', value: String(active), icon: MessageCircle, color: 'text-iv-emerald', delay: 1.2 });
      } catch {}
      setInsights(next);
    };
    load();
  }, [user?._id]);

  const handleNavigate = (module) => {
    if (module.available) {
      navigate(module.path);
    } else {
      toast.info('Coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-iv-bg text-iv-text font-sans overflow-x-hidden relative selection:bg-iv-indigo selection:text-white">
      {/* Ambient Background with Smooth "Running" Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Top-Left to Bottom-Right */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            repeatType: "reverse", 
            ease: "easeInOut" 
          }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iv-indigo/10 rounded-full blur-[120px]" 
        />
        
        {/* Blob 2: Bottom-Right to Top-Left */}
        <motion.div 
          animate={{ 
            x: [0, -100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.3, 1] 
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            repeatType: "reverse", 
            ease: "easeInOut" 
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iv-emerald/10 rounded-full blur-[120px]" 
        />

        {/* Blob 3: Center Pulse & Rotate */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-[20%] left-[30%] w-[60%] h-[60%] bg-iv-orange/5 rounded-full blur-[140px]" 
        />
        
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Modern Hero Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white/80 backdrop-blur-xl rounded-[24px] p-8 mb-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-500"
        >
          {/* Decorative background blobs for the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-iv-indigo/5 to-purple-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-iv-emerald/5 to-blue-100/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Left Side Content */}
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-iv-text via-iv-indigo to-iv-text tracking-tight">
                    IntelliVerse
                  </h1>
                </div>
                <p className="text-lg text-iv-indigo font-medium flex items-center gap-2">
                  Smart Campus Companion <Sparkles className="w-4 h-4" />
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-iv-text flex items-center gap-2">
                  Welcome back, {user?.profile?.displayName || user?.profile?.firstName} <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
                </h2>
                <p className="text-iv-muted font-medium mt-1">
                  Your AI-powered campus assistant is ready. Access your tools below.
                </p>
              </div>
            </div>

            {/* Right Side Profile Card */}
            <GlassCard 
              className="flex items-center p-3 pr-6 rounded-[20px] !bg-white/60 border-white/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[200px]"
              hoverEffect
            >
              <div className={`
                h-12 w-12 rounded-full flex items-center justify-center mr-4 shrink-0 overflow-hidden
                ${user?.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-iv-indigo to-purple-600'}
                shadow-md text-white ring-2 ring-white
              `}>
                {user?.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">
                    {(user?.profile?.displayName || user?.profile?.firstName || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-iv-text">
                  {user?.profile?.displayName || user?.profile?.firstName}
                </span>
                <span className="text-xs font-semibold text-iv-indigo uppercase tracking-wider bg-iv-indigo/10 px-2 py-0.5 rounded-full w-fit mt-0.5">
                  {user?.role === 'faculty' && user?.profile?.designation ? user.profile.designation : user?.role}
                </span>
              </div>
            </GlassCard>
          </div>
        </motion.div>

        {/* Primary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module, index) => (
            <FeatureCard
              key={module.id}
              {...module}
              onClick={() => handleNavigate(module)}
              delay={0.4 + (index * 0.1)}
            />
          ))}
        </div>

        {/* Insights & Stats Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-iv-indigo" />
            <h3 className="text-xl font-semibold text-iv-text">Quick Insights</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((s, i) => (
              <StatCard key={`${s.label}-${i}`} label={s.label} value={s.value} icon={s.icon} color={s.color} delay={s.delay} />
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
};

export default Dashboard;
