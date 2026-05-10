import { Calendar, MapPin, Users, Info, UserPlus, Pencil } from 'lucide-react';

const EventCard = ({ event = {}, onJoinEvent, onViewDetails, onDelete, canDelete = false, onEdit, canEdit = false }) => {
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

  const formattedDate = (() => {
    try {
      return new Date(safeEvent.date).toLocaleDateString();
    } catch {
      return 'No date';
    }
  })();

  const progressPct = safeEvent.maxAttendees > 0
    ? Math.min(100, Math.round((safeEvent.attendees / safeEvent.maxAttendees) * 100))
    : 0;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
      {safeEvent.image && (
        <img
          src={getImageUrl(safeEvent.image)}
          alt={safeEvent.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {safeEvent.category || 'General'}
          </span>
          <span className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
            {formattedDate}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{safeEvent.title}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{safeEvent.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
          <div className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-red-500" /> {safeEvent.location}</div>
          <div className="flex items-center"><Users className="w-4 h-4 mr-1 text-teal-500" /> {safeEvent.attendees}{safeEvent.maxAttendees ? `/${safeEvent.maxAttendees}` : ''}</div>
        </div>

        {safeEvent.maxAttendees > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
        )}

        <div className="flex space-x-2">
          {typeof onJoinEvent === 'function' && (
            <button
              onClick={() => onJoinEvent(safeEvent.id)}
              className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transform hover:scale-105"
            >
              <span className="inline-flex items-center"><UserPlus className="w-4 h-4 mr-2" />{(safeEvent.maxAttendees > 0 && safeEvent.attendees >= safeEvent.maxAttendees) ? 'Join Waitlist' : 'Join'}</span>
            </button>
          )}
          {typeof onViewDetails === 'function' && (
            <button
              onClick={() => onViewDetails(safeEvent)}
              className="bg-gray-100/80 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-all duration-200 flex items-center backdrop-blur"
              title="Info"
            >
              <Info className="w-4 h-4 mr-2" />
              Info
            </button>
          )}
          {canEdit && typeof onEdit === 'function' && (
            <button
              onClick={() => onEdit(safeEvent.id)}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 px-3 rounded-lg transition-all duration-200 flex items-center"
              title="Edit"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
          {canDelete && typeof onDelete === 'function' && (
            <button
              onClick={() => onDelete(safeEvent.id)}
              className="bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-lg transition-all duration-200"
              title="Delete"
            >
              Delete
            </button>
          )}
        </div>
        {typeof safeEvent.waitlistCount === 'number' && safeEvent.waitlistCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">Waitlist: {safeEvent.waitlistCount}</div>
        )}
      </div>
    </div>
  );
};

export default EventCard;


