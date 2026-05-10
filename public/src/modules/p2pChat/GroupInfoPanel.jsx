import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getChatDetails, updateChatSettings } from '../../services/chatService';

export default function GroupInfoPanel({ chat }) {
  const name = chat?.group?.name || chat?.name;
  const desc = chat?.group?.description || chat?.description;
  const count = chat?.group?.memberCount || (chat?.participants?.length || 0);
  const { user } = useAuth();
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [roleMentionsEnabled, setRoleMentionsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getChatDetails(chat._id);
        if (res?.success && res.data?.settings) {
          setAnnouncementOnly(!!res.data.settings.announcementOnly);
          setRoleMentionsEnabled(res.data.settings.roleMentionsEnabled !== false);
        }
      } catch {}
    })();
  }, [chat?._id]);

  return (
    <div className="p-4 border-t bg-white">
      <div className="text-sm text-gray-700">
        <div className="font-semibold text-gray-900">{name}</div>
        {desc && <div className="mt-1 text-gray-600">{desc}</div>}
        <div className="mt-2 text-gray-500">Members: {count}</div>
        {user?.role === 'admin' && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-gray-700">Announcement-only</label>
            <input
              type="checkbox"
              checked={announcementOnly}
              onChange={async (e) => {
                const val = !!e.target.checked;
                setAnnouncementOnly(val);
                try {
                  const res = await updateChatSettings(chat._id, { announcementOnly: val });
                  if (res?.success) {
                    const evt = new CustomEvent('chat:settings', { detail: { chatId: chat._id, settings: res.data.settings } });
                    window.dispatchEvent(evt);
                  }
                } catch {}
              }}
            />
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-gray-700">Role mentions</label>
            <input
              type="checkbox"
              checked={roleMentionsEnabled}
              onChange={async (e) => {
                const val = !!e.target.checked;
                setRoleMentionsEnabled(val);
                try {
                  const res = await updateChatSettings(chat._id, { roleMentionsEnabled: val });
                  if (res?.success) {
                    const evt = new CustomEvent('chat:settings', { detail: { chatId: chat._id, settings: res.data.settings } });
                    window.dispatchEvent(evt);
                  }
                } catch {}
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
