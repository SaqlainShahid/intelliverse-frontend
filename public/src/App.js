// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import LostAndFoundPage from './pages/LostAndFoundPage';
import AdminDashboard from './components/admin/AdminDashboard';
import './index.css';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import ClubFormPage from './pages/ClubFormPage';
import HelpDeskPage from './pages/HelpDeskPage';
import ChatWidget from './modules/chatbot/ChatWidget';
import ChatPage from './modules/p2pChat/ChatPage';
import { useAuth } from './contexts/AuthContext';
import { Home, Calendar, Users as UsersIcon, LifeBuoy, MessageSquare, Cog, Landmark } from 'lucide-react';

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
  return user ? <ChatWidget /> : null;
};

function AppShell() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const hideOn = ['/login','/signup','/forgot-password'];
  const showSidebarToggle = !hideOn.includes(location.pathname);
  const { user } = useAuth() || {};
  const shouldShowSidebar = showSidebarToggle && !!user;
  React.useEffect(() => {
    window.__APP_TOGGLE_SIDEBAR = () => setNavOpen((v) => !v);
    window.__APP_OPEN_SIDEBAR = () => setNavOpen(true);
    window.__APP_CLOSE_SIDEBAR = () => setNavOpen(false);
    return () => {
      delete window.__APP_TOGGLE_SIDEBAR;
      delete window.__APP_OPEN_SIDEBAR;
      delete window.__APP_CLOSE_SIDEBAR;
    };
  }, []);
  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {shouldShowSidebar && (
        <>
          <aside
            className={`fixed inset-y-0 left-0 w-64 z-[99] transform transition-transform duration-300 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
            id="app-sidebar"
          >
            <div className="h-full p-[2px] rounded-r-2xl bg-gradient-to-b from-indigo-200/50 via-white/10 to-purple-200/50 shadow-2xl">
              <div className="h-full bg-white/90 backdrop-blur-xl border-r border-white/40 rounded-r-2xl flex flex-col">
                <div className="px-4 py-4 border-b bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-tr-2xl">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5" />
                    <div className="font-semibold">IntelliVerse</div>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                  <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <Home className="w-4 h-4" /> Dashboard
                  </NavLink>
                  <NavLink to="/events" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <Calendar className="w-4 h-4" /> Events & Clubs
                  </NavLink>
                  <NavLink to="/lost-found" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <LifeBuoy className="w-4 h-4" /> Lost & Found
                  </NavLink>
                  <NavLink to="/helpdesk" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <MessageSquare className="w-4 h-4" /> Helpdesk
                  </NavLink>
                  <NavLink to="/chat" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <UsersIcon className="w-4 h-4" /> Chats
                  </NavLink>
                  <NavLink to="/settings" className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setNavOpen(false)}>
                    <Cog className="w-4 h-4" /> Settings
                  </NavLink>
                </nav>
              </div>
            </div>
          </aside>
          {navOpen && (
            <div
              className="fixed inset-0 z-[98] bg-black/30"
              onClick={() => setNavOpen(false)}
              aria-hidden="true"
            />
          )}
        </>
      )}
      <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Other Modules (Coming Soon placeholders) */}
            <Route
              path="/chat"
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
              path="/career"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Career Portal" />
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
              path="/settings"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Settings" />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <AuthLauncher />
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
