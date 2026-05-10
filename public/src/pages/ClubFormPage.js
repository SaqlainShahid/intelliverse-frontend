import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clubsService from '../services/clubsService';

const defaultForm = {
  name: '',
  description: '',
  category: 'Technology',
  founded: '2024',
  tags: ''
};

const ClubFormPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (file) payload.image = file;
      await clubsService.create(payload);
      navigate('/events');
    } catch (err) {
      setError('Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Create Club</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
                {['Technology','Academic','Arts','Cultural','Creative','Business','Sports','Social Impact'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Founded</label>
              <input name="founded" value={form.founded} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="2024" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Club Image / Logo</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                setFile(f || null);
                if (f) {
                  const url = URL.createObjectURL(f);
                  setPreview(url);
                } else {
                  setPreview('');
                }
              }}
            />
            {preview && (
              <img src={preview} alt="preview" className="mt-3 h-32 w-full object-cover rounded" />
            )}
            <p className="text-xs text-gray-500 mt-1">You can upload an image; it will be used as both image and logo.</p>
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

export default ClubFormPage;


