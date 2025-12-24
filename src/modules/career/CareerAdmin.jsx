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

  const canApprove = user?.role === 'admin' || user?.role === 'faculty';

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
    if (!user || (user.role !== 'admin' && user.role !== 'faculty')) return;
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
    if (!user || (user.role !== 'admin' && user.role !== 'faculty') || tab !== 'applications') return;
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

  if (!user || (user.role !== 'admin' && user.role !== 'faculty')) {
    return (
      <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl p-4">
        Only admin or faculty can access Career Management.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Career Management</h1>
        </div>
        <p className="mt-1 text-white/90">Manage internships, jobs, and student applications.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('internships')}
          className={`px-4 py-2 rounded-lg ${tab === 'internships' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
        >
          Internships & Jobs
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`px-4 py-2 rounded-lg ${tab === 'applications' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
        >
          Applications
        </button>
      </div>

      {tab === 'internships' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-600" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Title, company, location"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setEditing({})}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </button>
              </div>
            </div>
          </div>

          {editing && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-gray-800">{editing?._id ? 'Edit Opportunity' : 'Create Opportunity'}</div>
                <button className="text-gray-600 hover:text-gray-800" onClick={() => setEditing(null)}>Close</button>
              </div>
              <InternshipForm editing={editing} onSaved={onSaved} />
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-600">No records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it._id} className="border-t">
                        <td className="px-3 py-2">{it.title}</td>
                        <td className="px-3 py-2">{it.company}</td>
                        <td className="px-3 py-2">{it.type}</td>
                        <td className="px-3 py-2">{it.location}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              it.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : it.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : it.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-2 py-1 bg-white border rounded hover:bg-gray-50 inline-flex items-center"
                              onClick={() => setEditing(it)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="px-2 py-1 bg-white border rounded hover:bg-gray-50 inline-flex items-center"
                              onClick={() => onDelete(it._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                            {canApprove && (
                              <>
                                <button
                                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center"
                                  onClick={() => onChangeStatus(it._id, 'approved')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </button>
                                <button
                                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center"
                                  onClick={() => onChangeStatus(it._id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </button>
                              </>
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
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-600" />
                <input
                  value={appInternshipId}
                  onChange={(e) => setAppInternshipId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Filter by Internship ID"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center justify-end text-sm text-gray-600">
                Total: {totalApps}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : apps.length === 0 ? (
              <div className="text-gray-600">No applications found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Internship</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app._id} className="border-t">
                        <td className="px-3 py-2">
                          {(app.userId?.profile?.firstName || '') + ' ' + (app.userId?.profile?.lastName || '')}
                        </td>
                        <td className="px-3 py-2">{app.userId?.email || ''}</td>
                        <td className="px-3 py-2">
                          {app.internshipId?.title || ''} at {app.internshipId?.company || ''}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              setApps((prev) =>
                                prev.map((a) => (a._id === app._id ? { ...a, status: e.target.value } : a))
                              )
                            }
                            className="border rounded-lg px-2 py-1"
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={app.notes || ''}
                            onChange={(e) =>
                              setApps((prev) =>
                                prev.map((a) => (a._id === app._id ? { ...a, notes: e.target.value } : a))
                              )
                            }
                            className="border rounded-lg px-2 py-1 w-56"
                            placeholder="Notes"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onSaveApplication(app)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            disabled={savingAppId === app._id}
                          >
                            {savingAppId === app._id ? 'Saving...' : 'Save'}
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
