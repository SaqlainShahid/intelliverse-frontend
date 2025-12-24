import React, { useState } from 'react';
import { Building2, MapPin, BadgeCheck, CalendarDays, Link2, ClipboardList } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-wide text-gray-500">{safe.type}</div>
          <h3 className="text-lg font-bold text-gray-800">{safe.title}</h3>
          <div className="mt-1 flex items-center text-gray-600">
            <Building2 className="w-4 h-4 mr-1 text-indigo-600" />
            {safe.company}
          </div>
          <div className="mt-1 flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-1 text-red-600" />
            {safe.location}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:justify-end mt-2 sm:mt-0">
          <a
            href={String(safe.applyLink || '#').replace('/career/admin', '/career')}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Apply
          </a>
          {user?.role === 'student' && (
            <button
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              onClick={() => setCoverOpen((v) => !v)}
            >
              Apply via Portal
            </button>
          )}
        </div>
      </div>

      {safe.description && (
        <p className="mt-3 text-gray-700 line-clamp-3">{safe.description}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
        <div className="flex items-center">
          <BadgeCheck className="w-4 h-4 mr-1 text-teal-600" />
          {safe.stipend ? `Stipend/Salary: ${safe.stipend}` : 'Compensation: N/A'}
        </div>
        <div className="flex items-center">
          <CalendarDays className="w-4 h-4 mr-1 text-amber-600" />
          Deadline: {deadlineText}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center text-sm text-gray-700 mb-1">
          <ClipboardList className="w-4 h-4 mr-1 text-purple-600" />
          Eligibility: {safe.eligibility || 'N/A'}
        </div>
        {Array.isArray(safe.skillsRequired) && safe.skillsRequired.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">Skills:</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {safe.skillsRequired.map((s, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {user?.role === 'student' && coverOpen && (
        <div className="mt-3 p-3 border rounded-lg bg-gray-50">
          <div className="text-sm text-gray-700 mb-2">Optional cover letter</div>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Write a short note to the reviewer"
          />
          <div className="mt-2">
            <button
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              onClick={async () => {
                try {
                  const res = await applyInternship(safe._id, coverLetter);
                  if (res?._id || res?.success) {
                    toast.success('Applied');
                    try {
                      window.dispatchEvent(new CustomEvent('career:applied', { detail: { internshipId: safe._id } }));
                    } catch {}
                  } else {
                    toast.success('Already applied or request accepted');
                  }
                } catch {
                  toast.error('Apply failed');
                } finally {
                  setCoverOpen(false);
                  setCoverLetter('');
                }
              }}
            >
              Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipCard;
