import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../dashboards/admin';
import { HodDashboard } from '../dashboards/hod';
import { StudentDashboard } from '../dashboards/student';
import { FacultyDashboard } from '../dashboards/faculty';

const RoleDashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please login to access the dashboard</p>
        </div>
      </div>
    );
  }

  // Show dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="w-full min-h-screen">
            <AdminDashboard />
          </div>
        );

      case 'hod':
        return (
          <div className="w-full">
            <HodDashboard />
          </div>
        );

      case 'faculty':
        if (!user.isApproved && user.approvalStatus === 'pending') {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
                <p className="text-gray-600 mb-4">
                  Your account is waiting for approval from your department HOD.
                </p>
                <p className="text-sm text-gray-500">
                  Department: {user.profile?.department}
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Once approved by your HOD, you'll have full access to the platform.
                  </p>
                </div>
              </div>
            </div>
          );
        } else if (user.approvalStatus === 'rejected') {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
                <p className="text-gray-600 mb-4">
                  Your application has been rejected by your department HOD.
                </p>
                {user.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                    <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
                    <p className="text-sm text-red-700">{user.rejectionReason}</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-4">
                  Please contact your department HOD for more information.
                </p>
              </div>
            </div>
          );
        }
        // Faculty approved dashboard
        return (
          <div className="w-full">
            <FacultyDashboard />
          </div>
        );

      case 'student':
        return (
          <div className="w-full">
            <StudentDashboard />
          </div>
        );

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600">Unknown user role</p>
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen">{renderDashboard()}</div>;
};

export default RoleDashboard;
