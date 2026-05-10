import React, { useState } from 'react';
import { Building2, MapPin, BadgeCheck, CalendarDays, Link2, ClipboardList, Briefcase, ExternalLink, Send } from 'lucide-react';
import { applyInternship } from '../api/careerApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const InternshipCard = ({ item = {} }) => {
  const { user } = useAuth();
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const safe = {
    title: 'Untitled',
    company: 'Unknown',
    location: 'TBD',
    type: 'internship',
    skillsRequired: [],
    stipend: null,
    eligibility: '',
    deadline: null,
    applyLink: '#',
    description: '',
    ...item,
  };

  const deadlineText = (() => {
    try {
      return safe.deadline ? new Date(safe.deadline).toLocaleDateString() : 'N/A';
    } catch {
      return 'N/A';
    }
  })();

  return (
    <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-500 p-8 border border-gray-100 flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-bl-[5rem] -z-10 transition-all duration-700 group-hover:scale-125"></div>
      
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
            safe.type === 'job' ? 'bg-indigo-500 text-white' : 'bg-teal-500 text-white'
          } shadow-md`}>
            <Briefcase className="w-3 h-3" />
            {safe.type}
          </div>
          {safe.deadline && (
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-tighter">
              Exp: {deadlineText}
            </span>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-teal-600 transition-colors">{safe.title}</h3>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-500" />
              {safe.company}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-300" />
              {safe.location}
            </span>
          </div>
        </div>
      </div>

      {safe.description && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-5 flex-grow">{safe.description}</p>
      )}

      <div className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <BadgeCheck className="w-4 h-4 mr-2 text-emerald-500" />
            <span className="truncate font-medium">{safe.stipend ? safe.stipend : 'Unpaid'}</span>
          </div>
          <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <CalendarDays className="w-4 h-4 mr-2 text-rose-500" />
            <span className="truncate font-medium">{deadlineText}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {Array.isArray(safe.skillsRequired) && safe.skillsRequired.slice(0, 3).map((s, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-semibold text-slate-600 border border-slate-200">
                {s}
              </span>
            ))}
            {Array.isArray(safe.skillsRequired) && safe.skillsRequired.length > 3 && (
              <span className="px-2.5 py-1 bg-slate-50 rounded-md text-[11px] font-semibold text-slate-500 border border-slate-100">
                +{safe.skillsRequired.length - 3}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {user?.role === 'student' && (
              <button
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-1.5"
                onClick={() => setCoverOpen((v) => !v)}
              >
                <Send className="w-4 h-4" />
                Apply
              </button>
            )}
            <a
              href={String(safe.applyLink || '#').replace('/career/admin', '/career')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center"
              title="External Link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {user?.role === 'student' && coverOpen && (
        <div className="mt-4 p-4 border border-teal-100 rounded-xl bg-teal-50/50 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Quick Pitch</span>
            <button onClick={() => setCoverOpen(false)} className="text-teal-400 hover:text-teal-600 text-xs font-bold uppercase">Cancel</button>
          </div>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={3}
            className="w-full border border-teal-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-teal-300 resize-none"
            placeholder="Write a brief 1-2 sentence pitch to the recruiter..."
          />
          <div className="mt-3 flex justify-end">
            <button
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-bold shadow-sm transition-colors"
              onClick={async () => {
                try {
                  const res = await applyInternship(safe._id, coverLetter);
                  if (res?._id || res?.success) {
                    toast.success('Application submitted! 🎉');
                    try {
                      window.dispatchEvent(new CustomEvent('career:applied', { detail: { internshipId: safe._id } }));
                    } catch {}
                  } else {
                    toast.success('Already applied or application received.');
                  }
                } catch {
                  toast.error('Failed to submit application.');
                } finally {
                  setCoverOpen(false);
                  setCoverLetter('');
                }
              }}
            >
              Submit Pitch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipCard;
