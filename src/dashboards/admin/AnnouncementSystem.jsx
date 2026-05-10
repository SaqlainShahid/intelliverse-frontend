import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaPlus, FaSave, FaTimes, FaUsers, FaBuilding, FaUserTag, FaPaperPlane, FaHistory, FaTrash } from 'react-icons/fa';
import { MdAnnouncement } from 'react-icons/md';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// Department list - same as signup
const DEPARTMENT_LIST = [
  'Computer Science',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Other'
];

const AnnouncementSystem = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all', // all, role, department
    targetRoles: [],
    targetDepartments: [],
    priority: 'normal', // low, normal, high, critical
    expiresAt: ''
  });

  const departments = DEPARTMENT_LIST;
  const roles = ['student', 'faculty', 'hod', 'admin'];
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-500' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/announcements');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch announcements');
      } else {
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await api.post('/admin/announcements', formData);
      toast.success('Announcement sent successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        message: '',
        targetType: 'all',
        targetRoles: [],
        targetDepartments: [],
        priority: 'normal',
        expiresAt: ''
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to send announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/admin/announcements/${id}`);
      toast.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const getTargetBadge = (announcement) => {
    if (announcement.targetType === 'all') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">All Users</span>;
    }
    if (announcement.targetType === 'role') {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
          {announcement.targetRoles?.join(', ')}
        </span>
      );
    }
    if (announcement.targetType === 'department') {
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
          {announcement.targetDepartments?.join(', ')}
        </span>
      );
    }
  };

  const getPriorityBadge = (priority) => {
    const config = priorities.find(p => p.value === priority) || priorities[1];
    return (
      <span className={`px-3 py-1 ${config.color} text-white text-xs font-semibold rounded-full`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <MdAnnouncement className="text-blue-500" />
            Announcement System
          </h2>
          <p className="text-gray-600 mt-1">Send university-wide or targeted announcements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <FaBullhorn /> Create Announcement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sent</p>
              <p className="text-3xl font-bold">{announcements.length}</p>
            </div>
            <FaHistory className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <p className="text-3xl font-bold">
                {announcements.filter(a => !a.expiresAt || new Date(a.expiresAt) > new Date()).length}
              </p>
            </div>
            <MdAnnouncement className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">High Priority</p>
              <p className="text-3xl font-bold">
                {announcements.filter(a => a.priority === 'high' || a.priority === 'critical').length}
              </p>
            </div>
            <FaBullhorn className="text-4xl text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">This Week</p>
              <p className="text-3xl font-bold">
                {announcements.filter(a => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(a.createdAt) > weekAgo;
                }).length}
              </p>
            </div>
            <FaPaperPlane className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No announcements sent yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{announcement.message}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUsers />
                    {getTargetBadge(announcement)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Sent: {new Date(announcement.createdAt).toLocaleString()}
                  </div>
                  {announcement.expiresAt && (
                    <div className="text-sm text-gray-500">
                      Expires: {new Date(announcement.expiresAt).toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    By: {announcement.createdBy?.profile?.firstName} {announcement.createdBy?.profile?.lastName}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-t-2xl sticky top-0">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <FaBullhorn />
                Create New Announcement
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., System Maintenance Alert"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="5"
                  placeholder="Enter your announcement message..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setFormData({ ...formData, priority: priority.value })}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        formData.priority === priority.value
                          ? `${priority.color} text-white shadow-lg scale-105`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, targetType: 'all' })}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      formData.targetType === 'all'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaUsers /> All Users
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, targetType: 'role' })}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      formData.targetType === 'role'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaUserTag /> By Role
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, targetType: 'department' })}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      formData.targetType === 'department'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaBuilding /> By Department
                  </button>
                </div>
              </div>

              {/* Conditional Target Selection */}
              {formData.targetType === 'role' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Roles
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <label key={role} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, targetRoles: [...formData.targetRoles, role] });
                            } else {
                              setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="capitalize font-medium text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetType === 'department' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Departments
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {departments.map((dept) => (
                      <label key={dept} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetDepartments.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, targetDepartments: [...formData.targetDepartments, dept] });
                            } else {
                              setFormData({ ...formData, targetDepartments: formData.targetDepartments.filter(d => d !== dept) });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="font-medium text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent announcement
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: '',
                      message: '',
                      targetType: 'all',
                      targetRoles: [],
                      targetDepartments: [],
                      priority: 'normal',
                      expiresAt: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={!formData.title || !formData.message}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane /> Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementSystem;
