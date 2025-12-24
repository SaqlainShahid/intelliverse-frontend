import React, { useState, useEffect } from 'react';
import { getQueries, replyToQuery, escalateQuery, transferQuery, addQueryCollaborator } from '../../services/aiService';
import { getSocket } from '../../services/socket';
import { MessageSquare, AlertOctagon, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QueryCard = ({ query, onReply, onEscalate, onTransfer, onAddCollaborator, processingId, departments }) => {
    const [replyText, setReplyText] = useState('');
    const [transferDept, setTransferDept] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [collabDept, setCollabDept] = useState('');

    const handleReplyClick = () => {
        if (!replyText.trim()) return;
        onReply(query._id, replyText, () => setReplyText(''));
    };

    const collaborators = Array.isArray(query?.collaboratingDepartments) ? query.collaboratingDepartments : [];
    const collaboratorNames = collaborators
      .map((d) => (typeof d === 'string' ? d : d?.name))
      .filter(Boolean);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        query.tag === 'IT' ? 'bg-blue-500' :
                        query.tag === 'Finance' ? 'bg-green-500' :
                        'bg-iv-indigo'
                    }`}>
                        {query.tag.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {query.userId?.profile?.firstName} {query.userId?.profile?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{query.userId?.email}</span>
                            <span>•</span>
                            <span>{new Date(query.createdAt).toLocaleDateString()}</span>
                        </div>
                        {query.ownerStatus && (
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full border ${query.ownerStatus === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                              Owner: {query.ownerStatus}
                            </span>
                          </div>
                        )}
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    query.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    query.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    query.status === 'escalated' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                    {query.status.toUpperCase()}
                </span>
            </div>

            <div className="mb-6">
                <p className="text-gray-800 text-lg">{query.message}</p>
                {query.aiResponse && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-600"><span className="font-semibold text-iv-indigo">AI Suggestion:</span> {query.aiResponse}</p>
                    </div>
                )}
                {Array.isArray(query?.collaboratorStatuses) && query.collaboratorStatuses.length > 0 ? (
                    <div className="mt-3 text-sm text-gray-600">
                      <div className="font-semibold text-gray-700">Collaborators</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {query.collaboratorStatuses.map((cs, i) => (
                          <span key={i} className={`px-2 py-1 rounded-full text-xs border ${cs.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {(cs.department?.name || 'Unknown')} • {cs.status}
                          </span>
                        ))}
                      </div>
                    </div>
                ) : (
                    collaboratorNames.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Collaborators:</span> {collaboratorNames.join(', ')}
                      </div>
                    )
                )}
                {Array.isArray(query?.transfers) && query.transfers.length > 0 && (
                    <div className="mt-4">
                        <div className="text-sm font-semibold text-gray-700">Transfer History</div>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {query.transfers.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>
                                      {(t.fromDepartment?.name || 'Unassigned')} → {(t.toDepartment?.name || 'Unassigned')}
                                    </span>
                                    {t.by && (
                                      <span>• by {t.by?.profile?.firstName} {t.by?.profile?.lastName}</span>
                                    )}
                                    {t.note && (
                                      <span>• note: {t.note}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* History */}
            {query.history && query.history.length > 1 && (
                <div className="mb-4 space-y-2 pl-4 border-l-2 border-gray-100">
                    {query.history.slice(1).map((h, idx) => (
                        <div key={idx} className="text-sm">
                            <span className="font-semibold">{h.sender ? 'Admin' : 'AI'}:</span> {h.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            {query.status === 'pending' && (
                <div className="space-y-3">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Type a reply to resolve..."
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleReplyClick}
                            disabled={processingId === query._id}
                            className="p-2 bg-iv-indigo text-white rounded-lg hover:bg-iv-indigo/90"
                            title="Reply & Resolve"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onEscalate(query._id)}
                            disabled={processingId === query._id}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200"
                            title="Escalate to HelpDesk"
                        >
                            <AlertOctagon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex gap-2">
                            <select
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
                                value={transferDept}
                                onChange={(e) => setTransferDept(e.target.value)}
                            >
                                <option value="">Transfer to...</option>
                                {departments
                                  .filter((d) => d !== query.tag)
                                  .map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                            </select>
                            <button
                                onClick={() => onTransfer(query._id, transferDept, transferNote, () => { setTransferDept(''); setTransferNote(''); })}
                                disabled={processingId === query._id || !transferDept}
                                className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200"
                                title="Transfer query"
                            >
                                Transfer
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
                                value={collabDept}
                                onChange={(e) => setCollabDept(e.target.value)}
                            >
                                <option value="">Add collaborator...</option>
                                {departments
                                  .filter((d) => d !== query.tag)
                                  .map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                            </select>
                            <button
                                onClick={() => onAddCollaborator(query._id, collabDept, () => setCollabDept(''))}
                                disabled={processingId === query._id || !collabDept}
                                className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200"
                                title="Add collaborating department"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Optional transfer note..."
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};

const DepartmentDashboard = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  const departments = ['IT', 'Finance', 'Exams', 'Admissions', 'Hostel', 'Library', 'Career', 'Other'];

  useEffect(() => {
    fetchQueries();

    const socket = getSocket();
    if (socket) {
        socket.on('query:new', (newQuery) => {
            // Check if matches current filter
            const collaborators = Array.isArray(newQuery?.collaboratingDepartments) ? newQuery.collaboratingDepartments : [];
            const collabNames = collaborators.map((d) => (typeof d === 'string' ? d : d?.name)).filter(Boolean);
            const matchesDept = !selectedDept || newQuery.tag === selectedDept || collabNames.includes(selectedDept);
            if (matchesDept && (!selectedStatus || newQuery.status === selectedStatus)) {
                 setQueries(prev => [newQuery, ...prev]);
                 toast('New query received', { icon: '🔔' });
            }
        });
        socket.on('query:update', (updatedQuery) => {
            const collaborators = Array.isArray(updatedQuery?.collaboratingDepartments) ? updatedQuery.collaboratingDepartments : [];
            const collabNames = collaborators.map((d) => (typeof d === 'string' ? d : d?.name)).filter(Boolean);
            const matchesDept = !selectedDept || updatedQuery.tag === selectedDept || collabNames.includes(selectedDept);
            const matchesStatus = !selectedStatus || updatedQuery.status === selectedStatus;
            if (matchesDept && matchesStatus) {
              setQueries((prev) => {
                const idx = prev.findIndex((q) => q._id === updatedQuery._id);
                if (idx === -1) return [updatedQuery, ...prev];
                const copy = [...prev];
                copy[idx] = updatedQuery;
                return copy;
              });
            } else {
              setQueries((prev) => prev.filter((q) => q._id !== updatedQuery._id));
            }
        });
    }

    return () => {
        if (socket) socket.off('query:new');
        if (socket) socket.off('query:update');
    };
  }, [selectedDept, selectedStatus]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await getQueries({ department: selectedDept, status: selectedStatus });
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        const filtered = data.filter((q) => {
          if (selectedQueue === 'awaiting-owner') {
            const allCollabsResolved = (q.collaboratorStatuses || []).every((cs) => cs.status === 'resolved');
            return q.ownerStatus !== 'resolved' && allCollabsResolved;
          }
          if (selectedQueue === 'awaiting-collaborators') {
            const anyPendingCollab = (q.collaboratorStatuses || []).some((cs) => cs.status !== 'resolved');
            return anyPendingCollab;
          }
          return true;
        });
        setQueries(filtered);
      }
    } catch (error) {
      toast.error('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id, text, onSuccess) => {
    try {
      setProcessingId(id);
      await replyToQuery(id, text, 'resolved');
      toast.success('Reply sent & query resolved');
      if (onSuccess) onSuccess();
      fetchQueries();
    } catch (error) {
      toast.error('Failed to reply');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEscalate = async (id) => {
    try {
      setProcessingId(id);
      await escalateQuery(id);
      toast.success('Query escalated to HelpDesk');
      fetchQueries();
    } catch (error) {
      toast.error('Failed to escalate');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTransfer = async (id, toDept, note, onSuccess) => {
    try {
      setProcessingId(id);
      await transferQuery(id, toDept, note);
      toast.success('Query transferred');
      if (onSuccess) onSuccess();
      fetchQueries();
    } catch (error) {
      toast.error('Failed to transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddCollaborator = async (id, dept, onSuccess) => {
    try {
      setProcessingId(id);
      await addQueryCollaborator(id, dept);
      toast.success('Collaborator added');
      if (onSuccess) onSuccess();
      fetchQueries();
    } catch (error) {
      toast.error('Failed to add collaborator');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Queries</h1>
          <p className="text-gray-500">Manage and resolve student inquiries routed by AI</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="answered">AI Answered</option>
          </select>
          <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iv-indigo/20"
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
          >
            <option value="all">All</option>
            <option value="awaiting-owner">Awaiting Owner</option>
            <option value="awaiting-collaborators">Awaiting Collaborators</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-iv-indigo" />
        </div>
      ) : (
        <div className="grid gap-4">
          {queries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No queries found for current filters</p>
            </div>
          ) : (
            queries.map((query) => (
              <QueryCard 
                key={query._id} 
                query={query} 
                onReply={handleReply} 
                onEscalate={handleEscalate}
                onTransfer={handleTransfer}
                onAddCollaborator={handleAddCollaborator}
                processingId={processingId}
                departments={departments}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;