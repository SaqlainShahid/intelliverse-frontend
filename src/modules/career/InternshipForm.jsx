import React, { useEffect, useState } from 'react';
import { adminCreateInternship, adminUpdateInternship } from '../api/careerApi';

const empty = {
  title: '',
  company: '',
  location: '',
  type: 'internship',
  skillsRequired: '',
  stipend: '',
  eligibility: '',
  deadline: '',
  applyLink: '',
  description: '',
};

export default function InternshipForm({ onSaved, editing }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (editing) {
      const pre = {
        title: editing.title || '',
        company: editing.company || '',
        location: editing.location || '',
        type: editing.type || 'internship',
        skillsRequired: Array.isArray(editing.skillsRequired) ? editing.skillsRequired.join(', ') : '',
        stipend: editing.stipend || '',
        eligibility: editing.eligibility || '',
        deadline: editing.deadline ? editing.deadline.substring(0,10) : '',
        applyLink: editing.applyLink || '',
        description: editing.description || '',
      };
      setForm(pre);
    } else {
      setForm(empty);
    }
  }, [editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        skillsRequired: form.skillsRequired,
      };
      let result;
      if (editing?._id) {
        result = await adminUpdateInternship(editing._id, payload);
      } else {
        result = await adminCreateInternship(payload);
      }
      if (onSaved) onSaved(result);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Title" className="border rounded-lg px-3 py-2" required />
        <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Company" className="border rounded-lg px-3 py-2" required />
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Location" className="border rounded-lg px-3 py-2" required />
        <select value={form.type} onChange={(e) => set('type', e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="internship">Internship</option>
          <option value="job">Job</option>
        </select>
        <input value={form.skillsRequired} onChange={(e) => set('skillsRequired', e.target.value)} placeholder="Skills (comma separated)" className="border rounded-lg px-3 py-2" />
        <input value={form.stipend} onChange={(e) => set('stipend', e.target.value)} placeholder="Stipend/Salary" className="border rounded-lg px-3 py-2" />
        <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="border rounded-lg px-3 py-2" />
        <input value={form.applyLink} onChange={(e) => set('applyLink', e.target.value)} placeholder="Apply Link" className="border rounded-lg px-3 py-2" required />
      </div>
      <textarea value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} placeholder="Eligibility" className="border rounded-lg px-3 py-2 w-full" rows={3} />
      <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description" className="border rounded-lg px-3 py-2 w-full" rows={4} />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        {saving ? 'Saving...' : (editing?._id ? 'Update' : 'Create')}
      </button>
    </form>
  );
}

