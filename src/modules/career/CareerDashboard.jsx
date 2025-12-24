import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InternshipList from './InternshipList';
import CareerChatbot from './CareerChatbot';
import eventsService from '../../services/eventsService';
import EventCard from '../../components/EventCard';
import { getTips, improveResume, getMyApplications } from '../api/careerApi';
import { Settings } from 'lucide-react';

const CareerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [tips, setTips] = useState([]);
  const [resumeRole, setResumeRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [myApps, setMyApps] = useState([]);
  const [resumeTone, setResumeTone] = useState('concise');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  

  useEffect(() => {
    (async () => {
      try {
        const res = await eventsService.list({ search: 'career|workshop|seminar', status: 'upcoming', limit: 6, sortBy: 'date' });
        setEvents(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setEvents([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTips({});
        setTips(Array.isArray(data) ? data : []);
      } catch {
        setTips([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    (async () => {
      try {
        const { items } = await getMyApplications({ limit: 10 });
        setMyApps(Array.isArray(items) ? items : []);
      } catch {
        setMyApps([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    const handler = async () => {
      try {
        const { items } = await getMyApplications({ limit: 10 });
        setMyApps(Array.isArray(items) ? items : []);
      } catch {}
    };
    window.addEventListener('career:applied', handler);
    return () => window.removeEventListener('career:applied', handler);
  }, []);

  const onJoinEvent = async (id) => {
    try {
      await eventsService.join(id);
      const res = await eventsService.getById(id);
      setEvents((prev) => prev.map((e) => (e._id === id ? res.data : e)));
    } catch {}
  };

  const onGetAdvice = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!resumeRole || !resumeText) return;
    setLoadingAdvice(true);
    try {
      const { advice } = await improveResume({ role: resumeRole, resumeText, tone: resumeTone });
      setAiAdvice(advice || '');
    } catch {
      setAiAdvice('Could not generate advice right now.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const onCopyAdvice = async () => {
    try {
      await navigator.clipboard.writeText(aiAdvice || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  
  

  const tipsBasic = (tips.length ? tips : [
    { category: 'resume', title: 'Use strong action verbs', content: 'Start bullets with design, built, optimized, reduced, implemented. Quantify impact.' },
    { category: 'interview', title: 'Practice structured answers', content: 'Use STAR: Situation, Task, Action, Result.' },
    { category: 'roadmap', title: 'Frontend roadmap', content: 'HTML, CSS, JS, React, state, testing, accessibility.' },
    { category: 'career', title: 'Portfolio basics', content: '1-page resume, GitHub, short projects with live demos.' },
  ]).slice(0,4);

  if (!user || user.role !== 'student') {
    return (
      <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl p-4">
        Only logged-in students can access the Career Guidance Portal.
      </div>
    );
  }

  const tipsToRender = tipsBasic;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">AI-Based Internship & Career Guidance Portal</h1>
        <p className="mt-1 text-white/90">Discover roles, get tailored career advice, and prepare your resume.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Internships & Jobs</h2>
            <InternshipList />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">My Applications</h2>
            {myApps.length === 0 ? (
              <div className="text-gray-600">You have not applied to any opportunities yet.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {myApps.map((a) => {
                  const type = a?.internshipId?.type || 'internship';
                  const title = a?.internshipId?.title || 'Opportunity';
                  const company = a?.internshipId?.company || 'N/A';
                  const location = a?.internshipId?.location || 'N/A';
                  const status = a?.status || 'applied';
                  const link = a?.internshipId?.applyLink || '';
                  return (
                    <div key={a._id} className="p-3 border rounded-xl bg-white shadow-sm hover:shadow-md transition shadow-indigo-50/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-500">{type}</div>
                          <div className="text-sm font-semibold text-gray-800 truncate">{title}</div>
                          <div className="text-[12px] text-gray-700">{company} • {location}</div>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] capitalize">
                          {status}
                        </span>
                      </div>
                      {link && (
                        <div className="mt-2">
                          <a
                            href={String(link).replace('/career/admin', '/career')}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[12px] text-indigo-600 hover:text-indigo-800"
                          >
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Upcoming Career Events</h2>
            {events.length === 0 ? (
              <div className="text-gray-600">No upcoming events found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((ev) => (
                  <EventCard key={ev._id} event={ev} onJoinEvent={onJoinEvent} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">AI Career Guidance Chatbot</h2>
            <div className="h-[380px]">
              <CareerChatbot compact />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Resume & Career Tips</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {tipsToRender.map((t, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">{t.category}</div>
                  <div className="text-sm font-semibold text-gray-800">{t.title}</div>
                  <div className="text-gray-700 text-xs">{t.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={onGetAdvice} className="mt-2 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Target Role</label>
                <input
                  value={resumeRole}
                  onChange={(e) => setResumeRole(e.target.value)}
                  placeholder="e.g., Frontend Developer"
                  className="w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Paste Resume Text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={4}
                  placeholder="Paste your resume or summary here..."
                  className="w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="submit"
                  className={`px-3 py-2 rounded-lg text-sm ${loadingAdvice || !resumeRole || !resumeText ? 'bg-indigo-600/50 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  disabled={loadingAdvice || !resumeRole || !resumeText}
                >
                  {loadingAdvice ? 'Generating...' : 'Get Advice'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((s) => !s)}
                  className="p-2 rounded-md border bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                  aria-label="Advanced"
                  title={showAdvanced ? 'Hide Advanced' : 'Advanced'}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              {showAdvanced && (
                <div className="mt-2 flex items-center gap-2 justify-end">
                  <span className="text-xs text-gray-600">Tone</span>
                  <select
                    value={resumeTone}
                    onChange={(e) => setResumeTone(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="concise">Concise</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>
              )}
            </form>

            {aiAdvice && (
              <div className="mt-3 relative">
                <button
                  type="button"
                  onClick={onCopyAdvice}
                  className="absolute top-2 right-2 px-2 py-1 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 whitespace-pre-wrap text-gray-800 text-sm max-h-[220px] overflow-y-auto">
                  {aiAdvice}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerDashboard;
