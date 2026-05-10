import React, { useEffect, useState } from 'react';
import { Bell, Settings, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications } from '../services/notificationService';
import { getSocket, disconnectSocket } from '../services/socket';
import NotificationDropdown from './header/NotificationDropdown';
import ProfileDropdown from './header/ProfileDropdown';
import SettingsModal from './header/SettingsModal';

const Header = () => {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotifications({ unread: true, limit: 100 });
        setUnread(res.unreadCount || 0);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const s = getSocket();
    const onNew = (n) => { setUnread((u) => u + 1); };
    s.on('notification:new', onNew);
    return () => { s.off('notification:new', onNew); };
  }, []);

  const initials = (() => {
    const dn = user?.profile?.displayName;
    if (dn) return dn.split(' ').map((w) => w[0]).slice(0,2).join('').toUpperCase();
    const fn = user?.profile?.firstName || '';
    const ln = user?.profile?.lastName || '';
    return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase();
  })();

  const roleLabel = (user?.role || '').toUpperCase();

  const handleLogout = async () => {
    try { await logout(); } catch {}
    try { disconnectSocket(); } catch {}
    window.location.assign('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => window.__APP_TOGGLE_SIDEBAR && window.__APP_TOGGLE_SIDEBAR()}
              aria-label="Toggle sidebar"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white shadow-sm hover:bg-gray-100 border border-gray-200 mr-2"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
            <div className="h-8 w-8 rounded bg-indigo-600 text-white flex items-center justify-center mr-3">IV</div>
            <h1 className="text-xl font-semibold text-gray-900">IntelliVerse</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-700" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{Math.min(unread, 99)}</span>
                )}
              </button>
              {notifOpen && (
                <NotificationDropdown onClose={() => setNotifOpen(false)} onUnreadChange={setUnread} />
              )}
            </div>
            <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-700" />
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`}</div>
                  <div className="text-xs text-indigo-600 font-semibold">{roleLabel}</div>
                </div>
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{initials}</span>
                </div>
              </button>
              {profileOpen && (
                <ProfileDropdown onClose={() => setProfileOpen(false)} onSettings={() => { setProfileOpen(false); setSettingsOpen(true); }} onLogout={handleLogout} />
              )}
            </div>
            <button onClick={handleLogout} className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100">
              <LogOut className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </header>
  );
};

export default Header;
