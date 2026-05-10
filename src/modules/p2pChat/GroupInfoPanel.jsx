import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getChatDetails, updateChatSettings, searchUsers, updateGroupMembers } from '../../services/chatService';
import api from '../../services/api';
import { Volume2, VolumeX } from 'lucide-react';

export default function GroupInfoPanel({ chat, mutedUserIds, onMuteToggle }) {
  const name = chat?.group?.name || chat?.name;
  const desc = chat?.group?.description || chat?.description;
  const count = chat?.group?.memberCount || (chat?.participants?.length || 0);
  const { user } = useAuth();
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [roleMentionsEnabled, setRoleMentionsEnabled] = useState(true);
  const [participantsLocal, setParticipantsLocal] = useState([]);
  const [category, setCategory] = useState(chat?.category || null);
  const [clubId, setClubId] = useState(chat?.clubId || null);
  const [eventId, setEventId] = useState(chat?.eventId || null);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getChatDetails(chat._id);
        if (res?.success && res.data?.settings) {
          setAnnouncementOnly(!!res.data.settings.announcementOnly);
          setRoleMentionsEnabled(res.data.settings.roleMentionsEnabled !== false);
        }
        if (res?.success && Array.isArray(res.data?.participants)) {
          setParticipantsLocal(res.data.participants);
        }
        if (res?.success) {
          setCategory(res.data?.category || category);
          setClubId(res.data?.clubId || clubId);
          setEventId(res.data?.eventId || eventId);
        }
      } catch {}
    })();
  }, [chat?._id]);

  const participants = participantsLocal.length ? participantsLocal : (chat?.participants || []);

  return (
    <div className="p-4 border-t bg-white">
      <div className="text-sm text-gray-700">
        <div className="font-semibold text-gray-900">{name}</div>
        {desc && <div className="mt-1 text-gray-600">{desc}</div>}
        <div className="mt-2 text-gray-500">Members: {count}</div>
        {category && (
          <div className="mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${category === 'event' ? 'border-purple-300 text-purple-700 bg-purple-50' : category === 'club' ? 'border-iv-emerald/40 text-iv-emerald bg-iv-emerald/10' : 'border-iv-border text-iv-muted bg-white/40'}`}>
              {category === 'event' ? 'Event Group' : category === 'club' ? 'Club Group' : 'Group'}
            </span>
          </div>
        )}
        <div className="mt-3">
          <a href={`/groups/${chat._id}`} className="text-xs px-3 py-1.5 inline-flex rounded-lg border border-iv-border hover:bg-iv-indigo/10 text-iv-text font-medium transition-colors">Open Group Page</a>
          {eventId && (
            <a href={`/events`} className="ml-2 text-xs px-3 py-1.5 inline-flex rounded-lg border border-purple-300 hover:bg-purple-50 text-purple-700 font-medium transition-colors">View Event</a>
          )}
          {clubId && !eventId && (
            <a href={`/events`} className="ml-2 text-xs px-3 py-1.5 inline-flex rounded-lg border border-iv-emerald/40 hover:bg-iv-emerald/10 text-iv-emerald font-medium transition-colors">View Club</a>
          )}
        </div>
        
        {participants.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</div>
            {participants.map((p) => {
              const pid = typeof p === 'object' ? p._id : p;
              const isMe = String(pid) === String(user?._id);
              const pName = typeof p === 'object' ? `${p.profile?.firstName || ''} ${p.profile?.lastName || ''}` : 'User';
              const isMuted = mutedUserIds && mutedUserIds.has(String(pid));

              if (isMe) return null; // Don't show mute button for self

              return (
                <div key={String(pid)} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {p.profile?.avatar ? (
                        <img onClick={() => (window.location.href = `/profile/${pid}`)} src={p.profile.avatar} alt="" className="w-6 h-6 rounded-full object-cover cursor-pointer" />
                    ) : (
                        <div onClick={() => (window.location.href = `/profile/${pid}`)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 cursor-pointer">
                            {pName.charAt(0)}
                        </div>
                    )}
                    <button className="truncate text-gray-700 hover:underline" onClick={() => (window.location.href = `/profile/${pid}`)}>{pName}</button>
                  </div>
                  <div className="flex items-center gap-2">
                    {onMuteToggle && (
                      <button
                        onClick={() => onMuteToggle(String(pid))}
                        className={`p-1.5 rounded-md transition-colors ${isMuted ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title={isMuted ? "Unmute user" : "Mute user"}
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    )}
                    {((chat.admins || []).some(a => (a._id || a) === (user?._id || '')) || false) && !isMe && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/p2p/chats/${chat._id}/admins`, { action: (chat.admins || []).some(a => (a._id || a) === pid) ? 'demote' : 'promote', userId: pid });
                              const det = await getChatDetails(chat._id);
                              if (det?.success) chat.admins = det.data.admins || chat.admins;
                            } catch {}
                          }}
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
                        >{(chat.admins || []).some(a => (a._id || a) === pid) ? 'Demote' : 'Promote'}</button>
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/p2p/chats/${chat._id}/members`, { action: 'remove', userId: pid });
                              const det = await getChatDetails(chat._id);
                              if (det?.success) chat.participants = det.data.participants || chat.participants;
                            } catch {}
                          }}
                          className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50"
                        >Remove</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {((chat.admins || []).some(a => (a._id || a) === (user?._id || '')) || false) && (
          <div className="mt-4 pt-4 border-t relative">
            <div className="flex items-center gap-2">
              <input
                value={searchText}
                onChange={async (e) => {
                  const v = e.target.value;
                  setSearchText(v);
                  if (v.length >= 2) {
                    try {
                      const res = await searchUsers(v, 8);
                      setResults(res?.data || []);
                      setShowResults(true);
                    } catch {
                      setResults([]);
                      setShowResults(false);
                    }
                  } else {
                    setResults([]);
                    setShowResults(false);
                  }
                }}
                placeholder="Search users"
                className="flex-1 px-3 py-2 border border-iv-border rounded-xl text-sm"
              />
            </div>
            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-iv-border rounded-xl shadow-lg z-50">
                {results.map((u) => (
                  <button
                    key={u._id}
                    onClick={async () => {
                      try {
                        await updateGroupMembers(chat._id, 'add', u._id);
                        setSearchText('');
                        setResults([]);
                        setShowResults(false);
                        const det = await getChatDetails(chat._id);
                        if (det?.success && Array.isArray(det.data?.participants)) setParticipantsLocal(det.data.participants);
                      } catch {}
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-iv-indigo/10"
                  >
                    {`${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {((chat.admins || []).some(a => (a._id || a) === (user?._id || '')) || false) && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
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
        {((chat.admins || []).some(a => (a._id || a) === (user?._id || '')) || false) && (
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
