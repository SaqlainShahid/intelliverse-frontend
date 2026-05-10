import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import eventsService from '../services/eventsService';
import EventCard from '../components/EventCard';
import clubsService from '../services/clubsService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrState, setQrState] = useState({ loading: false, code: '', expiresAt: null });
  const [checkinState, setCheckinState] = useState({ code: '', loading: false, message: '' });
  const [feedbackState, setFeedbackState] = useState({ rating: 5, comment: '', loading: false, message: '' });
  const [aggFeedback, setAggFeedback] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef(null);
  const [scannerMsg, setScannerMsg] = useState('');
  const [remindersMsg, setRemindersMsg] = useState('');
  const [globalScannerOpen, setGlobalScannerOpen] = useState(false);
  const globalVideoRef = useRef(null);
  const [globalScannerMsg, setGlobalScannerMsg] = useState('');
  const [foundClub, setFoundClub] = useState(null);
  const [announceState, setAnnounceState] = useState({ title: '', message: '', sending: false, result: '' });
  const [clubAnnounceOpen, setClubAnnounceOpen] = useState(false);
  const [clubAnnounce, setClubAnnounce] = useState({ clubId: null, title: '', message: '', sending: false, result: '' });
  const [showClubModal, setShowClubModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [announcePreviewOpen, setAnnouncePreviewOpen] = useState(false);
  const [clubAnnouncePreviewOpen, setClubAnnouncePreviewOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, catRes, clubsRes] = await Promise.all([
        eventsService.list({ status: 'upcoming', sortBy: 'date', limit: 20 }),
        eventsService.getCategories(),
        clubsService.list({ limit: 12 })
      ]);
      setEvents(eventsRes.data || []);
      setCategories(catRes.data || []);
      setClubs(clubsRes.data || []);
    } catch (err) {
      toast.error('Unable to load events/clubs. Please try again.');
      setEvents([]);
      setCategories([]);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleJoin = async (id) => {
    try {
      const res = await eventsService.join(id);
      const info = res.data || {};
      if (info.alreadyJoined) {
        toast.success('You have already joined this event');
      } else if (info.waitlisted) {
        toast.success('Added to waitlist');
      } else {
        toast.success(res.message || 'Joined event');
      }
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('full')) {
        toast.error('Event is full');
      } else {
        toast.error('Could not join the event');
      }
    }
  };

  const handleView = (evt) => {
    setSelectedEvent(evt);
    setQrState({ loading: false, code: '', expiresAt: null });
    setCheckinState({ code: '', loading: false, message: '' });
    setFeedbackState({ rating: 5, comment: '', loading: false, message: '' });
    setAggFeedback(null);
    setShowModal(true);
    const id = evt.id || evt._id;
    const canViewAgg = user?.role === 'admin' || (evt.createdBy === user?._id);
    if (canViewAgg) {
      (async () => {
        try {
          const res = await eventsService.getFeedback(id);
          setAggFeedback(res.data || null);
        } catch {
          setAggFeedback(null);
        }
      })();
    }
    (async () => {
      try {
        const det = await eventsService.getById(id);
        if (det?.success && det.data) {
          setSelectedEvent(det.data);
        }
      } catch {}
    })();
  };

  const handleViewClub = async (clubId) => {
    try {
      const details = await clubsService.getById(clubId);
      if (details?.data) {
        setSelectedClub(details.data);
        setShowClubModal(true);
      } else {
        toast.error('Unable to load club details');
      }
    } catch {
      toast.error('Unable to load club details');
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      const res = await clubsService.join(clubId);
      toast.success(res.message || 'Joined club');
      await handleViewClub(clubId);
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('already')) {
        toast.success('You are already a member');
        await handleViewClub(clubId);
      } else {
        toast.error('Could not join club');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const evt = events.find((e) => (e._id === id) || (e.id === id));
      const creatorId = evt && (evt.createdBy?._id || evt.createdBy);
      const allowed = user?.role === 'admin' || (creatorId && creatorId === user?._id);
      if (!allowed) {
        toast.error('Not authorized to delete this event');
        return;
      }
      await eventsService.remove(id);
      toast.success('Event deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading events...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events & Clubs</h1>
          {categories.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">Categories: {categories.join(', ')}</p>
          )}
        </div>

        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <div className="mb-6 flex gap-3">
            <button onClick={() => navigate('/events/new')} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">Create Event</button>
          </div>
        )}
        {user && (
          <div className="mb-6">
            <button onClick={() => navigate('/clubs/new')} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded">Create Club</button>
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <button
                  onClick={async () => {
                    setRemindersMsg('');
                    try {
                      const res = await eventsService.sendReminders();
                      const info = res.data || {};
                      setRemindersMsg(`Sent ${info.remindersSent || 0} reminders across ${info.eventsProcessed || 0} events`);
                    } catch {
                      setRemindersMsg('Failed to send reminders');
                    }
                  }}
                  className="ml-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                  Send 24h Reminders
                </button>
              )}
              {remindersMsg && <div className="mt-2 text-sm text-gray-700">{remindersMsg}</div>}
            </div>
          )}

        <div className="mb-6">
          <div className="inline-flex bg-white rounded-lg shadow p-1">
            <button onClick={() => setActiveTab('events')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab==='events' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Events</button>
            <button onClick={() => setActiveTab('clubs')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab==='clubs' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Clubs</button>
          </div>
          <button
            onClick={async () => {
              setGlobalScannerMsg('');
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (globalVideoRef.current) {
                  globalVideoRef.current.srcObject = stream;
                  await globalVideoRef.current.play();
                }
                setGlobalScannerOpen(true);
              } catch {
                setGlobalScannerMsg('Camera access failed');
              }
            }}
            className="ml-3 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
            title="Open QR Scanner"
          >
            QR Scanner
          </button>
        </div>

        {activeTab === 'clubs' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Clubs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <div key={club._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">
                 {club.image && (
                  <img 
                    src={club.image.startsWith('http') ? club.image : `http://localhost:5000${club.image}`} 
                    alt={club.name} 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                 )}
                 <div className="p-5">
                  <div className="text-xs text-gray-500 mb-1">{club.category}</div>
                  <div className="text-lg font-semibold text-gray-900">{club.name}</div>
                  <div className="text-sm text-gray-600 line-clamp-2 mt-1">{club.description}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewClub(club._id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm"
                    >
                      View
                    </button>
                    {user && (
                      <button
                        onClick={() => handleJoinClub(club._id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-3 rounded-lg text-sm"
                        title="Join this club"
                      >
                        Join
                      </button>
                    )}
                  </div>
                  {(user?.role === 'admin') && (
                    <div className="mt-3">
                      <button
                        onClick={async () => { await clubsService.remove(club._id); fetchData(); }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => { setClubAnnounce({ clubId: club._id, title: '', message: '', sending: false, result: '' }); setClubAnnounceOpen(true); }}
                        className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
                      >
                        Announce
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (events.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">No events found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard
                key={evt._id}
                event={{
                  id: evt._id,
                  title: evt.title,
                  description: evt.description,
                  date: evt.date,
                  time: evt.time,
                  location: evt.location,
                  category: evt.category,
                  organizer: evt.organizer?.name,
                  maxAttendees: evt.maxAttendees,
                  attendees: evt.attendees?.length || 0,
                  image: evt.image,
                  tags: evt.tags,
                  createdBy: evt.createdBy?._id || evt.createdBy,
                  waitlistCount: Array.isArray(evt.waitlist) ? evt.waitlist.length : 0
                }}
                onJoinEvent={handleJoin}
                onViewDetails={handleView}
                onEdit={(id) => navigate(`/events/${id}/edit`)}
                onDelete={handleDeleteEvent}
                canDelete={user?.role === 'admin' || (evt.createdBy && (evt.createdBy._id === user?._id))}
                canEdit={user?.role === 'admin' || (evt.createdBy && (evt.createdBy._id === user?._id))}
              />
            ))}
          </div>
        ))}
      </div>
      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl h-[90vh] p-[2px] rounded-2xl bg-gradient-to-br from-white/40 via-indigo-200/40 to-purple-200/40 shadow-2xl">
            <div className="bg-white/75 backdrop-blur-xl rounded-2xl flex flex-col overflow-hidden h-full">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white flex items-center justify-between rounded-t-2xl">
                <div className="text-lg font-semibold truncate">{selectedEvent.title || 'Event'}</div>
                <button onClick={() => setShowModal(false)} className="text-sm px-3 py-2 rounded bg-white/20 hover:bg-white/30">Close</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                    <span className="font-medium mr-1">Date:</span> {new Date(selectedEvent.date).toLocaleString()}
                  </div>
                  <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                    <span className="font-medium mr-1">Location:</span> {selectedEvent.location}
                  </div>
                  <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                    <span className="font-medium mr-1">Category:</span> {selectedEvent.category}
                  </div>
                  <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                    <span className="font-medium mr-1">Attendees:</span>
                    {Array.isArray(selectedEvent.attendees)
                      ? selectedEvent.attendees.length
                      : (typeof selectedEvent.attendees === 'number' ? selectedEvent.attendees : 0)}
                    {selectedEvent.maxAttendees ? `/${selectedEvent.maxAttendees}` : ''}
                  </div>
                  {(selectedEvent.organizer?.name || selectedEvent.createdBy) && (
                    <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1 sm:col-span-2">
                      <span className="font-medium mr-1">Organizer:</span> {selectedEvent.organizer?.name || `${(selectedEvent.createdBy?.profile?.firstName || '')} ${(selectedEvent.createdBy?.profile?.lastName || '')}`.trim()}
                    </div>
                  )}
                </div>
                {selectedEvent.description && (
                  <div className="border border-white/20 rounded-2xl p-4 bg-white/60 backdrop-blur-md shadow-sm text-sm text-gray-700">
                    {selectedEvent.description}
                  </div>
                )}
                {Array.isArray(selectedEvent.tags) && selectedEvent.tags.length > 0 && (
                  <div className="border border-white/20 rounded-2xl p-4 bg-white/60 backdrop-blur-md shadow-sm">
                    <div className="font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((t, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              {Array.isArray(selectedEvent.attendees) && selectedEvent.attendees.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">Members</div>
                  <ul className="text-sm text-gray-700 max-h-64 overflow-auto">
                    {selectedEvent.attendees.map((a, idx) => (
                      <li key={idx} className="py-1">
                        {(a.user?.profile?.firstName || '')} {(a.user?.profile?.lastName || '')} {a.user?.profile?.studentId ? `(${a.user.profile.studentId})` : ''} {a.user?.profile?.department ? `- ${a.user.profile.department}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(selectedEvent.checkIns) && selectedEvent.checkIns.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">Activity Timeline</div>
                  <ul className="text-sm text-gray-700 max-h-64 overflow-auto">
                    {selectedEvent.checkIns
                      .slice()
                      .sort((a,b) => new Date(b.checkedAt) - new Date(a.checkedAt))
                      .map((ci, idx) => (
                        <li key={idx} className="py-1">
                          {new Date(ci.checkedAt).toLocaleString()} — {(ci.user?.profile?.firstName || '')} {(ci.user?.profile?.lastName || '')}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                <div className="font-medium mb-2">Stats</div>
                <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                  <div>Total Attendees: {Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : (selectedEvent.attendees || 0)}</div>
                  <div>Total Check-ins: {Array.isArray(selectedEvent.checkIns) ? selectedEvent.checkIns.length : (selectedEvent.checkInCount || 0)}</div>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'faculty' || selectedEvent.createdBy === user?._id) && (
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">QR Check-in</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      onClick={async () => {
                        setQrState((s) => ({ ...s, loading: true }));
                        try {
                          const res = await eventsService.generateQr(selectedEvent.id || selectedEvent._id, 120);
                          const { qrCode, expiresAt } = res.data || {};
                          setQrState({ loading: false, code: qrCode || '', expiresAt: expiresAt ? new Date(expiresAt) : null });
                        } catch {
                          setQrState({ loading: false, code: '', expiresAt: null });
                        }
                      }}
                      disabled={qrState.loading}
                    >
                      {qrState.loading ? 'Generating...' : 'Generate QR'}
                    </button>
                    {qrState.code && (
                      <div className="text-sm text-gray-700">
                        <div><span className="font-medium">Code:</span> <span className="font-mono">{qrState.code}</span></div>
                        {qrState.expiresAt && <div><span className="font-medium">Expires:</span> {qrState.expiresAt.toLocaleString()}</div>}
                      </div>
                    )}
                  </div>
                  {qrState.code && (
                    <div className="mt-3">
                      <img
                        alt="QR code"
                        className="w-56 h-56 border rounded-lg"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrState.code)}`}
                      />
                      <div className="text-xs text-gray-500 mt-1">Share this QR code for on-site check-ins</div>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
                      onClick={async () => {
                        try {
                          const blob = await eventsService.downloadAttendeesCsv(selectedEvent.id || selectedEvent._id);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `event-${selectedEvent.id || selectedEvent._id}-attendees.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch {
                          toast.error('Failed to download attendees CSV');
                        }
                      }}
                    >
                      Download Attendees CSV
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="font-medium mb-1">Send Announcement</div>
                    <div className="text-sm text-gray-700 mb-2">
                      Recipients: {Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : 0} attendee(s)
                      <button
                        className="ml-2 px-2 py-1 rounded border hover:bg-gray-100 text-xs"
                        onClick={() => setAnnouncePreviewOpen((o) => !o)}
                      >
                        {announcePreviewOpen ? 'Hide Preview' : 'Preview Recipients'}
                      </button>
                    </div>
                    {announcePreviewOpen && Array.isArray(selectedEvent.attendees) && selectedEvent.attendees.length > 0 && (
                      <div className="mb-2 max-h-32 overflow-auto border rounded-lg p-2 bg-gray-50">
                        <ul className="text-xs text-gray-700">
                          {selectedEvent.attendees.map((a, i) => (
                            <li key={i}>
                              {(a.user?.profile?.firstName || '')} {(a.user?.profile?.lastName || '')} {a.user?.profile?.studentId ? `(${a.user.profile.studentId})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        value={announceState.title}
                        onChange={(e) => setAnnounceState((s) => ({ ...s, title: e.target.value }))}
                        placeholder="Title"
                        className="border rounded-lg px-3 py-2"
                      />
                      <input
                        value={announceState.message}
                        onChange={(e) => setAnnounceState((s) => ({ ...s, message: e.target.value }))}
                        placeholder="Message"
                        className="border rounded-lg px-3 py-2 sm:col-span-2"
                      />
                    </div>
                    <div className="mt-2">
                      <button
                        className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                        disabled={announceState.sending}
                        onClick={async () => {
                          setAnnounceState((s) => ({ ...s, sending: true, result: '' }));
                          try {
                            const res = await eventsService.announce(selectedEvent.id || selectedEvent._id, { title: announceState.title, message: announceState.message });
                            const info = res.data || {};
                            setAnnounceState((s) => ({ ...s, sending: false, result: `Sent to ${info.sent || 0} attendee(s)` }));
                          } catch {
                            setAnnounceState((s) => ({ ...s, sending: false, result: 'Failed to send announcement' }));
                          }
                        }}
                      >
                        {announceState.sending ? 'Sending...' : 'Send'}
                      </button>
                      {announceState.result && <div className="mt-2 text-sm text-gray-700">{announceState.result}</div>}
                    </div>
                  </div>
                </div>
              )}
              <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                <div className="font-medium mb-2">Check-in</div>
                <div className="flex items-center gap-2">
                  <input
                    value={checkinState.code}
                    onChange={(e) => setCheckinState((s) => ({ ...s, code: e.target.value }))}
                    placeholder="Enter QR code"
                    className="border rounded-lg px-3 py-2 flex-1"
                  />
                  <button
                    className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    onClick={async () => {
                      setCheckinState((s) => ({ ...s, loading: true, message: '' }));
                      try {
                        const res = await eventsService.checkIn(selectedEvent.id || selectedEvent._id, checkinState.code.trim());
                        setCheckinState((s) => ({ ...s, loading: false, message: res.message || 'Checked in' }));
                        await fetchData();
                      } catch (err) {
                        setCheckinState((s) => ({ ...s, loading: false, message: 'Check-in failed' }));
                      }
                    }}
                    disabled={checkinState.loading || !checkinState.code.trim()}
                  >
                    {checkinState.loading ? 'Checking...' : 'Check-in'}
                  </button>
                </div>
                {checkinState.message && <div className="text-sm text-gray-700 mt-2">{checkinState.message}</div>}
              </div>
              <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                <div className="font-medium mb-2">Camera Scanner</div>
                {!scannerOpen ? (
                  <button
                    className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
                    onClick={async () => {
                      setScannerMsg('');
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                        if (videoRef.current) {
                          videoRef.current.srcObject = stream;
                          await videoRef.current.play();
                        }
                        setScannerOpen(true);
                      } catch {
                        setScannerMsg('Camera access failed');
                      }
                    }}
                  >
                    Open Camera Scanner
                  </button>
                ) : (
                  <div className="space-y-2">
                    <video ref={videoRef} className="w-full max-w-sm rounded-lg border" />
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={async () => {
                          try {
                            const video = videoRef.current;
                            if (!video) return;
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth || 640;
                            canvas.height = video.videoHeight || 480;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                            const form = new FormData();
                            form.append('file', blob, 'frame.png');
                            const resp = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: form });
                            const json = await resp.json();
                            const text = json?.[0]?.symbol?.[0]?.data || '';
                            if (text) {
                              setCheckinState((s) => ({ ...s, code: text }));
                              setScannerMsg('Code captured');
                            } else {
                              setScannerMsg('No QR detected');
                            }
                          } catch {
                            setScannerMsg('Scan failed');
                          }
                        }}
                      >
                        Capture & Decode
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
                        onClick={async () => {
                          try {
                            const blob = await eventsService.downloadIcs(selectedEvent.id || selectedEvent._id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedEvent.title || 'event'}.ics`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch {
                            toast.error('Failed to download calendar file');
                          }
                        }}
                      >
                        Add to Calendar
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => {
                          const v = videoRef.current;
                          const stream = v && v.srcObject;
                          if (stream && typeof stream.getTracks === 'function') {
                            stream.getTracks().forEach((t) => t.stop());
                          }
                          if (v) v.srcObject = null;
                          setScannerOpen(false);
                        }}
                      >
                        Close Scanner
                      </button>
                    </div>
                    {scannerMsg && <div className="text-sm text-gray-700">{scannerMsg}</div>}
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                <div className="font-medium mb-2">Feedback</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Rating</label>
                    <select
                      value={feedbackState.rating}
                      onChange={(e) => setFeedbackState((s) => ({ ...s, rating: Number(e.target.value) }))}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {[1,2,3,4,5].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Comment</label>
                    <input
                      value={feedbackState.comment}
                      onChange={(e) => setFeedbackState((s) => ({ ...s, comment: e.target.value }))}
                      placeholder="Your experience..."
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <button
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    disabled={feedbackState.loading}
                    onClick={async () => {
                      setFeedbackState((s) => ({ ...s, loading: true, message: '' }));
                      try {
                        const res = await eventsService.submitFeedback(selectedEvent.id || selectedEvent._id, { rating: feedbackState.rating, comment: feedbackState.comment });
                        setFeedbackState((s) => ({ ...s, loading: false, message: res.message || 'Feedback submitted' }));
                      } catch {
                        setFeedbackState((s) => ({ ...s, loading: false, message: 'Feedback failed (must be attendee)' }));
                      }
                    }}
                  >
                    {feedbackState.loading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
                {feedbackState.message && <div className="text-sm text-gray-700 mt-2">{feedbackState.message}</div>}
                {(aggFeedback && (user?.role === 'admin' || selectedEvent.createdBy === user?._id)) && (
                  <div className="mt-4 bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 shadow-sm">
                    <div className="font-medium mb-2">Feedback Summary</div>
                    <div>Average: {Number(aggFeedback.average || 0).toFixed(2)} ({aggFeedback.total} responses)</div>
                    {Array.isArray(aggFeedback.distribution) && (
                      <div className="mt-1">
                        {[1,2,3,4,5].map((r, i) => (
                          <div key={r} className="flex items-center gap-2">
                            <div className="w-12">⭐ {r}</div>
                            <div className="flex-1 bg-gray-200 h-2 rounded">
                              <div className="bg-indigo-600 h-2 rounded" style={{ width: `${aggFeedback.total ? Math.round((aggFeedback.distribution[i] / aggFeedback.total) * 100) : 0}%` }}></div>
                            </div>
                            <div className="w-10 text-right">{aggFeedback.distribution[i]}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end">
              <button onClick={() => setShowModal(false)} className="text-sm px-3 py-2 rounded border hover:bg-gray-100">Close</button>
            </div>
          </div>
          </div>
        </div>
      )}
      {globalScannerOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">QR Scanner</div>
              <button
                onClick={() => {
                  const v = globalVideoRef.current;
                  const stream = v && v.srcObject;
                  if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach((t) => t.stop());
                  }
                  if (v) v.srcObject = null;
                  setGlobalScannerOpen(false);
                  setFoundClub(null);
                }}
                className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              <video ref={globalVideoRef} className="w-full max-w-sm rounded border" />
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={async () => {
                    try {
                      const video = globalVideoRef.current;
                      if (!video) return;
                      const canvas = document.createElement('canvas');
                      canvas.width = video.videoWidth || 640;
                      canvas.height = video.videoHeight || 480;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                      const form = new FormData();
                      form.append('file', blob, 'frame.png');
                      const resp = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: form });
                      const json = await resp.json();
                      const text = json?.[0]?.symbol?.[0]?.data || '';
                      if (text) {
                        setGlobalScannerMsg('Code captured, resolving...');
                        try {
                          // Try event resolution first
                          const er = await eventsService.resolveByCode(text);
                          if (er?.success && er.data) {
                            setGlobalScannerMsg('Event found');
                            setGlobalScannerOpen(false);
                            const v = globalVideoRef.current;
                            const stream = v && v.srcObject;
                            if (stream && typeof stream.getTracks === 'function') stream.getTracks().forEach((t) => t.stop());
                            if (v) v.srcObject = null;
                            handleView(er.data);
                            return;
                          }
                        } catch {}
                        try {
                          const cr = await clubsService.resolveByCode(text);
                          if (cr?.success && cr.data) {
                            setGlobalScannerMsg('Club found');
                            setFoundClub(cr.data);
                            return;
                          }
                        } catch {}
                        setGlobalScannerMsg('No matching event or club');
                      } else {
                        setGlobalScannerMsg('No QR detected');
                      }
                    } catch {
                      setGlobalScannerMsg('Scan failed');
                    }
                  }}
                >
                  Capture & Resolve
                </button>
              </div>
              {globalScannerMsg && <div className="text-sm text-gray-700">{globalScannerMsg}</div>}
              {foundClub && (
                <div className="mt-3 border rounded p-3">
                  <div className="text-lg font-semibold">{foundClub.name}</div>
                  <div className="text-sm text-gray-600">{foundClub.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{foundClub.category}</div>
                  <div className="mt-3">
                    <button
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded"
                      onClick={async () => {
                        try {
                          await clubsService.join(foundClub._id);
                          toast.success('Joined club');
                          const details = await clubsService.getById(foundClub._id);
                          if (details?.data) {
                            setSelectedClub(details.data);
                            setShowClubModal(true);
                          }
                        } catch {
                          toast.error('Could not join club');
                        }
                      }}
                    >
                      Join Club
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-end">
              <button
                onClick={() => {
                  const v = globalVideoRef.current;
                  const stream = v && v.srcObject;
                  if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach((t) => t.stop());
                  }
                  if (v) v.srcObject = null;
                  setGlobalScannerOpen(false);
                  setFoundClub(null);
                }}
                className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {clubAnnounceOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="flex flex-col h-full w-full bg-white">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="font-semibold">Club Announcement</div>
              <button
                onClick={() => setClubAnnounceOpen(false)}
                className="text-sm px-3 py-2 rounded bg-white/20 hover:bg-white/30"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-sm text-gray-700 mb-2">
                Recipients: {Array.isArray(selectedClub?.members) ? selectedClub.members.length : 0} member(s)
                <button
                  className="ml-2 px-2 py-1 rounded border hover:bg-gray-100 text-xs"
                  onClick={() => setClubAnnouncePreviewOpen((o) => !o)}
                >
                  {clubAnnouncePreviewOpen ? 'Hide Preview' : 'Preview Recipients'}
                </button>
              </div>
              {clubAnnouncePreviewOpen && Array.isArray(selectedClub?.members) && selectedClub.members.length > 0 && (
                <div className="mb-3 max-h-32 overflow-auto border rounded-lg p-2 bg-gray-50">
                  <ul className="text-xs text-gray-700">
                    {selectedClub.members.map((m, idx) => (
                      <li key={idx}>
                        {(m.user?.profile?.firstName || '')} {(m.user?.profile?.lastName || '')} {m.role ? `— ${m.role}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={clubAnnounce.title}
                  onChange={(e) => setClubAnnounce((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Title"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  value={clubAnnounce.message}
                  onChange={(e) => setClubAnnounce((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Message"
                  className="border rounded-lg px-3 py-2 sm:col-span-2"
                />
              </div>
              <div className="mt-2">
                <button
                  className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  disabled={clubAnnounce.sending}
                  onClick={async () => {
                    setClubAnnounce((s) => ({ ...s, sending: true, result: '' }));
                    try {
                      const res = await clubsService.announce(clubAnnounce.clubId, { title: clubAnnounce.title, message: clubAnnounce.message });
                      const info = res.data || {};
                      setClubAnnounce((s) => ({ ...s, sending: false, result: `Sent to ${info.sent || 0} member(s)` }));
                    } catch {
                      setClubAnnounce((s) => ({ ...s, sending: false, result: 'Failed to send announcement' }));
                    }
                  }}
                >
                  {clubAnnounce.sending ? 'Sending...' : 'Send'}
                </button>
                {clubAnnounce.result && <div className="mt-2 text-sm text-gray-700">{clubAnnounce.result}</div>}
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end">
              <button onClick={() => setClubAnnounceOpen(false)} className="text-sm px-3 py-2 rounded border hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
      {showClubModal && selectedClub && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="flex flex-col h-full w-full bg-white">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="text-lg font-semibold truncate">{selectedClub.name}</div>
              <button onClick={() => setShowClubModal(false)} className="text-sm px-3 py-2 rounded bg-white/20 hover:bg-white/30">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium mr-1">Category:</span> {selectedClub.category}
                </div>
                <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium mr-1">Members:</span> {Array.isArray(selectedClub.members) ? selectedClub.members.length : 0}
                </div>
              </div>
              {Array.isArray(selectedClub.members) && selectedClub.members.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">Members</div>
                  <ul className="text-sm text-gray-700 max-h-64 overflow-auto">
                    {selectedClub.members.map((m, idx) => (
                      <li key={idx} className="py-1">
                        {(m.user?.profile?.firstName || '')} {(m.user?.profile?.lastName || '')} {m.role ? `— ${m.role}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(selectedClub.events) && selectedClub.events.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">Events Timeline</div>
                  <ul className="text-sm text-gray-700 max-h-64 overflow-auto">
                    {selectedClub.events
                      .slice()
                      .sort((a,b) => new Date(b.date) - new Date(a.date))
                      .map((ev, idx) => (
                        <li key={idx} className="py-1">
                          {new Date(ev.date).toLocaleDateString()} — {ev.title} {Array.isArray(ev.attendees) ? `(${ev.attendees.length} attended)` : ''}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end">
              <button onClick={() => setShowClubModal(false)} className="text-sm px-3 py-2 rounded border hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
