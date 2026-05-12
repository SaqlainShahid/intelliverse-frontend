// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import RoleDashboard from './components/RoleDashboard';
import LostAndFoundPage from './pages/LostAndFoundPage';
import './index.css';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import ClubFormPage from './pages/ClubFormPage';
import HelpDeskPage from './pages/HelpDeskPage';
import TicketOverviewPage from './pages/TicketOverviewPage';
import ChatWidget from './modules/chatbot/ChatWidget';
import CareerDashboard from './modules/career/CareerDashboard';
import CareerAdmin from './modules/career/CareerAdmin';
import AskIntelliVerse from './modules/aiChat/AskIntelliVerse';
import DepartmentDashboard from './modules/aiChat/DepartmentDashboard';
import ChatPage from './modules/p2pChat/ChatPage';
import ChatRequests from './modules/p2pChat/ChatRequests';
import UserProfileView from './pages/UserProfileView';
import GroupPage from './pages/GroupPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ClassroomHub from './modules/classroom/ClassroomHub';
import EventClubManagerManagement from './dashboards/admin/EventClubManagerManagement';
import ForumPage from './modules/forum/ForumPage';
import ForumThread from './modules/forum/ForumThread';
import CrossDeptPage from './modules/crossDept/CrossDeptPage';
import { useAuth } from './contexts/AuthContext';
import logo from './logo-intelliverse-transparent.png.png';
import { Home, Calendar, LifeBuoy, MessageSquare, Cog, Briefcase, Sparkles, Bot, HelpCircle, ShieldCheck, Network } from 'lucide-react';
import AuthModal from './components/auth/AuthModal';
import { getTheme } from './styles/theme';

// Placeholder components for other modules
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This module is coming soon!</p>
    </div>
  </div>
);

const AuthLauncher = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hideOn = ['/login','/signup','/forgot-password'];
  if (!user) return null;
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.startsWith('/chat')) return null;
  return <ChatWidget />;
};

