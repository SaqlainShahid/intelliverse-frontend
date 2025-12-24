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
    <div className="min-h-screen bg-iv-bg text-iv-text relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-12%] left-[-12%] w-[55%] h-[55%] bg-iv-indigo/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[-12%] w-[55%] h-[55%] bg-iv-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>
      <div className="max-w-2xl mx-auto relative z-10 py-10 px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-sm p-6">
        <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-iv-text via-iv-indigo to-iv-text mb-2">Create Club</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block text-xs text-iv-muted mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none" required />
          </div>
          <div>
            <label className="block text-xs text-iv-muted mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none" rows={4} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-iv-muted mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none">
                {['Technology','Academic','Arts','Cultural','Creative','Business','Sports','Social Impact'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-iv-muted mb-1">Founded</label>
              <input name="founded" value={form.founded} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none" placeholder="2024" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-iv-muted mb-1">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-iv-muted mb-1">Club Image / Logo</label>
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
              <img src={preview} alt="preview" className="mt-3 h-32 w-full object-cover rounded-2xl" />
            )}
            <p className="text-xs text-iv-muted mt-1">You can upload an image; it will be used as both image and logo.</p>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={loading} type="submit" className="bg-gradient-to-r from-iv-indigo to-purple-500 text-white px-4 py-2 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Submit for Approval'}
            </button>
            <button type="button" onClick={() => navigate('/events')} className="bg-white/60 border border-gray-200 hover:bg-white text-iv-text px-4 py-2 rounded-2xl">Cancel</button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default ClubFormPage;


