import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { createForumPost } from '../../services/forumService';
import toast from 'react-hot-toast';

const CATEGORIES = ['Academic', 'Campus Life', 'Finance', 'Career', 'Events', 'Housing', 'Other'];

const CATEGORY_COLORS = {
  Academic: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Campus Life': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Finance: 'bg-amber-100 text-amber-700 border-amber-200',
  Career: 'bg-violet-100 text-violet-700 border-violet-200',
  Events: 'bg-sky-100 text-sky-700 border-sky-200',
  Housing: 'bg-rose-100 text-rose-700 border-rose-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AskQuestionModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Other');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please add a title');
    if (!body.trim()) return toast.error('Please describe your question');
    setSubmitting(true);
    try {
      const res = await createForumPost({ title: title.trim(), body: body.trim(), category });
      if (res.success) {
        toast.success('Question posted!');
        onCreated?.(res.data);
      }
    } catch {
      toast.error('Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Ask a Question</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. How do I apply for a transcript?"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    category === cat
                      ? CATEGORY_COLORS[cat]
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Describe your question in detail. The more context you give, the better the answers you'll get."
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting…' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
