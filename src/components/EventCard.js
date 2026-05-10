import React, { useState } from 'react';
import { Calendar, MapPin, Users, Info, UserPlus, Pencil, Loader2, Clock } from 'lucide-react';

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
      return new Date(safeEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'No date'; }
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
      try { setJoining(true); await maybe; } finally { setJoining(false); }
    }
  };

  // Premium category palette
  const categoryMap = {
    tech: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
    business: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    cultural: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
    arts: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
    sports: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  };
  const catKey = Object.keys(categoryMap).find(k => String(safeEvent.category || '').toLowerCase().includes(k));
  const cat = categoryMap[catKey] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(99,102,241,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1), 0 20px 50px rgba(99,102,241,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(99,102,241,0.06)'}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 shrink-0">
        {safeEvent.image ? (
          <img
            src={getImageUrl(safeEvent.image)}
            alt={safeEvent.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-14 h-14 text-indigo-200" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border ${cat.bg} ${cat.text} ${cat.border} backdrop-blur-sm`}>
            {safeEvent.category || 'General'}
          </span>
        </div>

        {/* Date badge */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 leading-none uppercase tracking-wide">
            {new Date(safeEvent.date).toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div className="text-lg font-bold text-gray-900 leading-tight">
            {new Date(safeEvent.date).getDate()}
          </div>
        </div>

        {/* Approval status */}
        {safeEvent.approvalStatus && safeEvent.approvalStatus !== 'APPROVED' && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${
              safeEvent.approvalStatus === 'PENDING_APPROVAL' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {String(safeEvent.approvalStatus).replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Organizer */}
        {safeEvent.organizer && (
          <p className="text-[11px] font-medium text-indigo-500 uppercase tracking-widest">
            {safeEvent.organizer}
          </p>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {safeEvent.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {safeEvent.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-col gap-1.5 text-[12px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{safeEvent.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{formattedDate}{safeEvent.time ? ` · ${safeEvent.time}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{attendeesCount}{safeEvent.maxAttendees ? ` / ${safeEvent.maxAttendees} spots` : ' attendees'}</span>
          </div>
        </div>

        {/* Capacity bar */}
        {safeEvent.maxAttendees > 0 && (
          <div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPct >= 90 ? 'bg-rose-500' : progressPct >= 60 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{progressPct}% capacity</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-1 pt-3 border-t border-gray-50">
          {typeof onJoinEvent === 'function' && (
            <button
              onClick={handleJoinClick}
              disabled={(isFull || notApproved) && !joining}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              style={!((isFull || notApproved) && !joining) ? {
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              } : { background: '#f1f5f9', color: '#94a3b8' }}
            >
              {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : (
                <><UserPlus className="w-4 h-4" />{notApproved ? 'Pending Approval' : isFull ? 'Join Waitlist' : 'Join Event'}</>
              )}
            </button>
          )}

          <div className="flex gap-2">
            {typeof onViewDetails === 'function' && (
              <button
                onClick={() => onViewDetails(safeEvent)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" /> Details
              </button>
            )}
            {canEdit && typeof onEdit === 'function' && (
              <button
                onClick={() => onEdit(safeEvent.id)}
                className="py-2.5 px-3.5 rounded-xl text-[12px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && typeof onDelete === 'function' && (
              <button
                onClick={() => onDelete(safeEvent.id)}
                className="py-2.5 px-3.5 rounded-xl text-[12px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
                title="Delete"
              >
                Delete
              </button>
            )}
          </div>

          {canModerate && safeEvent.approvalStatus === 'PENDING_APPROVAL' && (
            <div className="flex gap-2">
              {typeof onApprove === 'function' && (
                <button onClick={() => onApprove(safeEvent.id)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-colors">
                  Approve
                </button>
              )}
              {typeof onReject === 'function' && (
                <button onClick={() => onReject(safeEvent.id)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 transition-colors">
                  Reject
                </button>
              )}
            </div>
          )}
        </div>

        {typeof safeEvent.waitlistCount === 'number' && safeEvent.waitlistCount > 0 && (
          <p className="text-[11px] text-gray-400 font-medium">{safeEvent.waitlistCount} on waitlist</p>
        )}
      </div>
    </div>
  );
};

export default EventCard;
