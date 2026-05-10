import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventsService from '../services/eventsService';
import clubsService from '../services/clubsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const defaultForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: 'Technology',
  maxAttendees: 50,
  tags: '',
};

const EventFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isEdit) {
          const res = await eventsService.getById(id);
          const evt = res.data;
          const creatorId = (evt.createdBy && (evt.createdBy._id || evt.createdBy)) || null;
          const allowed = user?.role === 'admin' || (creatorId && creatorId === user?._id);
          if (!allowed) {
            toast.error('Not authorized to edit this event');
            navigate('/events');
            return;
          }
          setForm({
            title: evt.title || '',
            description: evt.description || '',
            date: evt.date ? new Date(evt.date).toISOString().slice(0, 10) : '',
            time: evt.time || '09:00 AM',
            location: evt.location || '',
            category: evt.category || 'Technology',
            maxAttendees: evt.maxAttendees || 50,
            tags: (evt.tags || []).join(',')
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'maxAttendees' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      };
      if (imageFile) payload.image = imageFile;
      // Organizer removed; no validation
      if (isEdit) {
        await eventsService.update(id, payload);
      } else {
        await eventsService.create(payload);
      }
      navigate('/events');
    } catch (err) {
      setError('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Time (e.g., 09:00 AM)</label>
              <input name="time" value={form.time} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="09:00 AM" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
                {['Technology','Cultural','Business','Sports','Arts','Environment','Academic','Social'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Max Attendees</label>
              <input type="number" min={1} name="maxAttendees" value={form.maxAttendees} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
          {/* Organizer removed */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Event Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                setImageFile(f || null);
                setImagePreview(f ? URL.createObjectURL(f) : '');
              }}
            />
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="mt-3 h-36 w-full object-cover rounded" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button disabled={loading} type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => navigate('/events')} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormPage;
