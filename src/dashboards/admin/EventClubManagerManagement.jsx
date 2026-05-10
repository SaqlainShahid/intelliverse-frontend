import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const EventClubManagerManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('faculty');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (selectedTab === 'faculty') {
      fetchFaculty();
    } else {
      fetchManagers();
    }
  }, [selectedTab, search, department, page]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/faculty', {
        params: { search, department, page, limit: 10 }
      });
      setFaculty(response.data.data.faculty);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      alert('Failed to fetch faculty list');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/event-club-managers', {
        params: { search, department, page, limit: 10 }
      });
      setManagers(response.data.data.managers);
    } catch (error) {
      console.error('Error fetching Event & Club Managers:', error);
      const msg = error?.response?.data?.message || 'Failed to fetch Event & Club Managers';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const assignManager = async (facultyId) => {
    try {
      const response = await api.put(`/admin/event-manager/${facultyId}/assign`, {});
      const user = response?.data?.data?.user;
      if (user?.profile?.firstName && user?.profile?.lastName) {
        setSuccessMessage(`${user.profile.firstName} ${user.profile.lastName} is now an Event & Club Manager and will receive all event and club approvals.`);
      } else {
        setSuccessMessage(response?.data?.message || 'Assigned as Event & Club Manager');
      }
      setShowSuccessModal(true);
      fetchFaculty();
      fetchManagers();
    } catch (error) {
      console.error('Error assigning Event & Club Manager:', error);
      alert(error.response?.data?.message || 'Failed to assign Event & Club Manager');
    }
  };

  const removeManager = async (facultyId) => {
    try {
      const response = await api.put(`/admin/event-manager/${facultyId}/remove`, {});
      const user = response?.data?.data?.user;
      if (user?.profile?.firstName && user?.profile?.lastName) {
        setSuccessMessage(`${user.profile.firstName} ${user.profile.lastName} is no longer an Event & Club Manager.`);
      } else {
        setSuccessMessage(response?.data?.message || 'Event & Club Manager role removed');
      }
      setShowSuccessModal(true);
      fetchManagers();
    } catch (error) {
      console.error('Error removing Event & Club Manager:', error);
      alert(error.response?.data?.message || 'Failed to remove Event & Club Manager');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Event &amp; Club Manager</h2>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setSelectedTab('faculty')}
          className={`px-4 py-2 font-semibold ${
            selectedTab === 'faculty'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Assign Managers
        </button>
        <button
          onClick={() => setSelectedTab('managers')}
          className={`px-4 py-2 font-semibold ${
            selectedTab === 'managers'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Manage Managers
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Department..."
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-[scale-in_0.2s_ease-out]">
            <div className="bg-green-50 border-b-2 border-green-200 p-6 rounded-t-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Success!</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-center mb-6">
                {successMessage}
              </p>
              
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'faculty' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Department</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.length > 0 ? (
                    faculty.map((fac) => (
                      <tr key={fac._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {fac.profile.firstName} {fac.profile.lastName}
                        </td>
                        <td className="px-4 py-2">{fac.email}</td>
                        <td className="px-4 py-2">{fac.profile.department}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => assignManager(fac._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Assign as Event &amp; Club Manager
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                        No faculty found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'managers' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Department</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.length > 0 ? (
                    managers.map((mgr) => (
                      <tr key={mgr._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {mgr.profile.firstName} {mgr.profile.lastName}
                        </td>
                        <td className="px-4 py-2">{mgr.email}</td>
                        <td className="px-4 py-2">{mgr.profile.department}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeManager(mgr._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Remove Manager
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                        No Event &amp; Club Managers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventClubManagerManagement;
