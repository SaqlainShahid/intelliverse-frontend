import React, { useEffect, useState, useRef } from 'react';
import { CalendarDays, Users, QrCode, MapPin, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import eventsService from '../services/eventsService';
import EventCard from '../components/EventCard';
import clubsService from '../services/clubsService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { clubId, eventId } = useParams();
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
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);

  const isCentralApprover = !!(user && user.isEventClubManager);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, catRes, clubsRes] = await Promise.all([
        eventsService.list({ status: 'upcoming', sortBy: 'date', limit: 20 }),
        eventsService.getCategories(),
        clubsService.list({ limit: 100 })
      ]);
      setEvents(eventsRes.data || []);
      setCategories(catRes.data || []);
      const rawClubs = clubsRes.data || [];
      const processedClubs = (user?.role === 'admin' || user?.role === 'faculty')
        ? rawClubs.slice().sort((a, b) => {
            const aPending = a.approvalStatus && a.approvalStatus !== 'APPROVED';
            const bPending = b.approvalStatus && b.approvalStatus !== 'APPROVED';
            if (aPending !== bPending) return aPending ? -1 : 1;
            const aCreated = new Date(a.createdAt || 0).getTime();
            const bCreated = new Date(b.createdAt || 0).getTime();
            return bCreated - aCreated;
          })
        : rawClubs;
      setClubs(processedClubs);
    } catch (err) {
      toast.error('Unable to load events/clubs. Please try again.');
      setEvents([]);
      setCategories([]);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    if (!isCentralApprover) {
      setPendingEvents([]);
      setPendingClubs([]);
      return;
    }
    try {
      const [evRes, clRes] = await Promise.all([
        eventsService.listPending({ limit: 50 }),
        clubsService.listPending({ limit: 50 })
      ]);
      setPendingEvents(evRes.data || []);
      setPendingClubs(clRes.data || []);
    } catch {
      setPendingEvents([]);
      setPendingClubs([]);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (isCentralApprover) {
      setActiveTab('clubs');
    }
  }, [isCentralApprover]);

  useEffect(() => {
    fetchPending();
  }, [isCentralApprover]);

  useEffect(() => {
    if (location.pathname.startsWith('/clubs')) {
      setActiveTab('clubs');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (clubId && clubs.length > 0 && !showClubModal) {
      handleViewClub(clubId);
    }
  }, [clubId, clubs, showClubModal]);

  useEffect(() => {
    if (eventId && events.length > 0 && !showModal) {
      const evt = events.find(e => e._id === eventId || e.id === eventId);
      if (evt) handleView(evt);
      else handleView({ id: eventId });
    }
  }, [eventId, events, showModal]);

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
      const allowed =
        user?.role === 'admin' ||
        (creatorId && creatorId === user?._id) ||
        user?.isEventClubManager;
      if (!allowed) {
        toast.error('Not authorized to delete this event');
        return;
      }
      await eventsService.remove(id);
      toast.success('Event deleted');
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete event';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iv-bg text-iv-text relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iv-indigo/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iv-emerald/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
        </div>
        <main className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="h-36 bg-gray-200 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-iv-bg text-iv-text relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iv-indigo/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iv-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>
      {/* Google Inter Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div className="max-w-7xl mx-auto relative z-10 py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.3)] p-8 md:p-12 mb-8 border border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
             <CalendarDays size={180} className="text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="absolute w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-30 top-10 left-10 pointer-events-none"></div>
          <div className="absolute w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-30 bottom-10 right-10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Student Hub</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">Events & Clubs</h1>
              <p className="text-indigo-100 text-base max-w-xl font-normal leading-relaxed opacity-90">Discover, join, and manage campus events & student communities</p>
              {categories.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((c, i) => (
                    <span key={i} className="px-3 py-1 text-[11px] font-medium rounded-full bg-white/10 border border-white/20 text-white shadow-sm hover:bg-white/20 transition-colors">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="shrink-0 flex gap-3">
              <button onClick={() => navigate('/clubs/new')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">Create Club</button>
              {user && (
                <button onClick={() => navigate('/events/new')} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-5 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:-translate-y-1 transition-all duration-300">
                  Create Event
                </button>
              )}
            </div>
          </div>
        </div>

        {user && (user?.role === 'admin' || user?.role === 'faculty') && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={async () => {
                setRemindersMsg('');
                try {
                   const res = await eventsService.sendReminders();
                   const info = res.data || {};
                   setRemindersMsg(`Sent ${info.remindersSent || 0} reminders across ${info.eventsProcessed || 0} events`);
                } catch { setRemindersMsg('Failed to send reminders'); }
              }}
              className="bg-white/80 backdrop-blur-md border border-indigo-100 text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <CalendarDays size={18} />
              Send 24h Reminders
            </button>
            {remindersMsg && <span className="ml-3 self-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{remindersMsg}</span>}
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div role="tablist" aria-label="Events navigation" className="inline-flex p-1.5 bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm">
            {[
              { id: 'events', label: 'Events', Icon: CalendarDays, count: Array.isArray(events) ? events.length : 0, pending: isCentralApprover ? (Array.isArray(events) ? events.filter((e) => e.approvalStatus && e.approvalStatus !== 'APPROVED').length : 0) : 0 },
              { id: 'clubs', label: 'Clubs', Icon: Users, count: Array.isArray(clubs) ? clubs.length : 0, pending: isCentralApprover ? (Array.isArray(clubs) ? clubs.filter((c) => c.approvalStatus && c.approvalStatus !== 'APPROVED').length : 0) : 0 },
              { id: 'qr', label: 'QR Scanner', Icon: QrCode }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={async () => {
                    setActiveTab(tab.id);
                    if (tab.id === 'qr') {
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
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${active ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_4px_10px_rgba(99,102,241,0.3)] transform scale-[1.02]' : 'text-gray-600 hover:bg-white/80 hover:text-indigo-600'} `}
                >
                  <tab.Icon size={18} className={active ? "text-indigo-100" : ""} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
                  )}
                  {isCentralApprover && tab.pending > 0 && tab.id !== 'qr' && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-600 ring-1 ring-orange-200">{tab.pending}</span>
                  )}
                </button>
              );
            })}
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
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300"
            title="Open QR Scanner"
          >
            <QrCode size={18} />
            Quick Scan
          </button>
        </div>

        {isCentralApprover && (pendingEvents.length > 0 || pendingClubs.length > 0) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-iv-text">Pending Events</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-iv-orange/10 text-iv-orange">
                  {pendingEvents.length}
                </span>
              </div>
              {pendingEvents.length === 0 && (
                <div className="text-xs text-iv-muted">No pending event approvals</div>
              )}
              {pendingEvents.slice(0, 5).map((evt) => (
                <div key={evt._id} className="mt-2 flex items-center justify-between text-xs">
                  <div className="mr-2">
                    <div className="font-medium truncate max-w-[12rem]">{evt.title}</div>
                    <div className="text-iv-muted truncate max-w-[12rem]">
                      {(evt.createdBy?.profile?.firstName || '')} {(evt.createdBy?.profile?.lastName || '')}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-1">
                    <button
                      onClick={async () => { try { await eventsService.approve(evt._id); toast.success('Event approved'); await fetchData(); await fetchPending(); } catch { toast.error('Failed'); } }}
                      className="px-2 py-1 rounded bg-iv-emerald text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => { const reason = window.prompt('Reason for rejection'); if (reason === null) return; try { await eventsService.reject(evt._id, reason); toast.success('Event rejected'); await fetchData(); await fetchPending(); } catch { toast.error('Failed'); } }}
                      className="px-2 py-1 rounded bg-iv-orange text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-iv-text">Pending Clubs</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-iv-orange/10 text-iv-orange">
                  {pendingClubs.length}
                </span>
              </div>
              {pendingClubs.length === 0 && (
                <div className="text-xs text-iv-muted">No pending club approvals</div>
              )}
              {pendingClubs.slice(0, 5).map((club) => (
                <div key={club._id} className="mt-2 flex items-center justify-between text-xs">
                  <div className="mr-2">
                    <div className="font-medium truncate max-w-[12rem]">{club.name}</div>
                    <div className="text-iv-muted truncate max-w-[12rem]">
                      {(club.createdBy?.profile?.firstName || '')} {(club.createdBy?.profile?.lastName || '')}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-1">
                    <button
                      onClick={async () => { try { await clubsService.approve(club._id); toast.success('Club approved'); await fetchData(); await fetchPending(); } catch { toast.error('Failed'); } }}
                      className="px-2 py-1 rounded bg-iv-emerald text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => { const reason = window.prompt('Reason for rejection'); if (reason === null) return; try { await clubsService.reject(club._id, reason); toast.success('Club rejected'); await fetchData(); await fetchPending(); } catch { toast.error('Failed'); } }}
                      className="px-2 py-1 rounded bg-iv-orange text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Student Clubs</h2>
                <p className="text-[12px] text-gray-400 font-medium mt-0.5">Join a community that matches your interests</p>
              </div>
              <span className="text-[12px] font-medium text-gray-400">{clubs.length} clubs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <div key={club._id}
                  className="group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(99,102,241,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1), 0 20px 50px rgba(99,102,241,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(99,102,241,0.06)'}
                >
                  {/* Club image */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 shrink-0">
                    {club.image ? (
                      <img
                        src={club.image.startsWith('http') ? club.image : `http://localhost:5000${club.image}`}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users size={48} className="text-indigo-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    {/* Category */}
                    {club.category && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/90 text-gray-700 backdrop-blur-sm">
                          {club.category}
                        </span>
                      </div>
                    )}

                    {/* Approval badge */}
                    {club.approvalStatus && club.approvalStatus !== 'APPROVED' && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${
                          club.approvalStatus === 'PENDING_APPROVAL' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {String(club.approvalStatus).replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col gap-2">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {club.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                      {club.description || 'No description available for this club.'}
                    </p>

                    {/* Members */}
                    {club.members?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {club.members.length} member{club.members.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleViewClub(club._id)}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors"
                      >
                        View Details
                      </button>
                      {user && (
                        <button
                          onClick={() => handleJoinClub(club._id)}
                          disabled={club.approvalStatus && club.approvalStatus !== 'APPROVED'}
                          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-50"
                          style={!(club.approvalStatus && club.approvalStatus !== 'APPROVED') ? {
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                          } : { background: '#f1f5f9', color: '#94a3b8' }}
                        >
                          {club.approvalStatus && club.approvalStatus !== 'APPROVED' ? 'Pending' : 'Join Club'}
                        </button>
                      )}
                    </div>

                    {(user?.role === 'admin' || user?.isEventClubManager) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="flex gap-2">
                          <button onClick={async () => { try { await clubsService.remove(club._id); toast.success('Club deleted'); fetchData(); } catch (err) { toast.error(err?.response?.data?.message || 'Failed to delete club'); } }} className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                          <button onClick={() => { setClubAnnounce({ clubId: club._id, title: '', message: '', sending: false, result: '' }); setClubAnnounceOpen(true); }} className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">Announce</button>
                        </div>
                        {isCentralApprover && club.approvalStatus === 'PENDING_APPROVAL' && (
                          <div className="flex gap-1.5">
                            <button onClick={async () => { try { await clubsService.approve(club._id); toast.success('Approved'); await fetchData(); } catch { toast.error('Failed to approve'); } }} className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg font-bold" title="Approve">✓</button>
                            <button onClick={async () => { const reason = window.prompt('Reason for rejection'); if (reason === null) return; try { await clubsService.reject(club._id, reason); toast.success('Rejected'); await fetchData(); } catch { toast.error('Failed to reject'); } }} className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg font-bold" title="Reject">✕</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (events.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">📅</div>
            <div className="text-lg font-semibold text-iv-text mb-1">No upcoming events yet.</div>
            <div className="text-sm text-iv-muted">Check back soon!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((evt) => {
              const approvedById =
                evt && typeof evt.approvedBy === 'object' && evt.approvedBy !== null
                  ? evt.approvedBy._id
                  : evt?.approvedBy;
              const approvedByIsMe = !!(user && approvedById && approvedById === user._id);
              return (
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
                  image: evt.imageUrl || evt.image,
                  tags: evt.tags,
                  createdBy: evt.createdBy?._id || evt.createdBy,
                  waitlistCount: Array.isArray(evt.waitlist) ? evt.waitlist.length : 0,
                  approvalStatus: evt.approvalStatus,
                  rejectionReason: evt.rejectionReason,
                  approvedByIsMe
                }}
                onJoinEvent={handleJoin}
                onViewDetails={handleView}
                onEdit={(id) => navigate(`/events/${id}/edit`)}
                onDelete={handleDeleteEvent}
                canDelete={
                  user?.role === 'admin' ||
                  (evt.createdBy && (evt.createdBy._id === user?._id)) ||
                  user?.isEventClubManager
                }
                canEdit={user?.role === 'admin' || (evt.createdBy && (evt.createdBy._id === user?._id))}
                canModerate={isCentralApprover}
                onApprove={async (id) => {
                  try {
                    await eventsService.approve(id);
                    toast.success('Event approved');
                    await fetchData();
                  } catch {
                    toast.error('Failed to approve');
                  }
                }}
                onReject={async (id) => {
                  const reason = window.prompt('Reason for rejection');
                  if (reason === null) return;
                  try {
                    await eventsService.reject(id, reason);
                    toast.success('Event rejected');
                    await fetchData();
                  } catch {
                    toast.error('Failed to reject');
                  }
                }}
              />
            );})}
          </div>
        ))}
      </div>
      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-white/40 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-2xl font-extrabold truncate relative z-10 drop-shadow-md">{selectedEvent.title || 'Event Details'}</h2>
                <div className="flex items-center gap-3 relative z-10">
                  {isCentralApprover && selectedEvent.approvalStatus === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await eventsService.approve(selectedEvent._id || selectedEvent.id);
                            toast.success('Event approved');
                            await fetchData();
                            setSelectedEvent({ ...selectedEvent, approvalStatus: 'APPROVED', rejectionReason: null });
                          } catch {
                            toast.error('Failed to approve');
                          }
                        }}
                        className="text-sm px-4 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                      >Approve</button>
                      <button
                        onClick={async () => {
                          const reason = window.prompt('Reason for rejection');
                          if (reason === null) return;
                          try {
                            await eventsService.reject(selectedEvent._id || selectedEvent.id, reason);
                            toast.success('Event rejected');
                            await fetchData();
                            setSelectedEvent({ ...selectedEvent, approvalStatus: 'REJECTED', rejectionReason: reason });
                          } catch {
                            toast.error('Failed to reject');
                          }
                        }}
                        className="text-sm px-4 py-2 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
                      >Reject</button>
                    </>
                  )}
                  <button onClick={() => { setShowModal(false); if (eventId) navigate('/events'); }} className="px-5 py-2.5 rounded-xl font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all shadow-sm">Close</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5"><CalendarDays size={14} /> Date</span> 
                    <span className="font-semibold text-gray-800">{new Date(selectedEvent.date).toLocaleString()}</span>
                  </div>
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={14} /> Location</span> 
                    <span className="font-semibold text-gray-800 truncate" title={selectedEvent.location}>{selectedEvent.location}</span>
                  </div>
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Category</span> 
                    <span className="font-semibold text-gray-800">{selectedEvent.category}</span>
                  </div>
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5"><Users size={14} /> Attendees</span> 
                    <span className="font-semibold text-gray-800">
                      {Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : (typeof selectedEvent.attendees === 'number' ? selectedEvent.attendees : 0)}
                      {selectedEvent.maxAttendees ? <span className="text-gray-400 font-medium"> / {selectedEvent.maxAttendees}</span> : ''}
                    </span>
                  </div>
                  {(selectedEvent.organizer?.name || selectedEvent.createdBy) && (
                    <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1 sm:col-span-2 lg:col-span-4">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Organizer</span> 
                      <span className="font-semibold text-gray-800">{selectedEvent.organizer?.name || `${(selectedEvent.createdBy?.profile?.firstName || '')} ${(selectedEvent.createdBy?.profile?.lastName || '')}`.trim()}</span>
                    </div>
                  )}
                </div>
                {selectedEvent.description && (
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Info size={18} className="text-indigo-500"/> About Event</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
                {Array.isArray(selectedEvent.tags) && selectedEvent.tags.length > 0 && (
                  <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((t, i) => (
                        <span key={i} className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 shadow-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              {Array.isArray(selectedEvent.attendees) && selectedEvent.attendees.length > 0 && (
                <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Members registered ({selectedEvent.attendees.length})</h3>
                  <ul className="text-sm text-gray-700 max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {selectedEvent.attendees.map((a, idx) => (
                      <li key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                           {(a.user?.profile?.firstName || 'A')[0]}{(a.user?.profile?.lastName || '')[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{(a.user?.profile?.firstName || '')} {(a.user?.profile?.lastName || '')}</div>
                          <div className="text-xs text-gray-500">{a.user?.profile?.studentId ? `${a.user.profile.studentId}` : ''} {a.user?.profile?.department ? `• ${a.user.profile.department}` : ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(selectedEvent.checkIns) && selectedEvent.checkIns.length > 0 && (
                <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Activity Timeline (Check-ins)</h3>
                  <ul className="text-sm text-gray-700 max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent border-l-2 border-indigo-100 pl-4 py-2">
                    {selectedEvent.checkIns
                      .slice()
                      .sort((a,b) => new Date(b.checkedAt) - new Date(a.checkedAt))
                      .map((ci, idx) => (
                        <li key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white shadow-sm"></div>
                          <div className="font-semibold text-gray-800">{(ci.user?.profile?.firstName || '')} {(ci.user?.profile?.lastName || '')}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{new Date(ci.checkedAt).toLocaleString()}</div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">Event Statistics</h3>
                <div className="text-sm grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Attendees</div>
                    <div className="text-2xl font-black text-indigo-600">{Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : (selectedEvent.attendees || 0)}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Check-ins</div>
                    <div className="text-2xl font-black text-purple-600">{Array.isArray(selectedEvent.checkIns) ? selectedEvent.checkIns.length : (selectedEvent.checkInCount || 0)}</div>
                  </div>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'faculty' || selectedEvent.createdBy === user?._id) && (
                <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><QrCode size={18} className="text-indigo-500" /> QR Check-in</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                      className="px-5 py-2.5 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
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
                      {qrState.loading ? 'Generating...' : 'Generate New QR'}
                    </button>
                    {qrState.code && (
                      <div className="text-sm bg-indigo-50/80 px-4 py-2 rounded-xl flex-1 border border-indigo-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-900">Code: <span className="font-mono text-indigo-600 font-semibold ml-1">{qrState.code}</span></span>
                          {qrState.expiresAt && <span className="text-indigo-500/80 text-xs font-semibold mt-0.5">Expires: {qrState.expiresAt.toLocaleString()}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  {qrState.code && (
                    <div className="mt-5 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border shadow-inner">
                      <img
                        alt="QR code"
                        className="w-48 h-48 sm:w-56 sm:h-56 mix-blend-multiply"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrState.code)}`}
                      />
                      <div className="text-sm font-semibold text-gray-500 mt-4 text-center">Scan this code with the app scanner for instant check-in at the event.</div>
                    </div>
                  )}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      className="px-5 py-2.5 rounded-xl bg-white text-gray-800 font-bold border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all text-sm flex items-center justify-center"
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
                      <Users size={16} className="mr-2 text-indigo-500" />
                      Download Attendees CSV
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200/50">
                    <div className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Info size={18} className="text-indigo-500"/> Send Announcement</div>
                    <div className="text-sm text-gray-500 mb-4 flex items-center flex-wrap gap-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-semibold">Recipients: {Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : 0} attendee(s)</span>
                      <button
                        className="px-3 py-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-indigo-600 transition-colors shadow-sm"
                        onClick={() => setAnnouncePreviewOpen((o) => !o)}
                      >
                        {announcePreviewOpen ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    </div>
                    {announcePreviewOpen && Array.isArray(selectedEvent.attendees) && selectedEvent.attendees.length > 0 && (
                      <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-white/50 shadow-inner scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <ul className="text-xs text-gray-700 space-y-1.5">
                          {selectedEvent.attendees.map((a, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                              <span className="font-medium">{(a.user?.profile?.firstName || '')} {(a.user?.profile?.lastName || '')}</span> {a.user?.profile?.studentId ? <span className="text-gray-400">({a.user.profile.studentId})</span> : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        value={announceState.title}
                        onChange={(e) => setAnnounceState((s) => ({ ...s, title: e.target.value }))}
                        placeholder="Announcement Title"
                        className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 w-full"
                      />
                      <textarea
                        value={announceState.message}
                        onChange={(e) => setAnnounceState((s) => ({ ...s, message: e.target.value }))}
                        placeholder="Type your message here..."
                        rows={3}
                        className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 w-full resize-none"
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-[0_4px_10px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_15px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:shadow-none"
                        disabled={announceState.sending}
                        onClick={async () => {
                          setAnnounceState((s) => ({ ...s, sending: true, result: '' }));
                          try {
                            const res = await eventsService.announce(selectedEvent.id || selectedEvent._id, { title: announceState.title, message: announceState.message });
                            const info = res.data || {};
                            setAnnounceState((s) => ({ ...s, sending: false, result: `Sent successfully to ${info.sent || 0} attendee(s)` }));
                          } catch {
                            setAnnounceState((s) => ({ ...s, sending: false, result: 'Failed to send announcement' }));
                          }
                        }}
                      >
                        {announceState.sending ? 'Sending...' : 'Send Announcement'}
                      </button>
                      {announceState.result && <div className={`text-sm font-bold px-3 py-1.5 rounded-lg ${announceState.result.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{announceState.result}</div>}
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><QrCode size={18} className="text-indigo-500"/> Manual Check-in</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    value={checkinState.code}
                    onChange={(e) => setCheckinState((s) => ({ ...s, code: e.target.value }))}
                    placeholder="Enter manual code here..."
                    className="border border-gray-200 rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 w-full"
                  />
                  <button
                    className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm w-full sm:w-auto disabled:opacity-50 disabled:shadow-none"
                    onClick={async () => {
                      setCheckinState((s) => ({ ...s, loading: true, message: '' }));
                      try {
                        const res = await eventsService.checkIn(selectedEvent.id || selectedEvent._id, checkinState.code.trim());
                        setCheckinState((s) => ({ ...s, loading: false, message: res.message || 'Checked in successfully' }));
                        await fetchData();
                      } catch (err) {
                        setCheckinState((s) => ({ ...s, loading: false, message: 'Check-in failed. Invalid code.' }));
                      }
                    }}
                    disabled={checkinState.loading || !checkinState.code.trim()}
                  >
                    {checkinState.loading ? 'Checking...' : 'Check-in'}
                  </button>
                </div>
                {checkinState.message && <div className={`text-sm font-bold mt-3 px-3 py-2 rounded-lg ${checkinState.message.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{checkinState.message}</div>}
              </div>
              <div className="bg-white/60 border border-white/50 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">📷 Camera Scanner</h3>
                {!scannerOpen ? (
                  <button
                    className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 hover:bg-indigo-100 transition-all text-sm w-full sm:w-auto shadow-sm"
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
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-lg w-full max-w-sm bg-black aspect-video flex items-center justify-center">
                       <video ref={videoRef} className="w-full object-cover" />
                       <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-md text-sm"
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
                              setScannerMsg('QR Code captured accurately!');
                            } else {
                              setScannerMsg('No QR detected in the frame.');
                            }
                          } catch {
                            setScannerMsg('Scan processing failed. Please try again.');
                          }
                        }}
                      >
                        Capture & Decode
                      </button>
                      <button
                        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold border border-gray-200 hover:bg-gray-200 transition-all shadow-sm text-sm"
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
                            toast.error('Failed to download calendar ICS file');
                          }
                        }}
                      >
                        Add to Calendar
                      </button>
                      <button
                        className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition-all shadow-sm text-sm"
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
                        Close Camera
                      </button>
                    </div>
                    {scannerMsg && <div className={`text-sm font-bold mt-2 px-3 py-1.5 rounded-lg ${scannerMsg.includes('failed') || scannerMsg.includes('No QR') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{scannerMsg}</div>}
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
            {/* Modal Content End */}
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
              <button onClick={() => { setShowClubModal(false); if (clubId) navigate('/clubs'); }} className="text-sm px-3 py-2 rounded bg-white/20 hover:bg-white/30">Close</button>
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
// Forced Recompile
