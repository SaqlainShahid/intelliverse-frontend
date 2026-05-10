import React, { useEffect, useState } from 'react';
import { Loader2, Users, MessageSquare, BarChart2, RefreshCw, CheckCircle2, BookOpen, Handshake } from 'lucide-react';
import { getAnalyticsOverview } from '../../services/chatService';
import toast from 'react-hot-toast';

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo:  'bg-indigo-50  border-indigo-100  text-indigo-700',
    violet:  'bg-violet-50  border-violet-100  text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50   border-amber-100   text-amber-700',
    rose:    'bg-rose-50    border-rose-100    text-rose-700',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
      {sub && <p className="text-[11px] opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-indigo-500', right }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-600 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {right !== undefined
        ? <span className="text-xs font-bold text-slate-500 w-16 text-right flex-shrink-0">{right}</span>
        : <span className="text-xs font-bold text-slate-500 w-8 text-right flex-shrink-0">{value}</span>
      }
    </div>
  );
}

export default function AnalyticsTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsOverview();
      if (res?.success) setData(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>;
  if (!data)   return <div className="text-center py-16 text-slate-400">No data available</div>;

  const { queries, forum, users, collaborate } = data;
  const maxQueryDept  = Math.max(...(queries.byDepartment.map(d => d.total)), 1);
  const maxForumCat   = Math.max(...(forum.byCategory.map(c => c.total)), 1);

  const DEPT_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500','bg-orange-500','bg-teal-500'];
  const CAT_COLORS  = ['bg-indigo-400','bg-emerald-400','bg-amber-400','bg-violet-400','bg-sky-400','bg-rose-400','bg-orange-400','bg-teal-400'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Cross-Department Activity</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live overview of communication, queries and collaboration across the university</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Top stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Members"     value={users.total.toLocaleString()}    color="indigo" />
        <StatCard label="Faculty & HOD"     value={((users.byRole.faculty || 0) + (users.byRole.hod || 0)).toLocaleString()} color="violet" />
        <StatCard label="Query Resolve Rate" value={`${queries.resolvedRate}%`}     color="emerald" sub={`${queries.total} total queries`} />
        <StatCard label="Forum Answer Rate"  value={`${forum.answeredRate}%`}       color="amber"   sub={`${forum.total} total posts`} />
      </div>

      {/* ── Queries by department ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Queries by Department</h3>
            <p className="text-[11px] text-slate-400">{queries.resolvedRate}% resolved overall</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {queries.byDepartment.map((d, i) => (
            <BarRow key={d.dept} label={d.dept} value={d.total} max={maxQueryDept}
              color={DEPT_COLORS[i % DEPT_COLORS.length]}
              right={`${d.resolved}/${d.total}`} />
          ))}
          {queries.byDepartment.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No query data yet</p>}
        </div>
      </div>

      {/* ── Forum activity ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Forum by Category</h3>
            <p className="text-[11px] text-slate-400">{forum.answeredCount} of {forum.total} questions answered</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {forum.byCategory.map((c, i) => (
            <BarRow key={c.category} label={c.category} value={c.total} max={maxForumCat}
              color={CAT_COLORS[i % CAT_COLORS.length]}
              right={`${c.answered}/${c.total}`} />
          ))}
          {forum.byCategory.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No forum data yet</p>}
        </div>
      </div>

      {/* ── Bottom row: User breakdown + Collaboration ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* User distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">User Distribution</h3>
          </div>
          {[
            { label: 'Students',  value: users.byRole.student || 0, color: 'bg-emerald-500' },
            { label: 'Faculty',   value: users.byRole.faculty  || 0, color: 'bg-violet-500' },
            { label: 'HOD',       value: users.byRole.hod      || 0, color: 'bg-indigo-500' },
            { label: 'Admin',     value: users.byRole.admin    || 0, color: 'bg-rose-500' },
          ].map(row => (
            <BarRow key={row.label} label={row.label} value={row.value} max={users.total} color={row.color} />
          ))}
        </div>

        {/* Collaboration stats */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Handshake className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Collaboration Requests</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: 'Open',      value: collaborate.open,           color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { label: 'Closed',    value: collaborate.closed,         color: 'bg-slate-50 text-slate-600 border-slate-100' },
              { label: 'Responses', value: collaborate.totalResponses, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-[10px] font-semibold mt-0.5 opacity-75">{label}</p>
              </div>
            ))}
          </div>
          {collaborate.open === 0 && collaborate.closed === 0 && (
            <p className="text-xs text-slate-400 text-center pt-2">No collaboration requests posted yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
