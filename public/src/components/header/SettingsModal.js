import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SettingsModal = ({ onClose }) => {
  const { user, checkAuthStatus } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.profile?.displayName || '');
    setAvatar(user?.profile?.avatar || '');
    setNotificationsEnabled(!!(user?.preferences?.notificationsEnabled ?? true));
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/user/settings', { displayName, avatar, notificationsEnabled });
      await checkAuthStatus();
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Settings</div>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded border hover:bg-gray-50">Close</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Profile Picture URL</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input id="notif-toggle" type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
            <label htmlFor="notif-toggle" className="text-sm text-gray-700">Enable notifications</label>
          </div>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-2 rounded border hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="text-sm px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

