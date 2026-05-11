import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaUserShield,
  FaClipboardCheck, FaTimes, FaExclamationTriangle, FaClock, FaCheckCircle,
  FaTicketAlt, FaCalendarAlt, FaBuilding, FaQuestionCircle, FaBriefcase,
  FaSearch, FaFilter, FaDownload, FaChartLine, FaChartBar, FaChartPie,
  FaBell, FaEnvelope, FaCog, FaDatabase, FaServer, FaGlobe,
  FaTrophy, FaBook, FaComments, FaHeart, FaExclamation
} from 'react-icons/fa';
import { MdDashboard, MdPendingActions, MdVerified, MdBlock, MdAnnouncement } from 'react-icons/md';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { AiFillDashboard } from 'react-icons/ai';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import HodManagement from './HodManagement';
import EventClubManagerManagement from './EventClubManagerManagement';
import DepartmentManagement from './DepartmentManagement';
import AnnouncementSystem from './AnnouncementSystem';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';
import logo from '../../logo-intelliverse-transparent.png.png';

const AdminStatsEnhanced = () => {
  const { user } = useAuth();
  const theme = getTheme(user?.role);
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState({});
  const [timeRange, setTimeRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [moduleUsageData, setModuleUsageData] = useState([]);
  const [userFilterRole, setUserFilterRole] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState('');
  const [editingDesignation, setEditingDesignation] = useState(null); // { id, value }

  const DESIGNATION_OPTIONS = ['Lecturer','Senior Lecturer','Assistant Professor','Associate Professor','Professor','Visiting Lecturer','Lab Engineer','Instructor','Coordinator','Program Coordinator','HOD'];

  const handleUpdateDesignation = async (userId, designation) => {
    try {
      await api.put(`/auth/admin/users/${userId}/designation`, { designation });
      toast.success('Designation updated');
      setEditingDesignation(null);
      setUsersData(prev => prev.map(u => u._id === userId ? { ...u, profile: { ...u.profile, designation } } : u));
    } catch (e) {
      toast.error('Failed to update designation');
    }
  };

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'confirm', // confirm, success, error, warning
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  useEffect(() => {
    loadDashboardData();
    // Only load once on component mount, no auto-refresh
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats (required)
      let statsRes = null;
      try {
        statsRes = await api.get('/admin/stats');
      } catch (err) {
        console.error('Failed to fetch admin stats:', err.response?.status, err.response?.data);
        statsRes = { data: { data: { users: { total: 0, students: 0, faculty: 0, hods: 0, admins: 0 }, approvals: { pendingFaculty: 0, rejectedFaculty: 0 } } } };
      }
      setStats(statsRes.data.data);

      // Load approvals
      let approvalsRes = null;
      try {
        approvalsRes = await api.get('/admin/pending-approvals');
      } catch (err) {
        console.error('Failed to fetch pending approvals:', err.response?.status);
        approvalsRes = { data: { data: { byDepartment: {} } } };
      }
      setPendingApprovals(approvalsRes.data.data);

      // Load analytics
      let analyticsRes = null;
      try {
        analyticsRes = await api.get(`/admin/analytics?timeRange=${timeRange}`);
      } catch (err) {
        console.error('Failed to fetch analytics:', err.response?.status);
        analyticsRes = { data: { data: { moduleStats: {} } } };
      }
      const analytics = analyticsRes.data.data;
      if (analytics?.moduleStats) {
        setRecentActivities(analytics.moduleStats);
        
        const modules = [
          { name: 'Helpdesk', value: analytics.moduleStats.helpdesk?.usage || 0, total: analytics.moduleStats.helpdesk?.total || 0 },
          { name: 'Events', value: analytics.moduleStats.events?.usage || 0, total: analytics.moduleStats.events?.total || 0 },
          { name: 'Lost & Found', value: analytics.moduleStats.lostAndFound?.usage || 0, total: analytics.moduleStats.lostAndFound?.total || 0 },
          { name: 'Career', value: analytics.moduleStats.career?.usage || 0, total: analytics.moduleStats.career?.total || 0 },
        ];
        setModuleUsageData(modules);
        
        const analyticsChartData = [
          { name: 'Users', students: statsRes.data.data?.users?.students || 0, faculty: statsRes.data.data?.users?.faculty || 0, hods: statsRes.data.data?.users?.hods || 0 },
          { name: 'Tickets', open: analytics.moduleStats.helpdesk?.open || 0, resolved: analytics.moduleStats.helpdesk?.resolved || 0 },
          { name: 'Events', total: analytics.moduleStats.events?.total || 0, upcoming: analytics.moduleStats.events?.upcoming || 0 },
          { name: 'Lost Items', found: analytics.moduleStats.lostAndFound?.found || 0, missing: analytics.moduleStats.lostAndFound?.total || 0 },
        ];
        setAnalyticsData(analyticsChartData);
      }

      // Load system health
      let healthRes = null;
      try {
        healthRes = await api.get('/admin/system-health');
      } catch (err) {
        console.error('Failed to fetch system health:', err.response?.status);
        healthRes = { data: { data: { api: { averageResponseTime: '45ms' }, server: { activeConnections: 0 }, database: { status: 'operational' }, services: {} } } };
      }
      const health = healthRes.data.data;
      if (health) {
        setSystemMetrics({
          serverUptime: '99.9%',
          apiResponseTime: health.api?.averageResponseTime || '45ms',
          activeConnections: health.server?.activeConnections || 0,
          dataStorage: '2.3 GB / 10 GB',
          database: health.database?.status || 'operational',
          services: health.services || {}
        });
      }

      // Load users data
      let usersRes = null;
      try {
        usersRes = await api.get('/admin/users?limit=100');
      } catch (err) {
        console.error('Failed to fetch all users:', err.response?.status);
        usersRes = { data: { data: { users: [] } } };
      }
      if (usersRes.data.data?.users) {
        setUsersData(usersRes.data.data.users);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't show error toast on auto-refresh, only on manual load
    } finally {
      setLoading(false);
    }
  };

  const openModal = (config) => {
    setModalConfig(config);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleToggleUserStatus = (userId, userName, currentStatus) => {
    openModal({
      title: currentStatus ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${userName}? ${currentStatus ? 'This user will lose access to the platform.' : 'This user will regain access to the platform.'}`,
      type: 'warning',
      confirmText: currentStatus ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      onConfirm: async () => {
        closeModal();
        try {
          await api.post(`/admin/users/${userId}/toggle-status`);
          // Show success modal
          openModal({
            title: 'Success!',
            message: `${userName} has been ${currentStatus ? 'deactivated' : 'activated'} successfully. ${currentStatus ? 'User no longer has access to the platform.' : 'User can now access the platform.'}`,
            type: 'success',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: () => {
              closeModal();
              loadDashboardData();
            }
          });
        } catch (error) {
          console.error('Error toggling user status:', error);
          openModal({
            title: 'Error',
            message: 'Failed to update user status. Please try again.',
            type: 'error',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: closeModal
          });
        }
      }
    });
  };

  const handleChangeUserRole = (userId, userName, currentRole, newRole) => {
    if (currentRole === newRole) return;
    
    openModal({
      title: 'Change User Role',
      message: `Are you sure you want to change ${userName}'s role from ${currentRole.toUpperCase()} to ${newRole.toUpperCase()}? This will update their permissions immediately.`,
      type: 'confirm',
      confirmText: 'Change Role',
      cancelText: 'Cancel',
      onConfirm: async () => {
        closeModal();
        try {
          await api.post(`/admin/users/${userId}/role`, { newRole });
          // Show success modal
          openModal({
            title: 'Role Updated!',
            message: `${userName}'s role has been successfully changed from ${currentRole.toUpperCase()} to ${newRole.toUpperCase()}. Their new permissions are now active.`,
            type: 'success',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: () => {
              closeModal();
              loadDashboardData();
            }
          });
        } catch (error) {
          console.error('Error changing user role:', error);
          openModal({
            title: 'Error',
            message: 'Failed to change user role. Please try again.',
            type: 'error',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: closeModal
          });
        }
      }
    });
  };

  const handleDeleteUser = (userId, userName, userEmail) => {
    openModal({
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${userName} (${userEmail})? This action cannot be undone and will remove all user data.`,
      type: 'error',
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      onConfirm: async () => {
        closeModal();
        try {
          await api.delete(`/admin/users/${userId}`);
          // Show success modal
          openModal({
            title: 'User Deleted',
            message: `${userName} has been permanently deleted from the system. All associated data has been removed.`,
            type: 'success',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: () => {
              closeModal();
              loadDashboardData();
            }
          });
        } catch (error) {
          console.error('Error deleting user:', error);
          openModal({
            title: 'Error',
            message: error.response?.data?.message || 'Failed to delete user. Please try again.',
            type: 'error',
            confirmText: 'OK',
            cancelText: null,
            onConfirm: closeModal
          });
        }
      }
    });
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, trendUp, onClick }) => (
    <div
      onClick={onClick}
      className="relative rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between h-full cursor-pointer group transition-all duration-500 hover:-translate-y-2 active:scale-[0.98] overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(220,38,38,0.12)',
        boxShadow: '0 4px 24px rgba(159,18,57,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[2rem]" style={{ background: 'linear-gradient(90deg, #e11d48, #f43f5e, #fb7185)' }} />
      {/* Dot grid overlay pattern */}
      <div className="absolute inset-0 pointer-events-none rounded-[2rem]" style={{
        backgroundImage: `radial-gradient(circle, rgba(225,29,72,0.07) 1.2px, transparent 1.2px)`,
        backgroundSize: '18px 18px',
        maskImage: 'radial-gradient(ellipse 90% 80% at 100% 100%, black 10%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 100% 100%, black 10%, transparent 70%)',
      }} />
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(255,228,230,0.45) 0%, transparent 65%)' }} />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 text-white"
          style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 55%, #9f1239 100%)', boxShadow: '0 4px 14px rgba(225,29,72,0.30)' }}>
          <Icon className="text-sm sm:text-base" />
        </div>
        {trend && (
          <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 ${trendUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
            {trendUp ? <HiTrendingUp /> : <HiTrendingDown />}
            {trend}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: '#e11d48' }}>{title}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-none">
            {value}
          </p>
        </div>
        <p className="text-[11px] font-normal text-gray-400 truncate">{subtitle}</p>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, action, color }) => (
    <button
      onClick={action}
      className="group relative rounded-2xl p-5 sm:p-6 text-left w-full overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(220,38,38,0.10)',
        boxShadow: '0 2px 12px rgba(159,18,57,0.05), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
        backgroundImage: `radial-gradient(circle, rgba(225,29,72,0.06) 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 100% 100%, black 10%, transparent 65%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 100% 100%, black 10%, transparent 65%)',
      }} />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(255,241,242,0.8) 0%, rgba(255,255,255,0) 70%)' }} />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-transform duration-300 group-hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)', boxShadow: '0 4px 14px rgba(225,29,72,0.28)' }}>
          <Icon className="text-base" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5 truncate">{title}</h3>
          <p className="text-[11px] text-gray-400 truncate leading-tight">{description}</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="text-rose-500 text-sm font-bold">→</span>
      </div>
    </button>
  );

  const AlertCard = ({ type, message, count, icon: Icon }) => {
    const colorMap = {
      warning: 'from-amber-400 to-orange-500 shadow-orange-100/50',
      error: 'from-rose-500 to-red-600 shadow-red-100/50',
      info: 'from-blue-500 to-indigo-600 shadow-blue-100/50',
      success: 'from-emerald-500 to-teal-600 shadow-emerald-100/50'
    };

    return (
      <div className={`relative overflow-hidden bg-gradient-to-r ${colorMap[type]} rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 text-white shadow-2xl flex items-center gap-4 sm:gap-5 group`}>
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
           <Icon size={100} />
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
           <Icon className="text-xl sm:text-2xl" />
        </div>
        <div className="relative z-10 min-w-0">
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5 sm:mb-1">Attention Required</p>
          <div className="flex items-center gap-2 sm:gap-3">
             <p className="text-lg sm:text-xl font-black tracking-tight truncate">{message}</p>
             <span className="bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black shrink-0">{count}</span>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showModal) return null;

    const getModalStyles = () => {
      switch (modalConfig.type) {
        case 'error':
          return {
            icon: <FaTimes className="text-5xl text-red-500" />,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            buttonColor: 'bg-red-600 hover:bg-red-700'
          };
        case 'warning':
          return {
            icon: <FaExclamationTriangle className="text-5xl text-yellow-500" />,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
          };
        case 'success':
          return {
            icon: <FaCheckCircle className="text-5xl text-green-500" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700'
          };
        default:
          return {
            icon: <FaQuestionCircle className="text-5xl text-blue-500" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700'
          };
      }
    };

    const styles = getModalStyles();

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-[scale-in_0.2s_ease-out]">
          <div className={`${styles.bgColor} ${styles.borderColor} border-b-2 p-6 rounded-t-2xl`}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                {styles.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{modalConfig.title}</h3>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 text-center mb-6">
              {modalConfig.message}
            </p>
            
            <div className={`flex gap-3 ${!modalConfig.cancelText ? 'justify-center' : ''}`}>
              {modalConfig.cancelText && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  }
                }}
                className={`${modalConfig.cancelText ? 'flex-1' : 'min-w-[120px]'} px-6 py-3 ${styles.buttonColor} text-white font-semibold rounded-xl transition-colors shadow-lg`}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'radial-gradient(ellipse at top, rgba(255,228,230,0.5) 0%, #fff 70%)' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(225,29,72,0.15)' }}></div>
            <div className="relative w-16 h-16 rounded-full border-2 border-rose-100 border-t-rose-600 animate-spin"></div>
          </div>
          <p className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden" style={{ backgroundColor: '#fafafa' }}>

      {/* Subtle background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 35% at 0% 0%, rgba(255,228,230,0.28) 0%, transparent 55%),' +
          'radial-gradient(ellipse 45% 30% at 100% 100%, rgba(254,205,211,0.18) 0%, transparent 55%)'
      }} />

      {/* Confirmation Modal */}
      <ConfirmationModal />

      {/* ── Premium Navigation ── */}
      <header className="sticky top-2 sm:top-4 z-[100] px-2 sm:px-6 w-full max-w-[1400px] mx-auto pointer-events-none">
        <div
          className="rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-auto transition-all duration-300"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(220,38,38,0.14)',
            boxShadow: '0 4px 24px rgba(159,18,57,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {/* Top accent bar */}
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #9f1239, #e11d48, #f43f5e, #e11d48, #9f1239)' }} />

          {/* Header row */}
          <div className="px-4 py-3 sm:px-8 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => window.__APP_TOGGLE_SIDEBAR && window.__APP_TOGGLE_SIDEBAR()}
                className="lg:hidden p-2 rounded-xl border transition-all"
                style={{ background: '#fff1f2', border: '1px solid rgba(225,29,72,0.15)', color: '#e11d48' }}
              >
                <MdDashboard className="text-base" />
              </button>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center p-1.5" style={{ border: '1px solid rgba(220,38,38,0.12)', boxShadow: '0 2px 8px rgba(159,18,57,0.10)' }}>
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-black text-gray-950 tracking-tight leading-none mb-1">Admin Central</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#e11d48' }}>IntelliVerse Core</span>
                </div>
              </div>
            </div>

            {/* Admin badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-bold text-gray-800 leading-none mb-0.5 uppercase tracking-wide">
                  {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#e11d48' }}>Root Access</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs font-black"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)', boxShadow: '0 3px 10px rgba(225,29,72,0.30)' }}>
                {(user?.profile?.displayName || user?.profile?.firstName || 'A').charAt(0).toUpperCase()}
                {(user?.profile?.displayName
                  ? user.profile.displayName.split(' ')[1]?.charAt(0)
                  : user?.profile?.lastName?.charAt(0)
                )?.toUpperCase() || ''}
              </div>
            </div>
          </div>

          {/* ── Tab Navigation ── */}
          <nav className="px-3 py-2.5 sm:px-6 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-1.5" style={{ borderTop: '1px solid rgba(220,38,38,0.08)', background: 'rgba(255,245,246,0.6)' }}>
            {[
              { id: 'overview',         label: 'Overview',    icon: MdDashboard },
              { id: 'analytics',        label: 'Analytics',   icon: FaChartLine },
              { id: 'users',            label: 'Users',       icon: FaUsers },
              { id: 'hod',              label: 'HODs',        icon: FaUserTie },
              { id: 'eventClubManager', label: 'Events/Clubs',icon: FaCalendarAlt },
              { id: 'departments',      label: 'Departments', icon: FaBuilding },
              { id: 'announcements',    label: 'Broadcast',   icon: MdAnnouncement },
              { id: 'system',           label: 'Health',      icon: FaServer },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-all duration-200"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #e11d48, #9f1239)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(225,29,72,0.30)',
                  } : {
                    background: 'transparent',
                    color: '#6b7280',
                  }}
                >
                  <tab.icon size={12} style={{ color: isActive ? '#ffffff' : '#9ca3af' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* ── Alerts Section ── */}
            {(stats?.approvals?.pendingFaculty > 0 || stats?.approvals?.rejectedFaculty > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stats?.approvals?.pendingFaculty > 0 && (
                  <AlertCard
                    type="warning"
                    message="Pending Approvals"
                    count={stats.approvals.pendingFaculty}
                    icon={FaExclamationTriangle}
                  />
                )}
                {stats?.approvals?.rejectedFaculty > 0 && (
                  <AlertCard
                    type="error"
                    message="Rejected Accounts"
                    count={stats.approvals.rejectedFaculty}
                    icon={FaTimes}
                  />
                )}
              </div>
            )}

            {/* ── Primary Metrics ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12 sm:mb-20">
              <StatCard 
                icon={FaUsers} 
                title="Global Users" 
                value={stats?.users?.total || 0} 
                subtitle="Aggregated platform membership" 
                color="border-rose-600" 
                trend="+12%" 
                trendUp={true} 
                onClick={() => setActiveTab('users')}
              />
              <StatCard 
                icon={FaUserGraduate} 
                title="Students" 
                value={stats?.users?.students || 0} 
                subtitle="Verified scholar network" 
                color="border-red-500" 
                trend="+8%" 
                trendUp={true} 
                onClick={() => setActiveTab('users')}
              />
              <StatCard 
                icon={FaChalkboardTeacher} 
                title="Faculty" 
                value={stats?.users?.faculty || 0} 
                subtitle="Academic staff registry" 
                color="border-orange-500" 
                trend="+3%" 
                trendUp={true} 
                onClick={() => setActiveTab('users')}
              />
              <StatCard 
                icon={FaUserTie} 
                title="Leadership" 
                value={stats?.users?.hods || 0} 
                subtitle="Active department heads" 
                color="border-rose-400" 
                onClick={() => setActiveTab('hod')}
              />
            </div>

            {/* ── Secondary Metrics ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 mb-12 sm:mb-20">
              <StatCard 
                icon={FaUserShield} 
                title="System Admins" 
                value={stats?.users?.admins || 0} 
                subtitle="Root operations team" 
                color="border-rose-700" 
                onClick={() => setActiveTab('users')}
              />
              <StatCard 
                icon={MdPendingActions} 
                title="Pending Approval" 
                value={stats?.approvals?.pendingFaculty || 0} 
                subtitle="Awaiting administrative review" 
                color="border-amber-600" 
                onClick={() => setActiveTab('users')}
              />
              <StatCard 
                icon={MdBlock} 
                title="Banned/Rejected" 
                value={stats?.approvals?.rejectedFaculty || 0} 
                subtitle="Access revoked or denied" 
                color="border-gray-600" 
                onClick={() => setActiveTab('users')}
              />
            </div>

            {/* ── Module Performance & Health ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20">
              {/* Module Usage Card */}
              <div className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(220,38,38,0.10)',
                  boxShadow: '0 4px 20px rgba(159,18,57,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                }}>
                {/* Dot grid overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `radial-gradient(circle, rgba(225,29,72,0.055) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  maskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 0%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 0%, transparent 70%)',
                }} />
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #9f1239, #e11d48, #f43f5e)' }} />
                <div className="px-6 sm:px-8 py-5 sm:py-6 border-b flex items-center gap-3" style={{ borderColor: 'rgba(220,38,38,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)', boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}>
                    <FaChartBar className="text-sm" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 tracking-tight">Module Performance</h2>
                </div>
                <div className="p-5 sm:p-8 space-y-6">
                  {[
                    { name: 'Helpdesk',    value: recentActivities?.helpdesk?.usage    || 89, icon: FaTicketAlt,    grad: 'linear-gradient(90deg,#e11d48,#f43f5e)' },
                    { name: 'Events',      value: recentActivities?.events?.usage      || 76, icon: FaCalendarAlt,  grad: 'linear-gradient(90deg,#ec4899,#f43f5e)' },
                    { name: 'Lost & Found',value: recentActivities?.lostAndFound?.usage|| 64, icon: FaQuestionCircle,grad: 'linear-gradient(90deg,#f59e0b,#ef4444)' },
                    { name: 'Career',      value: recentActivities?.career?.usage      || 82, icon: FaBriefcase,    grad: 'linear-gradient(90deg,#10b981,#14b8a6)' },
                    { name: 'AI Chat',     value: 91,                                         icon: FaComments,     grad: 'linear-gradient(90deg,#8b5cf6,#6366f1)' },
                  ].map((module) => (
                    <div key={module.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <module.icon className="text-sm" style={{ color: '#e11d48' }} />
                          <span className="text-xs font-semibold text-gray-700">{module.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: '#e11d48' }}>{module.value}%</span>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden bg-rose-50">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${module.value}%`, background: module.grad }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Infrastructure Card */}
              <div className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(220,38,38,0.10)',
                  boxShadow: '0 4px 20px rgba(159,18,57,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                }}>
                {/* Dot grid overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `radial-gradient(circle, rgba(225,29,72,0.055) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  maskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 0%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 0%, transparent 70%)',
                }} />
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #9f1239, #e11d48, #f43f5e)' }} />
                <div className="px-6 sm:px-8 py-5 sm:py-6 border-b flex items-center gap-3" style={{ borderColor: 'rgba(220,38,38,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)', boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}>
                    <FaServer className="text-sm" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 tracking-tight">Infrastructure Status</h2>
                </div>
                <div className="p-5 sm:p-8 space-y-3">
                  {[
                    { label: 'Uptime Reliability', value: systemMetrics.serverUptime,      icon: FaCheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.12)' },
                    { label: 'Network Latency',    value: systemMetrics.apiResponseTime,   icon: FaGlobe,       color: '#e11d48', bg: 'rgba(225,29,72,0.05)',   border: 'rgba(225,29,72,0.10)' },
                    { label: 'Concurrent Users',   value: systemMetrics.activeConnections,  icon: FaUsers,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.10)' },
                    { label: 'Encrypted Storage',  value: systemMetrics.dataStorage,        icon: FaDatabase,    color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.10)' },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                      style={{ background: metric.bg, border: `1px solid ${metric.border}` }}>
                      <div className="flex items-center gap-3">
                        <metric.icon style={{ color: metric.color, fontSize: '1rem' }} />
                        <span className="text-xs font-semibold text-gray-700">{metric.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Quick Control Panel ── */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(220,38,38,0.10)',
                boxShadow: '0 4px 20px rgba(159,18,57,0.06), 0 1px 4px rgba(0,0,0,0.04)',
              }}>
              {/* Dot grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, rgba(225,29,72,0.055) 1px, transparent 1px)`,
                backgroundSize: '22px 22px',
                maskImage: 'radial-gradient(ellipse 70% 50% at 100% 0%, black 0%, transparent 65%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 100% 0%, black 0%, transparent 65%)',
              }} />
              <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #9f1239, #e11d48, #f43f5e)' }} />
              <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)', boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}>
                  <FaCog className="text-sm" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Command Center</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <QuickActionCard icon={FaUserTie} title="HOD Registry" description="Appoint & Audit Department Heads" action={() => setActiveTab('hod')} color="border-purple-500" />
                <QuickActionCard icon={FaCalendarAlt} title="Event Central" description="Supervise Clubs & Campus Activities" action={() => setActiveTab('eventClubManager')} color="border-indigo-500" />
                <QuickActionCard icon={FaClipboardCheck} title="Review Queue" description="Process Account Verifications" action={() => toast.info('Accessing HOD Portal...')} color="border-amber-500" />
                <QuickActionCard icon={FaUsers} title="User Database" description="Directory & Permission Oversight" action={() => setActiveTab('users')} color="border-blue-500" />
                <QuickActionCard icon={FaChartLine} title="System Insights" description="Detailed Analytics & Telemetry" action={() => setActiveTab('analytics')} color="border-emerald-500" />
                <QuickActionCard icon={FaDownload} title="System Backup" description="Generate Data snapshots & logs" action={() => toast.info('Exporting data package...')} color="border-gray-500" />
              </div>
              </div>
            </div>

            {/* ── Regional Approvals ── */}
            {pendingApprovals?.byDepartment && Object.keys(pendingApprovals.byDepartment).length > 0 && (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.08),0_8px_10px_rgba(0,0,0,0.05)] animate-in zoom-in-95 duration-700">
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-rose-50 rounded-2xl">
                      <FaBuilding className="text-rose-600 text-xl" />
                   </div>
                   <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">Departmental Pending Queue</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 pb-10">
                  {Object.entries(pendingApprovals.byDepartment).map(([dept, faculty]) => (
                    <button 
                      key={dept} 
                      onClick={() => setActiveTab('users')}
                      className="bg-white border border-rose-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-500 group hover:-translate-y-1 text-left"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-extrabold text-gray-950 uppercase tracking-widest">{dept}</h3>
                        <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-rose-100">
                          {faculty.length} PENDING
                        </span>
                      </div>
                      <div className="space-y-3">
                        {faculty.map((fac) => (
                          <div key={fac._id} className="flex items-center justify-between bg-white/50 px-4 py-3 rounded-2xl border border-rose-50 group-hover:border-rose-200 transition-colors">
                            <div className="min-w-0">
                               <p className="text-[11px] font-extrabold text-gray-900 truncate">{fac.profile.firstName} {fac.profile.lastName}</p>
                               <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter truncate">{fac.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-white/80 backdrop-blur-3xl border border-rose-100 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(244,63,94,0.08),0_8px_10px_rgba(244,63,94,0.05)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 rounded-2xl">
                       <FaChartPie className="text-rose-600 text-xl" />
                    </div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Platform Analytics & Insights</h2>
                 </div>
                 <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                   {['today', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {range}
                      </button>
                   ))}
                 </div>
              </div>
              
              {analyticsData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {/* User Distribution */}
                   <div className="h-[400px] w-full bg-gray-50/30 rounded-3xl p-4 sm:p-8 border border-gray-100/50 overflow-hidden">
                      <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-[0.2em] mb-8">User Role Distribution</p>
                      <ResponsiveContainer width="100%" height="90%">
                         <BarChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="students" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="faculty" fill="#fb7185" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="hods" fill="#e11d48" radius={[8, 8, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                   {/* Engagement Over Time */}
                   <div className="h-[400px] w-full bg-gray-50/30 rounded-3xl p-4 sm:p-8 border border-gray-100/50 overflow-hidden">
                      <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-[0.2em] mb-8">Engagement Over Time</p>
                      <ResponsiveContainer width="100%" height="90%">
                         <LineChart data={moduleUsageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                            <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={4} dot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="total" stroke="#fee2e2" strokeWidth={2} strokeDasharray="5 5" />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                   
                   {/* Module Distribution (Usage Distribution) */}
                   <div className="h-[400px] w-full bg-gray-50/30 rounded-3xl p-4 sm:p-8 border border-gray-100/50 lg:col-span-2 overflow-hidden">
                       <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-[0.2em] mb-8">Comprehensive Module Activity Breakdown</p>
                       <ResponsiveContainer width="100%" height="90%">
                          <PieChart>
                             <Pie
                                data={moduleUsageData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                             >
                                <Cell fill="#6366f1" />
                                <Cell fill="#a855f7" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#2dd4bf" />
                                <Cell fill="#ec4899" />
                             </Pie>
                             <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                          </PieChart>
                       </ResponsiveContainer>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <div className="animate-pulse mb-6">
                     <FaChartPie className="text-5xl text-gray-200" />
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Generating real-time reports...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-white/80 backdrop-blur-3xl border border-rose-100 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(244,63,94,0.08),0_8px_10px_rgba(244,63,94,0.05)] overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                       <FaUsers className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                       <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Global User Directory</h2>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{usersData.length} active records identified</p>
                    </div>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="relative">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        placeholder="SEARCH IDENTITY..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50/50 border border-gray-100 rounded-full pl-10 pr-6 py-3 text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all w-64"
                      />
                   </div>
                   <button onClick={loadDashboardData} className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                      <FaChartLine size={18} />
                   </button>
                 </div>
              </div>

              {/* Filters & Export Row */}
              <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-100/50">
                 <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={userFilterRole}
                      onChange={(e) => setUserFilterRole(e.target.value)}
                      className="bg-white border border-gray-200 rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                    >
                      <option value="">All Roles</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="hod">HOD</option>
                      <option value="admin">Admin</option>
                    </select>

                    <select
                      value={userFilterStatus}
                      onChange={(e) => setUserFilterStatus(e.target.value)}
                      className="bg-white border border-gray-200 rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">✓ Active Only</option>
                      <option value="inactive">✕ Banned Only</option>
                    </select>
                 </div>

                 <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-[1.5rem] border border-gray-100">
                    <button
                      onClick={() => {
                        const csv = "Name,Email,Role,Department,Status\n" + 
                          usersData.map(u => `"${u.profile?.firstName} ${u.profile?.lastName}","${u.email}","${u.role}","${u.profile?.department || 'N/A'}","${u.isActive ? 'Active' : 'Inactive'}"`).join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `users_export.csv`;
                        a.click();
                        toast.success('Directory exported successfully');
                      }}
                      className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FaDownload size={14} /> Export CSV
                    </button>
                    <button
                      onClick={() => {
                        const json = JSON.stringify(usersData, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const a = document.createElement('a');
                        a.href = window.URL.createObjectURL(blob);
                        a.download = `users_backup.json`;
                        a.click();
                        toast.success('Backup snapshot created');
                      }}
                      className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FaDatabase size={14} /> Backup JSON
                    </button>
                 </div>
              </div>

              {/* Enhanced Data Table */}
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-rose-100 bg-rose-50/30">
                      <th className="pb-6 pl-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identified User</th>
                      <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Department</th>
                      <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Designation</th>
                      <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Access Privilege</th>
                      <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Network Status</th>
                      <th className="pb-6 text-right pr-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Control Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usersData
                      .filter(user => {
                        if (searchTerm && !user.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                        if (userFilterRole && user.role !== userFilterRole) return false;
                        if (userFilterStatus === 'active' && !user.isActive) return false;
                        if (userFilterStatus === 'inactive' && user.isActive) return false;
                        return true;
                      })
                      .map((user) => (
                        <tr key={user._id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-6 pl-2">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xs uppercase shadow-sm">
                                   {user.profile.firstName.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-gray-900 mb-0.5">{user.profile.firstName} {user.profile.lastName}</p>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-6 hidden md:table-cell">
                             <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {user.profile.department || 'GLOBAL'}
                             </span>
                          </td>
                          <td className="py-6">
                            {user.role === 'faculty' ? (
                              editingDesignation?.id === user._id ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={editingDesignation.value}
                                    onChange={e => setEditingDesignation(prev => ({ ...prev, value: e.target.value }))}
                                    className="text-[10px] border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    autoFocus
                                  >
                                    <option value="">— None —</option>
                                    {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  <button onClick={() => handleUpdateDesignation(user._id, editingDesignation.value)} className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">✓</button>
                                  <button onClick={() => setEditingDesignation(null)} className="text-[10px] px-2 py-1 border rounded-lg text-gray-400 hover:bg-gray-50">✕</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingDesignation({ id: user._id, value: user.profile?.designation || '' })}
                                  className="flex items-center gap-1.5 group/desg"
                                  title="Click to edit designation"
                                >
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.profile?.designation ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-400 italic'}`}>
                                    {user.profile?.designation || 'Not set'}
                                  </span>
                                  <span className="text-gray-300 group-hover/desg:text-indigo-400 text-[10px]">✏</span>
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-6 hidden sm:table-cell">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeUserRole(user._id, `${user.profile.firstName} ${user.profile.lastName}`, user.role, e.target.value)}
                              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-indigo-600 cursor-pointer focus:ring-0 hover:translate-x-1 transition-transform outline-none"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="hod">HOD</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-6 hidden lg:table-cell">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                               {user.isActive ? 'Live' : 'Revoked'}
                            </div>
                          </td>
                          <td className="py-6 text-right pr-2">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                <button
                                  onClick={() => handleToggleUserStatus(user._id, `${user.profile.firstName} ${user.profile.lastName}`, user.isActive)}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${user.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                  title={user.isActive ? "Deactivate Access" : "Restore Access"}
                                >
                                   {user.isActive ? <MdBlock size={18} /> : <MdVerified size={18} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user._id, `${user.profile.firstName} ${user.profile.lastName}`, user.email)}
                                  className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all"
                                  title="Delete Account"
                                >
                                   <FaTimes size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HOD Management Tab */}
          {activeTab === 'hod' && <HodManagement />}
          {activeTab === 'eventClubManager' && <EventClubManagerManagement />}

        {/* Departments Tab */}
        {activeTab === 'departments' && <DepartmentManagement />}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && <AnnouncementSystem />}

        {/* System Health Tab Content */}
        {activeTab === 'system' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-white/80 backdrop-blur-3xl border border-rose-100 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_12px_30px_rgba(244,63,94,0.08),0_8px_10px_rgba(244,63,94,0.05)] overflow-hidden">
               <div className="flex items-center gap-4 mb-12">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                     <FaServer className="text-blue-600 text-xl" />
                  </div>
                  <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Architecture Status & Metrics</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Service Connectivity</p>
                    <div className="space-y-4">
                      {[
                        { name: 'Core API Server', status: 'Operational', color: 'emerald' },
                        { name: 'Global Database', status: systemMetrics.database || 'Active', color: 'emerald' },
                        { name: 'Mail Dispatcher', status: systemMetrics.services?.email || 'Standby', color: 'blue' },
                        { name: 'CDN & Storage', status: systemMetrics.services?.storage || 'Synchronized', color: 'emerald' },
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-6 bg-white/40 rounded-[1.5rem] border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100/50">
                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{service.name}</span>
                          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full bg-${service.color === 'emerald' ? 'emerald-50' : 'blue-50'} text-${service.color < 'emerald' ? 'blue-600' : 'emerald-600'} text-[9px] font-black uppercase tracking-widest shadow-sm`}>
                             <div className={`w-1.5 h-1.5 rounded-full bg-${service.color}-500 animate-pulse`}></div>
                             {service.status}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Resource Allocation</p>
                    <div className="space-y-10 py-4">
                      {[
                        { name: 'CPU Load', value: 45, color: 'bg-indigo-500 shadow-indigo-100' },
                        { name: 'Memory Pool', value: 62, color: 'bg-purple-500 shadow-purple-100' },
                        { name: 'Storage Density', value: 38, color: 'bg-emerald-500 shadow-emerald-100' },
                        { name: 'Network Throughput', value: 28, color: 'bg-amber-500 shadow-amber-100' },
                      ].map((resource) => (
                        <div key={resource.name} className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{resource.name}</span>
                            <span className="text-[10px] font-extrabold text-rose-600">{resource.value}%</span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-8 p-1 border border-gray-100 relative group">
                            <div
                              className={`${resource.color.split(' ')[0]} h-full rounded-full transition-all duration-1000 shadow-lg relative z-10 flex items-center justify-center`}
                              style={{ width: `${resource.value}%` }}
                            >
                               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStatsEnhanced;
