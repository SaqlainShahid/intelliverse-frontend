import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminListManageInternships,
  adminDeleteInternship,
  adminChangeInternshipStatus,
  adminListApplications,
  adminUpdateApplication,
} from '../api/careerApi';
import InternshipForm from './InternshipForm';

export default function CareerAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('internships');
  const [items, setItems] = useState([]);
  const [apps, setApps] = useState([]);
  const [totalApps, setTotalApps] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appStatus, setAppStatus] = useState('');
  const [appInternshipId, setAppInternshipId] = useState('');
  const [savingAppId, setSavingAppId] = useState('');

  const canApprove = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'hod';

  const internshipParams = useMemo(() => {
    const p = {};
    if (q) p.q = q;
    if (status) p.status = status;
    return p;
  }, [q, status]);

  const appParams = useMemo(() => {
    const p = {};
    if (appStatus) p.status = appStatus;
    if (appInternshipId) p.internshipId = appInternshipId;
    return p;
  }, [appStatus, appInternshipId]);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'faculty' && user.role !== 'hod')) return;
    (async () => {
      setLoading(true);
      try {
        const res = await adminListManageInternships(internshipParams);
        setItems(Array.isArray(res.items) ? res.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, internshipParams]);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'faculty' && user.role !== 'hod') || tab !== 'applications') return;
    (async () => {
      setLoading(true);
      try {
        const res = await adminListApplications(appParams);
        setApps(Array.isArray(res.items) ? res.items : []);
        setTotalApps(typeof res.total === 'number' ? res.total : 0);
      } catch {
        setApps([]);
        setTotalApps(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, tab, appParams]);

  const reloadInternships = async () => {
    try {
      const res = await adminListManageInternships(internshipParams);
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch {}
  };

  const onSaved = async () => {
    setEditing(null);
    await reloadInternships();
    toast.success('Saved');
  };

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this opportunity?');
    if (!ok) return;
    try {
      const success = await adminDeleteInternship(id);
      if (success) {
        toast.success('Deleted');
        setItems((prev) => prev.filter((i) => i._id !== id));
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const onChangeStatus = async (id, next) => {
    try {
      const updated = await adminChangeInternshipStatus(id, next);
      setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
      toast.success(`Status: ${next}`);
    } catch {
      toast.error('Failed to change status');
    }
  };

  const onSaveApplication = async (app) => {
    setSavingAppId(app._id);
    try {
      const updated = await adminUpdateApplication(app._id, { status: app.status, notes: app.notes || '' });
      setApps((prev) => prev.map((a) => (a._id === app._id ? updated : a)));
      toast.success('Application updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingAppId('');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'faculty' && user.role !== 'hod')) {
    return (
      <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl p-4">
        Only admin, faculty, or HOD can access Career Management.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 px-4 sm:px-6 md:px-8">
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-[2rem] p-8 sm:p-10 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)] overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 text-white">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner self-start sm:self-center">
            <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-md">Career Management</h1>
            <p className="mt-2 text-indigo-100 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
              Supervise student career opportunities, review internship postings, and manage job applications effectively.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="inline-flex bg-white/60 backdrop-blur-xl border border-white/50 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setTab('internships')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${tab === 'internships' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]' : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60'}`}
          >
            Internships & Jobs
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${tab === 'applications' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]' : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60'}`}
          >
            Applications
          </button>
        </div>
      </div>

      {tab === 'internships' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <Search className="w-5 h-5 text-indigo-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 text-sm font-medium placeholder-gray-400"
                  placeholder="Title, company, location"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <Filter className="w-5 h-5 text-indigo-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 text-sm font-medium cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center justify-end md:justify-end">
                <button
                  onClick={() => setEditing({})}
                  className="px-6 py-3 w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Opportunity
                </button>
              </div>
            </div>
          </div>

          {editing && (
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-lg transition-all animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-500"/> {editing?._id ? 'Edit Opportunity' : 'Create New Opportunity'}
                </div>
                <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors" onClick={() => setEditing(null)}>Close</button>
              </div>
              <InternshipForm editing={editing} onSaved={onSaved} />
            </div>
          )}

          <div className="bg-white border border-gray-100/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                 <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                 <p className="font-medium text-sm">Loading records...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                 <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
                 <p className="font-medium text-sm">No records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <table className="min-w-full text-sm w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Title</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Company</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Location</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((it) => (
                      <tr key={it._id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4 font-semibold text-gray-800">{it.title}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{it.company}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">{it.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]">{it.location}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                              it.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : it.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : it.status === 'pending'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 bg-white text-gray-600 border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 hover:text-indigo-600 hover:shadow hover:-translate-y-0.5 transition-all"
                              onClick={() => setEditing(it)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 bg-white text-red-400 border border-gray-200 shadow-sm rounded-xl hover:bg-red-50 hover:text-red-600 hover:shadow hover:-translate-y-0.5 transition-all"
                              onClick={() => onDelete(it._id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {canApprove && (
                              <div className="flex gap-1.5 ml-2 border-l pl-3 border-gray-200">
                                <button
                                  className="px-3 py-2 bg-emerald-500 text-white shadow-sm rounded-xl hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold text-xs inline-flex items-center"
                                  onClick={() => onChangeStatus(it._id, 'approved')}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </button>
                                <button
                                  className="px-3 py-2 bg-rose-500 text-white shadow-sm rounded-xl hover:bg-rose-600 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold text-xs inline-flex items-center"
                                  onClick={() => onChangeStatus(it._id, 'rejected')}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
                <input
                  value={appInternshipId}
                  onChange={(e) => setAppInternshipId(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 text-sm font-medium placeholder-gray-400"
                  placeholder="Filter by Job ID"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Filter className="w-5 h-5 text-indigo-400" />
                <select
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 text-sm font-medium cursor-pointer"
                >
                  <option value="">All Applications Status</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center justify-start md:justify-end text-sm text-gray-600 font-bold px-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                Total Applications: <span className="ml-2 text-indigo-600 text-xl font-black">{totalApps}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                 <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                 <p className="font-medium text-sm">Loading applications...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                 <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
                 <p className="font-medium text-sm">No applications found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <table className="min-w-full text-sm w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Student Applicant</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Target Role</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Admin Notes</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {apps.map((app) => (
                      <tr key={app._id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 drop-shadow-sm">{(app.userId?.profile?.firstName || '')} {(app.userId?.profile?.lastName || '')}</div>
                          <div className="text-xs text-indigo-500 tracking-wide">{app.userId?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{app.internshipId?.title || 'Unknown Role'}</div>
                          <div className="text-xs text-gray-500 font-medium">{app.internshipId?.company || 'Unknown Company'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              setApps((prev) =>
                                prev.map((a) => (a._id === app._id ? { ...a, status: e.target.value } : a))
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm border focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                              app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                              : app.status === 'shortlisted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            value={app.notes || ''}
                            onChange={(e) =>
                              setApps((prev) =>
                                prev.map((a) => (a._id === app._id ? { ...a, notes: e.target.value } : a))
                              )
                            }
                            className="w-full min-w-[200px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 transition-all font-medium text-gray-700"
                            placeholder="Add evaluation notes..."
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => onSaveApplication(app)}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                            disabled={savingAppId === app._id}
                          >
                            {savingAppId === app._id ? 'Saving...' : 'Save Update'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