function AppShell() {
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(window.innerWidth < 1024);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const hideOn = ['/login','/signup','/forgot-password'];
  const showSidebar = !hideOn.includes(location.pathname);
  const { user } = useAuth() || {};
  const theme = getTheme(user?.role);
  const isHod = user?.role === 'hod';

  // Returns className string for sidebar NavLinks — HOD gets black/white style
  const navCls = (isActive, collapsed = false) => {
    const base = `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`;
    if (isHod) {
      return `${base} ${isActive
        ? 'bg-slate-900 text-white font-bold shadow-lg'
        : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`;
    }
    if (user?.role === 'admin') {
      return `${base} ${isActive
        ? 'bg-rose-50 text-rose-600 font-bold shadow-sm'
        : 'text-iv-muted hover:bg-gray-50 hover:text-iv-text'}`;
    }
    return `${base} ${isActive
      ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm'
      : 'text-iv-muted hover:bg-gray-50 hover:text-iv-text'}`;
  };
  const shouldShowSidebar = showSidebar && !!user;

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setNavCollapsed(true);
      } else {
        setNavCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (user?.preferences?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.preferences?.darkMode]);

  React.useEffect(() => {
    window.__APP_TOGGLE_SIDEBAR = () => setNavCollapsed((v) => !v);
    window.__OPEN_AUTH_MODAL = (m = 'login') => { setAuthMode(m); setAuthOpen(true); };
    return () => {
      delete window.__APP_TOGGLE_SIDEBAR;
      delete window.__OPEN_AUTH_MODAL;
    };
  }, []);

  return (
    <div className="App min-h-screen bg-white overflow-x-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <div className="flex min-h-screen">
        {shouldShowSidebar && (
          <aside
            className={`fixed inset-y-0 left-0 z-[1000] bg-white/80 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${
              navCollapsed 
                ? '-translate-x-full lg:translate-x-0 lg:w-20' 
                : 'translate-x-0 w-72'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className={`flex items-center h-20 px-6 border-b border-gray-100/50 ${navCollapsed ? 'justify-center' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-xl shrink-0`}>
                    <img src={logo} alt="Intelliverse" className="w-10 h-10 object-contain" />
                  </div>
                  {!navCollapsed && (
                    <div className={`font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r tracking-tight whitespace-nowrap overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                      IntelliVerse
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {!navCollapsed && (
                  <div className="px-2 mb-2 text-xs font-semibold text-iv-muted uppercase tracking-wider animate-fade-in">
                    Menu
                  </div>
                )}
                
                {[
                  { to: "/dashboard",   icon: Home,         label: "Dashboard" },
                  { to: "/events",      icon: Calendar,     label: "Events & Clubs" },
                  { to: "/lost-found",  icon: LifeBuoy,     label: "Lost & Found" },
                  { to: "/helpdesk",    icon: HelpCircle,   label: "Helpdesk" },
                  { to: "/chat",        icon: MessageSquare,label: "Chats" },
                  { to: "/cross-dept",  icon: Network,      label: "Cross-Dept" },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => navCls(isActive, navCollapsed)}
                    title={navCollapsed ? item.label : ""}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${navCollapsed ? 'w-6 h-6' : ''}`} />
                    {!navCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                  </NavLink>
                ))}

                {/* Role Based Section */}
                {(user?.role === 'student' || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'hod') && (
                  <>
                    {!navCollapsed && (
                      <div className="px-2 mt-6 mb-2 text-xs font-semibold text-iv-muted uppercase tracking-wider animate-fade-in">
                        Career
                      </div>
                    )}
                    
                    {user.role === 'student' && (
                      <NavLink to="/career" className={({isActive}) => navCls(isActive, navCollapsed)} title={navCollapsed ? "Career Portal" : ""}>
                        <Briefcase className={`w-5 h-5 shrink-0 ${navCollapsed ? 'w-6 h-6' : ''}`} />
                        {!navCollapsed && <span className="whitespace-nowrap overflow-hidden">Career Portal</span>}
                      </NavLink>
                    )}

                    {(user.role === 'admin' || user.role === 'faculty' || user.role === 'hod') && (
                      <NavLink to="/career/admin" className={({isActive}) => navCls(isActive, navCollapsed)} title={navCollapsed ? "Career Management" : ""}>
                        <Briefcase className={`w-5 h-5 shrink-0 ${navCollapsed ? 'w-6 h-6' : ''}`} />
                        {!navCollapsed && <span className="whitespace-nowrap overflow-hidden">Career Management</span>}
                      </NavLink>
                    )}

                    {user.role === 'hod' && (
                      <NavLink to="/management" className={({isActive}) => navCls(isActive, navCollapsed)} title={navCollapsed ? "Management" : ""}>
                        <ShieldCheck className={`w-5 h-5 shrink-0 ${navCollapsed ? 'w-6 h-6' : ''}`} />
                        {!navCollapsed && <span className="whitespace-nowrap overflow-hidden">Management</span>}
                      </NavLink>
                    )}
                    
                    {(user.role === 'admin' || user.role === 'faculty' || user.role === 'hod') && (
                      <NavLink to="/department-queries" className={({isActive}) => navCls(isActive, navCollapsed)} title={navCollapsed ? "Dept. Queries" : ""}>
                        <Bot className={`w-5 h-5 shrink-0 ${navCollapsed ? 'w-6 h-6' : ''}`} />
                        {!navCollapsed && <span className="whitespace-nowrap overflow-hidden">Dept. Queries</span>}
                      </NavLink>
                    )}
                  </>
                )}
              </nav>

              {/* User Profile Mini (Collapsed Mode) */}
              {navCollapsed && (
                <div className="p-4 border-t border-gray-100/50 flex justify-center">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-iv-indigo to-purple-600 flex items-center justify-center text-white font-bold text-xs cursor-default overflow-hidden">
                      {user?.profile?.avatar ? (
                        <img src={user.profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        (user?.profile?.displayName || user?.profile?.firstName || '?').charAt(0).toUpperCase()
                      )}
                   </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <main className={`transition-all duration-300 ease-in-out bg-white min-h-screen overflow-y-auto ${shouldShowSidebar ? (navCollapsed ? 'ml-0 lg:ml-20 w-full lg:w-[calc(100%-5rem)]' : 'ml-0 lg:ml-72 w-full lg:w-[calc(100%-18rem)]') : 'w-full'}`} style={{ backgroundColor: '#ffffff' }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleDashboard />
                </ProtectedRoute>
              }
            />

            {/* Lost & Found Page */}
            <Route
              path="/lost-found"
              element={
                <ProtectedRoute>
                  <LostAndFoundPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <RoleDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/management"
              element={
                <ProtectedRoute roles={['admin', 'hod']}>
                  <div className="p-8">
                    <EventClubManagerManagement />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* AI Chat System */}
            <Route
              path="/ask-intelliverse"
              element={
                <ProtectedRoute>
                  <AskIntelliVerse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-queries"
              element={
                <ProtectedRoute roles={['admin', 'faculty', 'hod']}>
                  <DepartmentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Chat Routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/user/:userId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/requests"
              element={
                <ProtectedRoute>
                  <ChatRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute roles={['admin','faculty']}>
                  <EventFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute>
                  <EventFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/:clubId"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/new"
              element={
                <ProtectedRoute>
                  <ClubFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <HelpDeskPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career"
              element={
                <ProtectedRoute roles={['student']}>
                  <CareerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career/admin"
              element={
                <ProtectedRoute roles={['admin', 'faculty', 'hod']}>
                  <CareerAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <ChatWidget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Notifications" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <UserProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classroom/:classId"
              element={
                <ProtectedRoute>
                  <ClassroomHub />
                </ProtectedRoute>
              }
            />

            {/* Cross-Departmental Hub */}
            <Route
              path="/cross-dept"
              element={
                <ProtectedRoute>
                  <CrossDeptPage />
                </ProtectedRoute>
              }
            />

            {/* Forum */}
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <ForumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/:id"
              element={
                <ProtectedRoute>
                  <ForumThread />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </AnimatePresence>
          <AuthLauncher />
        </main>
        <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
