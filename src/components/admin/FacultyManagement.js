import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const DESIGNATION_OPTIONS = [
  'Lecturer',
  'Senior Lecturer',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Visiting Lecturer',
  'Lab Engineer',
  'Instructor',
  'Coordinator',
  'Program Coordinator',
  'HOD',
];

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showActions, setShowActions] = useState({});
  const [editingDesignation, setEditingDesignation] = useState(null); // { id, value }
  const [savingDesignation, setSavingDesignation] = useState(false);

  useEffect(() => {
    loadFaculty();
  }, [currentPage, searchTerm, departmentFilter]);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        role: 'faculty',
        sort: 'newest'
      });

      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/auth/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFaculty(data.users);
        setTotalPages(data.totalPages);
      } else {
        toast.error('Failed to load faculty');
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
      toast.error('Error loading faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (facultyId) => {
    try {
      const response = await fetch(`/api/auth/admin/users/${facultyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Faculty status updated successfully');
        loadFaculty();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty member? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/admin/users/${facultyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Faculty member deleted successfully');
        loadFaculty();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete faculty member');
      }
    } catch (error) {
      console.error('Error deleting faculty member:', error);
      toast.error('Error deleting faculty member');
    }
  };

  const handleUpdateDesignation = async (facultyId, designation) => {
    setSavingDesignation(true);
    try {
      const response = await fetch(`/api/auth/admin/users/${facultyId}/designation`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ designation })
      });
      if (response.ok) {
        toast.success('Designation updated');
        setEditingDesignation(null);
        loadFaculty();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to update designation');
      }
    } catch (e) {
      toast.error('Error updating designation');
    } finally {
      setSavingDesignation(false);
    }
  };

  const getDesignationColor = (designation) => {
    if (designation?.toLowerCase().includes('professor')) return 'bg-purple-100 text-purple-800';
    if (designation?.toLowerCase().includes('assistant')) return 'bg-blue-100 text-blue-800';
    if (designation?.toLowerCase().includes('associate')) return 'bg-green-100 text-green-800';
    if (designation?.toLowerCase().includes('lecturer')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-green-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
        </div>
        <button
          onClick={loadFaculty}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Faculty</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((member) => (
          <div key={member._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Faculty Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.profile?.firstName} {member.profile?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{member.profile?.employeeId}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActions(prev => ({ ...prev, [member._id]: !prev[member._id] }))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {showActions[member._id] && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg z-10 border">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setEditingDesignation({ id: member._id, value: member.profile?.designation || '' });
                            setShowActions(prev => ({ ...prev, [member._id]: false }));
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-indigo-700"
                        >
                          <Briefcase className="inline h-4 w-4 mr-2" />
                          Edit Designation
                        </button>
                        <button
                          onClick={() => {
                            handleStatusToggle(member._id);
                            setShowActions(prev => ({ ...prev, [member._id]: false }));
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                        >
                          {member.isActive ? (
                            <><UserX className="inline h-4 w-4 mr-2" />Deactivate</>
                          ) : (
                            <><UserCheck className="inline h-4 w-4 mr-2" />Activate</>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteFaculty(member._id);
                            setShowActions(prev => ({ ...prev, [member._id]: false }));
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                        >
                          <Trash2 className="inline h-4 w-4 mr-2" />Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Faculty Details */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{member.email}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{member.profile?.department}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Designation:</span>
                  {editingDesignation?.id === member._id ? (
                    <div className="flex items-center gap-1 ml-2 flex-1">
                      <select
                        value={editingDesignation.value}
                        onChange={e => setEditingDesignation(prev => ({ ...prev, value: e.target.value }))}
                        className="flex-1 text-xs border border-indigo-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">— None —</option>
                        {DESIGNATION_OPTIONS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateDesignation(member._id, editingDesignation.value)}
                        disabled={savingDesignation}
                        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingDesignation ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingDesignation(null)}
                        className="text-xs px-2 py-1 border rounded text-gray-500 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesignationColor(member.profile?.designation)}`}>
                      {member.profile?.designation || <span className="text-gray-400 italic">Not set</span>}
                    </span>
                  )}
                </div>

                {member.profile?.officeRoom && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span>Office: {member.profile.officeRoom}</span>
                  </div>
                )}

                {member.profile?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{member.profile.phone}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Joined: {new Date(member.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login:</span>
                  <span className="text-sm text-gray-500">
                    {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {faculty.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty found</h3>
          <p className="text-gray-500">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement; 