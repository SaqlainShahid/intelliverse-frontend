import React, { useEffect, useState } from 'react';
import { CheckCircle, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationsRead, clearAllNotifications } from '../../services/notificationService';
import { getSocket } from '../../services/socket';

const NotificationDropdown = ({ onClose, onUnreadChange }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-medium">Notifications</div>
        <div className="flex items-center gap-2">
          <button onClick={clearAll} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Clear</button>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">Close</button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        {loading ? (
          <div className="p-3 text-sm text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-gray-600">No notifications</div>
        ) : (
          items.map((n) => (
            <div key={n._id} className={`px-3 py-2 border-b ${n.isRead ? 'bg-white' : 'bg-indigo-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{n.title || 'Notification'}</div>
                  {n.message && <div className="text-xs text-gray-600 mt-0.5">{n.message}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && (
                  <button onClick={() => markOne(n._id)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Read</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;

