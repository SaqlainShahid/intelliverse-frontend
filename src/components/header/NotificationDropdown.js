import React, { useEffect, useState } from 'react';
import { CheckCircle, Trash2, BellOff, X } from 'lucide-react';
import { getNotifications, markNotificationsRead, clearAllNotifications } from '../../services/notificationService';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';

const NotificationDropdown = ({ onClose, onUnreadChange }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getNotifications({ limit: 50 });
        setItems(res.data || []);
        onUnreadChange(res.unreadCount || 0);
      } catch {}
      setLoading(false);
    })();
  }, [onUnreadChange]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNew = (n) => { setItems((prev) => [{ ...n, isRead: false }, ...prev]); };
    s.on('notification:new', onNew);
    return () => { s.off('notification:new', onNew); };
  }, []);

  const markOne = async (id) => {
    try {
      const res = await markNotificationsRead({ ids: [id] });
      setItems((prev) => prev.map(i => i._id === id ? { ...i, isRead: true } : i));
      onUnreadChange(res.unreadCount || 0);
    } catch {}
  };

  const clearAll = async () => {
    try {
      const res = await clearAllNotifications();
      setItems((prev) => prev.map(i => ({ ...i, isRead: true })));
      onUnreadChange(res.unreadCount || 0);
    } catch {}
  };

  return (
    <div className="absolute right-0 mt-4 w-[380px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[2000] overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${isAdmin ? 'bg-rose-600 text-white' : 'bg-iv-indigo text-white'}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
             <CheckCircle className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearAll} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Mark all as read">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="p-10 text-center">
            <div className={`w-8 h-8 border-3 ${isAdmin ? 'border-rose-600' : 'border-iv-indigo'} border-t-transparent rounded-full animate-spin mx-auto mb-3`}></div>
            <p className="text-xs text-gray-500 font-medium">Syncing alerts...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff className="w-12 h-12 text-gray-100 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No new alerts found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((n) => (
              <div key={n._id} className={`px-5 py-4 transition-colors relative group ${n.isRead ? 'bg-white hover:bg-gray-50' : (isAdmin ? 'bg-rose-50/30' : 'bg-indigo-50/30')}`}>
                {!n.isRead && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAdmin ? 'bg-rose-600' : 'bg-iv-indigo'}`}></div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-gray-900 mb-1">{n.title || 'System Update'}</div>
                    {n.message && <div className="text-xs text-gray-600 leading-relaxed mb-2">{n.message}</div>}
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={() => markOne(n._id)} 
                      className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isAdmin ? 'text-rose-600 bg-rose-50' : 'text-iv-indigo bg-indigo-50'}`}
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IntelliVerse Notification Engine</p>
      </div>
    </div>
  );
};

export default NotificationDropdown;

