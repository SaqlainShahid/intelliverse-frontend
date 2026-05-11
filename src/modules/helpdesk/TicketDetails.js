// modules/helpdesk/TicketDetails.js
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Tag,
  Edit,
  Send,
  Star,
  StarOff,
  X,
  Save,
  Trash2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import helpdeskService from '../../services/helpdeskService';
import authService from '../../services/authService';

const TicketDetails = ({ 
  ticket, 
  onUpdate, 
  onAddComment, 
  onSubmitFeedback,
  isAdminView = false,
  onDeleteTicket,
  onClose,
  onViewFull
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    assignedTo: ticket.assignedTo?._id || ''
  });
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: ticket.feedback?.rating || 0,
    comment: ticket.feedback?.comment || ''
  });
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState(ticket.attachments || []);
  const [uploadFile, setUploadFile] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const priorities = helpdeskService.getPriorities();
  const statuses = helpdeskService.getStatuses();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_user': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending_teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_faculty': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'pending_hod': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo?._id || ''
    });
  };

  React.useEffect(() => {
    const loadAssignable = async () => {
      if (!isAdminView) return;
      const res = await authService.listUsers({ role: 'faculty', page: 1, limit: 50 });
      if (res.success) {
        setAssignableUsers(res.data.users || []);
      }
    };
    loadAssignable();
  }, [isAdminView]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(ticket._id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo?._id || ''
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      await onAddComment(ticket._id, {
        message: newComment,
        isInternal: isInternalComment
      });
      setNewComment('');
      setIsInternalComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedback.rating === 0) return;
    
    setLoading(true);
    try {
      await onSubmitFeedback(ticket._id, feedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = isAdminView || ticket.reportedBy._id === user._id;
  const canAddComments = isAdminView || ticket.reportedBy._id === user._id;
  const canSubmitFeedback = ticket.reportedBy._id === user._id &&
                           ['resolved', 'closed'].includes(ticket.status) &&
                           !ticket.feedback?.rating;
  const canUploadAttachment = isAdminView || ticket.reportedBy._id === user._id;

  // Attendance approval chain role detection
  const designation = (user?.profile?.designation || '').toLowerCase();
  // Include common typos/variants (e.g. "Leacturer" for "Lecturer")
  const teachingKeywords = ['teacher', 'lecturer', 'leacturer', 'professor', 'prof', 'instructor', 'visiting', 'lab engineer'];
  // Must have an EXPLICIT teaching keyword — no fallback for empty designation
  const isTeachingStaff = user?.role === 'faculty' && teachingKeywords.some(k => designation.includes(k));
  const isFacultyOverseer = user?.role === 'faculty' && designation.includes('coordinator');
  const isHOD = user?.role === 'hod' || (user?.role === 'faculty' && (designation.includes('hod') || designation.includes('head of department')));
  const isAdminRole = user?.role === 'admin';

  return (
    <div className="bg-white rounded-lg shadow h-full min-h-0 flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg font-semibold text-gray-900">
                {ticket.ticketNumber}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-xl font-semibold text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900 break-words">{ticket.title}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {typeof onViewFull === 'function' && (
              <button
                onClick={onViewFull}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full sm:w-auto"
              >
                View Full
              </button>
            )}
            <button
              onClick={() => onClose && onClose()}
              className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full sm:w-auto"
            >
              <Minimize2 className="h-4 w-4 mr-1" />
              Minimize
            </button>
          {canEdit && (
          <>
              {isAdminView && !['resolved','closed'].includes(ticket.status) && (
                <>
                  {ticket.isAttendanceIssue ? (
                    <>
                      {/* Stage 1 — only teaching staff can approve */}
                      {ticket.status === 'pending_teacher' && (isTeachingStaff || isAdminRole) && (
                        <button
                          onClick={async () => {
                            if (!onUpdate) return;
                            setLoading(true);
                            try { await onUpdate(ticket._id, { status: 'pending_faculty' }); } catch (e) {}
                            setLoading(false);
                          }}
                          disabled={loading}
                          className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto text-sm font-semibold"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve — Teacher Stage
                        </button>
                      )}
                      {ticket.status === 'pending_teacher' && !isTeachingStaff && !isAdminRole && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-medium">
                          Awaiting teacher approval
                        </span>
                      )}

                      {/* Stage 2 — only faculty coordinator can approve */}
                      {ticket.status === 'pending_faculty' && (isFacultyOverseer || isAdminRole) && (
                        <button
                          onClick={async () => {
                            if (!onUpdate) return;
                            setLoading(true);
                            try { await onUpdate(ticket._id, { status: 'pending_hod' }); } catch (e) {}
                            setLoading(false);
                          }}
                          disabled={loading}
                          className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 w-full sm:w-auto text-sm font-semibold"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve — Faculty Stage
                        </button>
                      )}
                      {ticket.status === 'pending_faculty' && !isFacultyOverseer && !isAdminRole && (
                        <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg font-medium">
                          Awaiting faculty coordinator approval
                        </span>
                      )}

                      {/* Stage 3 — only HOD can resolve */}
                      {ticket.status === 'pending_hod' && (isHOD || isAdminRole) && (
                        <button
                          onClick={async () => {
                            if (!onUpdate) return;
                            setLoading(true);
                            try { await onUpdate(ticket._id, { status: 'resolved' }); } catch (e) {}
                            setLoading(false);
                          }}
                          disabled={loading}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto text-sm font-semibold"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve — HOD Final Approval
                        </button>
                      )}
                      {ticket.status === 'pending_hod' && !isHOD && !isAdminRole && (
                        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-medium">
                          Awaiting HOD approval
                        </span>
                      )}
                    </>
                  ) : (
                    /* Non-attendance ticket — any faculty/admin/hod can resolve */
                    <button
                      onClick={async () => {
                        if (!onUpdate) return;
                        setLoading(true);
                        try { await onUpdate(ticket._id, { status: 'resolved' }); } catch (e) {}
                        setLoading(false);
                      }}
                      disabled={loading}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto text-sm font-semibold"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </button>
                  )}
                </>
              )}
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={async () => {
                    if (!onDeleteTicket) return;
                    setLoading(true);
                    try {
                      await onDeleteTicket(ticket._id);
                    } catch (e) {}
                    setLoading(false);
                  }}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}
            </>
            )}
          </div>
        </div>
        {/* Meta Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          {ticket.dueDate && (
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>Reporter: {ticket.reportedBy?.profile?.firstName || ''} {ticket.reportedBy?.profile?.lastName || ''}</span>
          </div>
          {ticket.assignedTo && (
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>Assigned: {ticket.assignedTo?.profile?.firstName || ''} {ticket.assignedTo?.profile?.lastName || ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0 overflow-x-hidden">
        {/* Attachments */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
          {attachments && attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 break-words">{att.originalName}</span>
                    <span className="text-xs text-gray-500">{Math.round((att.size || 0) / 1024)} KB</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const blob = await helpdeskService.downloadAttachment(ticket._id, att.filename);
                        const url = window.URL.createObjectURL(new Blob([blob]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = att.originalName || 'attachment';
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Download failed:', error);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No attachments</p>
          )}

          {canUploadAttachment && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-sm max-w-full w-full sm:w-auto"
              />
              <button
                onClick={async () => {
                  if (!uploadFile) return;
                  setLoading(true);
                  try {
                    const res = await helpdeskService.uploadAttachment(ticket._id, uploadFile);
                    setAttachments(prev => ([
                      ...prev,
                      {
                        filename: res.data.filename,
                        originalName: res.data.originalName,
                        size: res.data.size,
                        uploadedAt: new Date().toISOString()
                      }
                    ]));
                    setUploadFile(null);
                  } catch (error) {
                    console.error('Upload failed:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !uploadFile}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
        {/* Attendance Approval Chain Progress */}
        {ticket.isAttendanceIssue && (
          <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Attendance Approval Chain</h3>
            </div>
            <div className="flex items-center gap-0">
              {[
                {
                  label: 'Teacher',
                  sublabel: 'Stage 1',
                  done: ['pending_faculty','pending_hod','resolved','closed'].includes(ticket.status),
                  active: ticket.status === 'pending_teacher',
                  approval: ticket.approvalChain?.teacherApproval,
                  color: 'indigo'
                },
                {
                  label: 'Faculty',
                  sublabel: 'Stage 2',
                  done: ['pending_hod','resolved','closed'].includes(ticket.status),
                  active: ticket.status === 'pending_faculty',
                  approval: ticket.approvalChain?.facultyApproval,
                  color: 'purple'
                },
                {
                  label: 'HOD',
                  sublabel: 'Stage 3',
                  done: ['resolved','closed'].includes(ticket.status),
                  active: ticket.status === 'pending_hod',
                  approval: ticket.approvalChain?.hodApproval,
                  color: 'green'
                }
              ].map((step, idx) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                      step.done
                        ? 'bg-green-500 border-green-500 text-white'
                        : step.active
                        ? 'bg-white border-indigo-500 text-indigo-600 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      {step.done ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-bold ${step.done ? 'text-green-700' : step.active ? 'text-indigo-700' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-400">{step.sublabel}</p>
                      {step.done && step.approval?.approvedAt && (
                        <p className="text-[10px] text-green-600 mt-0.5">
                          {new Date(step.approval.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                      {step.active && (
                        <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">Pending</p>
                      )}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className={`h-0.5 flex-1 mx-1 mb-6 rounded-full transition-all ${
                      step.done ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap break-words">{ticket.description}</p>
          )}
        </div>

        {/* Admin Controls */}
        {isAdminView && isEditing && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Admin Controls</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={editData.assignedTo}
                  onChange={(e) => setEditData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.profile.firstName} {u.profile.lastName} ({u.profile.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Comments</h3>
          
          {/* Comments List */}
          <div className="space-y-4 mb-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    comment.isInternal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {comment.user?.profile?.firstName || ''} {comment.user?.profile?.lastName || ''}
                      </span>
                      {comment.isInternal && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          Internal
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>

          {/* Add Comment */}
          {canAddComments && (
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                
                {isAdminView && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Internal comment (not visible to user)</span>
                  </label>
                )}
                
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        {canSubmitFeedback && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Rate Your Experience</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                    className="text-2xl"
                  >
                    {rating <= feedback.rating ? (
                      <Star className="h-8 w-8 text-yellow-400 fill-current" />
                    ) : (
                      <StarOff className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Optional feedback comment..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <button
                onClick={handleSubmitFeedback}
                disabled={feedback.rating === 0 || loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star className="h-4 w-4 mr-2" />
                Submit Feedback
              </button>
            </div>
          </div>
        )}

        {/* Existing Feedback */}
        {ticket.feedback && ticket.feedback.rating && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-900 mr-2">Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={`h-4 w-4 ${
                        rating <= ticket.feedback.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {ticket.feedback.comment && (
                <p className="text-gray-700">{ticket.feedback.comment}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Submitted on {new Date(ticket.feedback.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;
