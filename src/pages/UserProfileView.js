import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserCircle2, Mail, Building2, BookOpen, Star, Clock, ShieldAlert, ArrowLeft } from 'lucide-react';

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/user/users/${userId}`)
      .then((res) => {
        if (!mounted) return;
        setData(res.data?.data || null);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError('Failed to load profile');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [userId]);

  const user = data?.user;
  const restricted = !!data?.restricted;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Locating Profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'User not found or access restricted.'}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  const displayName = user?.profile?.displayName || [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') || 'Unknown User';

  // UI Theme based on role
  let themeColor = 'from-indigo-500 to-purple-600';
  let badgeColor = 'bg-indigo-100 text-indigo-700';
  if (user?.role === 'admin') { themeColor = 'from-rose-500 to-orange-500'; badgeColor = 'bg-rose-100 text-rose-700'; }
  else if (user?.role === 'faculty') { themeColor = 'from-emerald-500 to-teal-500'; badgeColor = 'bg-emerald-100 text-emerald-700'; }
  else if (user?.role === 'hod') { themeColor = 'from-slate-700 to-slate-900'; badgeColor = 'bg-slate-200 text-slate-800'; }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 bg-slate-50 font-sans">
      {/* Decorative Header Background */}
      <div className={`h-64 sm:h-80 w-full bg-gradient-to-br ${themeColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/20 rounded-full blur-3xl opacity-50" />
        
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20">
          <ArrowLeft size={18} />
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-10">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-10">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-20 sm:-mt-24 mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl relative group shrink-0">
              <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-100 flex items-center justify-center relative">
                {user?.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <UserCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left mb-2 sm:mb-6">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
                  {user?.role}
                </span>
                {user?.profile?.department && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                    <Building2 size={12} /> {user.profile.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Profile Details</h3>
                <div className="space-y-5">
                  {user?.profile?.semester && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester</div>
                        <div className="text-sm font-bold text-slate-800">{user.profile.semester}</div>
                      </div>
                    </div>
                  )}
                  {user?.email && !restricted && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</div>
                        <div className="text-sm font-bold text-slate-800 truncate">{user.email}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</div>
                      <div className="text-sm font-bold text-slate-800">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {restricted && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-3 text-orange-700 shadow-sm">
                  <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">This profile has limited visibility due to the user's privacy settings.</p>
                </div>
              )}

            </div>

            {/* Right Column - Bio & Extra */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Star size={18} className="text-amber-400" /> About
                </h3>
                <div className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                  {user?.profile?.bio ? user.profile.bio : (
                    <span className="italic text-slate-400">No biography provided by this user.</span>
                  )}
                </div>
              </div>
              
              {user?.profile?.skills && user.profile.skills.length > 0 && (
                <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="text-sm font-black text-slate-800 mb-5 uppercase tracking-wide">Skills & Interests</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {user.profile.skills.map((skill, idx) => (
                      <span key={idx} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default UserProfileView;