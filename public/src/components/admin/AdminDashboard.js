import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Package, 
  Activity, 
  Shield, 
  TrendingUp,
  GraduationCap,
  UserCheck,
  
} from 'lucide-react';
import StudentManagement from './StudentManagement';
import FacultyManagement from './FacultyManagement';
import SystemStats from './SystemStats';
import AdminGroupsTab from './AdminGroupsTab';
import LostAndFoundManagement from './LostAndFoundManagement';
import { autoCreateGroup } from '../../services/chatService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'items', label: 'Lost & Found', icon: Package },
    { id: 'groups', label: 'Groups', icon: UserCheck },
    { id: 'stats', label: 'Statistics', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Shield className="h-7 w-7 text-red-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        </div>
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Students</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.users?.students || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Faculty</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.users?.faculty || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Lost & Found Items</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.items?.total || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.users?.active || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lost & Found Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lost Items</span>
                    <span className="text-sm font-semibold text-red-600">{stats?.items?.lost || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Found Items</span>
                    <span className="text-sm font-semibold text-yellow-600">{stats?.items?.found || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Claimed Items</span>
                    <span className="text-sm font-semibold text-green-600">{stats?.items?.claimed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Students</span>
                    <span className="text-sm font-semibold text-blue-600">{stats?.activity?.recentUsers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Items Reported</span>
                    <span className="text-sm font-semibold text-purple-600">{stats?.activity?.recentItems || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recent Logins</span>
                    <span className="text-sm font-semibold text-green-600">{stats?.activity?.recentLogins || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Chat Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Department Group</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Department name (e.g., Computer Science)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="dept-input"
                  />
                  <input
                    type="text"
                    placeholder="Group name (optional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="dept-name-input"
                  />
                  <button
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={async () => {
                      const dept = document.getElementById('dept-input')?.value?.trim();
                      const gname = document.getElementById('dept-name-input')?.value?.trim();
                      if (!dept) return toast.error('Enter department name');
                      try {
                        const res = await autoCreateGroup({ type: 'department', key: dept, name: gname || undefined });
                        if (res?.success) toast.success(res.updated ? 'Department group updated' : 'Department group created');
                      } catch (e) {
                        toast.error('Failed to create department group');
                      }
                    }}
                  >Create</button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Batch Group</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Semester number (e.g., 5)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="batch-input"
                  />
                  <input
                    type="text"
                    placeholder="Group name (optional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="batch-name-input"
                  />
                  <button
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={async () => {
                      const sem = document.getElementById('batch-input')?.value?.trim();
                      const gname = document.getElementById('batch-name-input')?.value?.trim();
                      if (!sem) return toast.error('Enter semester number');
                      try {
                        const res = await autoCreateGroup({ type: 'batch', key: Number(sem), name: gname || undefined });
                        if (res?.success) toast.success(res.updated ? 'Batch group updated' : 'Batch group created');
                      } catch (e) {
                        toast.error('Failed to create batch group');
                      }
                    }}
                  >Create</button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Create Course Group</h3>
                <p className="text-sm text-gray-600 mb-4">Provide member emails or IDs. Use department/batch groups for auto selection.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Course code (e.g., CS-101)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="course-key-input"
                  />
                  <textarea
                    placeholder="Member emails (comma-separated)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    id="course-emails-input"
                  />
                  <textarea
                    placeholder="Member IDs (comma-separated)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    id="course-members-input"
                  />
                  <input
                    type="text"
                    placeholder="Group name (optional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    id="course-name-input"
                  />
                  <button
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={async () => {
                      const key = document.getElementById('course-key-input')?.value?.trim();
                      const rawEmails = document.getElementById('course-emails-input')?.value?.trim();
                      const raw = document.getElementById('course-members-input')?.value?.trim();
                      const gname = document.getElementById('course-name-input')?.value?.trim();
                      const memberEmails = (rawEmails || '')
                        .split(',')
                        .map(s => s.trim().toLowerCase())
                        .filter(Boolean);
                      const members = (raw || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      if (!memberEmails.length && !members.length) return toast.error('Enter member emails or IDs');
                      try {
                        const payload = { type: 'course', key, name: gname || undefined };
                        if (memberEmails.length) payload.memberEmails = memberEmails;
                        else payload.members = members;
                        const res = await autoCreateGroup(payload);
                        if (res?.success) toast.success(res.updated ? 'Course group updated' : 'Course group created');
                      } catch (e) {
                        toast.error('Failed to create course group');
                      }
                    }}
                  >Create</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'faculty' && <FacultyManagement />}
        {activeTab === 'items' && <LostAndFoundManagement />}
        {activeTab === 'groups' && <AdminGroupsTab />}
        {activeTab === 'stats' && <SystemStats stats={stats} />}
      </div>
    </div>
  );
};

export default AdminDashboard; 
