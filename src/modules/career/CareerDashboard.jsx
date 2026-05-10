import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InternshipList from './InternshipList';
import CareerChatbot from './CareerChatbot';
import eventsService from '../../services/eventsService';
import EventCard from '../../components/EventCard';
import { getTips, improveResume, getMyApplications } from '../api/careerApi';
import { Settings, Compass, Briefcase, FileText, Bot, Zap, ArrowRight, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';

const CareerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [tips, setTips] = useState([]);
  const [resumeRole, setResumeRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [resumeTone, setResumeTone] = useState('concise');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');
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
    setAiAdvice(null);
    try {
      const { advice } = await improveResume({ role: resumeRole, resumeText, tone: resumeTone });
      setAiAdvice(advice || null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not generate advice right now.';
      setAiAdvice({ error: msg });
    } finally {
      setLoadingAdvice(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white rounded-b-[3rem] p-8 sm:p-14 shadow-2xl overflow-hidden mb-10">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl border border-white/30">
              <Compass className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3">
                Career <span className="text-teal-200">Hub</span>
              </h1>
              <p className="text-teal-50 text-lg max-w-2xl font-medium">
                Unlock AI-powered guidance and engineer the ultimate resume.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Tabs */}
        <div className="space-y-6">
          <div className="flex p-1.5 bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-sm inline-flex">
            {[
              { id: 'explore', label: 'Explore', icon: Briefcase, color: 'teal' },
              { id: 'track', label: 'My Track', icon: FileText, color: 'blue' },
              { id: 'events', label: 'Events', icon: Compass, color: 'indigo' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? `bg-white text-${tab.color}-600 shadow-sm`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'explore' && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
                <InternshipList />
              </div>
            )}

            {activeTab === 'track' && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
                <h2 className="text-3xl font-black mb-8">Application Tracker</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myApps.map((a) => (
                    <div key={a._id} className="p-5 border border-gray-100 rounded-3xl bg-white hover:shadow-xl transition-all">
                      <h3 className="text-lg font-bold">{a?.internshipId?.title || 'Opportunity'}</h3>
                      <p className="text-sm text-gray-500">{a?.internshipId?.company || 'N/A'}</p>
                      <div className="mt-4 flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase text-teal-600 px-2 py-1 bg-teal-50 rounded-lg">{a.status}</span>
                         {a?.internshipId?.applyLink && (
                           <a href={a.internshipId.applyLink} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold hover:underline">Details →</a>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((ev) => (
                    <EventCard key={ev._id} event={ev} onJoinEvent={onJoinEvent} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Optimizer Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-[3rem] p-8 sm:p-12 shadow-2xl text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-teal-500/20 text-teal-300 rounded-2xl border border-teal-500/30"><Zap className="w-8 h-8" /></div>
                <div>
                  <h2 className="text-3xl font-black text-white">AI Resume Optimizer</h2>
                  <p className="text-slate-400">Professional analysis powered by Llama 3.1</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {tipsBasic.map((t, idx) => (
                <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">{t.category}</div>
                  <div className="text-sm font-bold text-slate-100 mb-1.5">{t.title}</div>
                  <div className="text-slate-400 text-xs">{t.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={onGetAdvice} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-300 mb-2 uppercase">Target Role</label>
                  <input
                    value={resumeRole}
                    onChange={(e) => setResumeRole(e.target.value)}
                    placeholder="e.g., Frontend Developer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none placeholder:text-slate-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-300 mb-2 uppercase">Resume Content</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={6}
                    placeholder="Paste your resume here..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none placeholder:text-slate-500 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingAdvice || !resumeRole || !resumeText}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl font-black uppercase shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  {loadingAdvice ? 'Analyzing...' : 'Generate Optimized Strategy'}
                </button>
              </div>

              <div className="min-h-[400px]">
                {aiAdvice && aiAdvice.error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
                      <Check className="w-8 h-8 rotate-45" />
                    </div>
                    <h3 className="text-xl font-bold text-rose-100 mb-2">Analysis Failed</h3>
                    <p className="text-rose-400 text-sm max-w-xs">{aiAdvice.error}</p>
                  </div>
                )}

                {aiAdvice && typeof aiAdvice === 'object' && !aiAdvice.error ? (
                  <div className="space-y-6">
                    <div className="bg-slate-950/80 border border-white/10 rounded-[2rem] p-8 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black text-teal-400 uppercase mb-2">Match Score</div>
                        <div className="text-5xl font-black">{aiAdvice.matchScore || 0}%</div>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(aiAdvice)); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="p-3 bg-white/5 rounded-xl">
                        {copied ? <Check className="text-emerald-400" /> : <Copy />}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(aiAdvice.optimizedBullets || []).slice(0,3).map((b, i) => (
                        <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                          <div className="text-[9px] font-bold text-teal-400 mb-2 uppercase">Optimization {i+1}</div>
                          <p className="text-sm font-bold">{b.improved}</p>
                          <p className="text-[10px] text-slate-500 mt-2 italic">{b.reason}</p>
                        </div>
                      ))}
                    </div>

                    {/* Conversion Tools */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-teal-500/10 border border-teal-500/20 rounded-3xl p-6">
                        <div className="text-[9px] font-black text-teal-400 uppercase mb-3 flex items-center gap-2">
                          <Compass className="w-3 h-3" /> Cover Letter Hook
                        </div>
                        <p className="text-xs font-bold text-slate-100 leading-relaxed italic">"{aiAdvice.coverLetterHook}"</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
                        <div className="text-[9px] font-black text-blue-400 uppercase mb-3 flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Outreach Strategy
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{aiAdvice.networkingStrategy}</p>
                      </div>
                    </div>

                    {/* Project Roadmap */}
                    <div className="space-y-4">
                      <div className="text-[10px] font-black text-indigo-400 uppercase">Recommended Project Roadmap</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(aiAdvice.projectRoadmap || []).map((p, i) => (
                          <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                            <h5 className="text-xs font-bold text-slate-100 mb-2">{p.title}</h5>
                            <p className="text-[10px] text-slate-400 mb-4">{p.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(p.techStack || []).map((t, ti) => (
                                <span key={ti} className="px-2 py-1 bg-indigo-500/10 rounded-md text-[8px] font-black text-indigo-300 uppercase">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-4">Immediate Action Plan</div>
                      <div className="space-y-2">
                        {(aiAdvice.actionPlan || []).map((step, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <span className="text-indigo-400 font-black">{i+1}.</span>
                            <span className="text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-[2rem] bg-slate-900/50 p-8 text-center">
                    <Bot className="w-12 h-12 text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-slate-300">Analysis Pending</h3>
                    <p className="text-sm text-slate-500">Provide your resume details to start the high-precision optimization engine.</p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerDashboard;
