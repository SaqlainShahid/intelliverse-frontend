import React, { useState } from 'react';
import { Calendar, MapPin, Users, Info, UserPlus, Pencil, Loader2 } from 'lucide-react';

const EventCard = ({ event = {}, onJoinEvent, onViewDetails, onDelete, canDelete = false, onEdit, canEdit = false, canModerate = false, onApprove, onReject }) => {
  const safeEvent = {
    id: Math.random(),
    title: 'Untitled Event',
    description: 'No description available',
    date: new Date().toISOString(),
    time: '',
    location: 'TBD',
    category: 'general',
    organizer: 'Unknown',
    maxAttendees: 0,
    attendees: 0,
    image: undefined,
    tags: [],
    ...event
  };

  const attendeesCount = Array.isArray(safeEvent.attendees)
    ? safeEvent.attendees.length
    : (typeof safeEvent.attendees === 'number' ? safeEvent.attendees : 0);

  const formattedDate = (() => {
    try {
      return new Date(safeEvent.date).toLocaleDateString();
    } catch {
      return 'No date';
    }
  })();

  const progressPct = safeEvent.maxAttendees > 0
    ? Math.min(100, Math.round((attendeesCount / safeEvent.maxAttendees) * 100))
    : 0;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  const isFull = safeEvent.maxAttendees > 0 && attendeesCount >= safeEvent.maxAttendees;
  const notApproved = safeEvent.approvalStatus && safeEvent.approvalStatus !== 'APPROVED';
  const [joining, setJoining] = useState(false);
  const handleJoinClick = async () => {
    if (typeof onJoinEvent !== 'function') return;
    const maybe = onJoinEvent(safeEvent.id);
    if (maybe && typeof maybe.then === 'function') {
      try {
        setJoining(true);
        await maybe;
      } finally {
        setJoining(false);
      }
    }
  };

  const categoryColor = (() => {
    const c = String(safeEvent.category || '').toLowerCase();
    if (c.includes('tech')) return 'bg-iv-emerald/10 text-iv-emerald ring-1 ring-iv-emerald/20';
    if (c.includes('business')) return 'bg-iv-indigo/10 text-iv-indigo ring-1 ring-iv-indigo/20';
    if (c.includes('cultural') || c.includes('arts')) return 'bg-purple-100 text-purple-700 ring-1 ring-purple-200';
    return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
  })();

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      <div className="relative">
        {safeEvent.image && (
          <img
            src={getImageUrl(safeEvent.image)}
            alt={safeEvent.title}
            className="w-full h-48 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>{safeEvent.category || 'General'}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 text-iv-text ring-1 ring-white/50 inline-flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-iv-indigo" />
            {formattedDate}
          </span>
        </div>
      </div>

      <div className="p-6">
        {safeEvent.approvalStatus && (
          <div className="mb-2">
            <span title={safeEvent.rejectionReason || ''} className={`px-2 py-1 text-xs font-semibold rounded-full ${safeEvent.approvalStatus==='APPROVED' ? 'bg-iv-emerald/10 text-iv-emerald ring-1 ring-iv-emerald/20' : safeEvent.approvalStatus==='PENDING_APPROVAL' ? 'bg-iv-orange/10 text-iv-orange ring-1 ring-iv-orange/20' : 'bg-red-100 text-red-700 ring-1 ring-red-200'}`}>{String(safeEvent.approvalStatus).replace('_',' ')}</span>
          </div>
        )}
        <h3 className="text-lg font-bold text-iv-text mb-1 line-clamp-1">{safeEvent.title}</h3>
        <p className="text-iv-muted mb-3 line-clamp-2">{safeEvent.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-iv-muted mb-3">
          <div className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-iv-indigo" /> {safeEvent.location}</div>
          <div className="flex items-center"><Users className="w-4 h-4 mr-1 text-iv-indigo" /> {attendeesCount}{safeEvent.maxAttendees ? `/${safeEvent.maxAttendees}` : ''}</div>
        </div>

        {safeEvent.maxAttendees > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-iv-indigo to-purple-500 h-2 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {typeof onJoinEvent === 'function' && (
            <button
              onClick={handleJoinClick}
              disabled={(isFull || notApproved) && !joining}
              className={`w-full py-2 px-4 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-iv-indigo to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center`}
            >
              {joining ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>) : (
                <span className="inline-flex items-center"><UserPlus className="w-4 h-4 mr-2" />{notApproved ? 'Pending Approval' : (isFull ? 'Join Waitlist' : 'Join')}</span>
              )}
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            {typeof onViewDetails === 'function' && (
              <button
                onClick={() => onViewDetails(safeEvent)}
                className="w-full sm:w-auto bg-white/60 border border-gray-200 hover:bg-white text-iv-text py-2 px-4 rounded-xl transition-all duration-200 flex items-center"
                title="Info"
              >
                <Info className="w-4 h-4 mr-2 text-iv-indigo" />
                Info
              </button>
            )}
            {canEdit && typeof onEdit === 'function' && (
              <button
                onClick={() => onEdit(safeEvent.id)}
                className="w-full sm:w-auto bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 px-3 rounded-xl transition-all duration-200 flex items-center"
                title="Edit"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
            {canDelete && typeof onDelete === 'function' && (
              <button
                onClick={() => onDelete(safeEvent.id)}
                className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-xl transition-all duration-200"
                title="Delete"
              >
                Delete
              </button>
            )}
          </div>
          {canModerate && (
            <div className="flex flex-wrap gap-2">
              {safeEvent.approvalStatus !== 'APPROVED' && typeof onApprove === 'function' && (
                <button
                  onClick={() => onApprove(safeEvent.id)}
                  className="w-full sm:w-auto bg-iv-emerald hover:bg-green-600 text-white py-2 px-3 rounded-xl text-sm"
                >Approve</button>
              )}
              {typeof onReject === 'function' && (
                <button
                  onClick={() => onReject(safeEvent.id)}
                  className="w-full sm:w-auto bg-iv-orange hover:bg-orange-500 text-white py-2 px-3 rounded-xl text-sm"
                >Reject</button>
              )}
            </div>
          )}
        </div>
        {typeof safeEvent.waitlistCount === 'number' && safeEvent.waitlistCount > 0 && (
          <div className="mt-2 text-xs text-iv-muted">Waitlist: {safeEvent.waitlistCount}</div>
        )}
      </div>
    </div>
  );
};

export default EventCard;


