// src/components/Dashboard.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Calendar, 
  HelpCircle, 
  Briefcase, 
  Search,
  Bot,
  Users,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  

  const modules = [
    {
      id: 'chat',
      title: 'Chat',
      description: 'Connect with peers and faculty',
      icon: MessageCircle,
      color: 'bg-blue-500',
      path: '/chat',
      available: true
    },
    {
      id: 'events',
      title: 'Events & Clubs',
      description: 'Discover campus events and activities',
      icon: Calendar,
      color: 'bg-green-500',
      path: '/events',
      available: true
    },
    {
      id: 'helpdesk',
      title: 'HelpDesk',
      description: 'Submit and track service requests',
      icon: HelpCircle,
      color: 'bg-orange-500',
      path: '/helpdesk',
      available: true
    },
    {
      id: 'career',
      title: 'Career Portal',
      description: 'AI-powered career guidance',
      icon: Briefcase,
      color: 'bg-purple-500',
      path: '/career',
      available: true
    },
    {
      id: 'lost-found',
      title: 'Lost & Found',
      description: 'Report lost or found items',
      icon: Search,
      color: 'bg-red-500',
      path: '/lost-found',
      available: true
    },
    {
      id: 'ai-chat',
      title: 'AI Assistant',
      description: 'Get instant answers to your queries',
      icon: Bot,
      color: 'bg-indigo-500',
      path: '/ai-chat',
      available: true
    }
  ];

  // Add admin module if user is admin
  if (user?.role === 'admin') {
    modules.unshift({
      id: 'admin',
      title: 'Admin Panel',
      description: 'Manage users and system settings',
      icon: Shield,
      color: 'bg-red-500',
      path: '/admin',
      available: true
    });
  }

  

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-primary-600">
            IntelliVerse {user?.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">ADMIN</span>}
          </h1>
        </div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.firstName}! 👋
          </h2>
          <p className="mt-2 text-gray-600">
            {user?.role === 'admin' 
              ? 'Admin dashboard - Manage your smart campus system'
              : 'Your smart campus companion is ready. What would you like to do today?'
            }
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              user?.role === 'admin' 
                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                : 'bg-gradient-to-br from-primary-500 to-primary-600'
            }`}>
              <span className="text-white text-xl font-bold">
                {user?.profile?.firstName?.charAt(0)}{user?.profile?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </h3>
              <p className="text-gray-600 capitalize">{user?.role}</p>
              <p className="text-sm text-gray-500">{user?.profile?.department}</p>
              {user?.role === 'student' && user?.profile?.studentId && (
                <p className="text-sm text-gray-500">ID: {user.profile.studentId}</p>
              )}
              {(user?.role === 'faculty' || user?.role === 'admin') && user?.profile?.employeeId && (
                <p className="text-sm text-gray-500">ID: {user.profile.employeeId}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last login</p>
              <p className="text-sm text-gray-900">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'First time'}
              </p>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => module.available ? navigate(module.path) : toast.info('Coming soon!')}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${!module.available ? 'opacity-75' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 ${module.color} rounded-lg flex items-center justify-center`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  {!module.available && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  )}
                  {module.id === 'admin' && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {module.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats (Role-based) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">5</p>
                <p className="text-gray-600 text-sm">Upcoming Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">2</p>
                <p className="text-gray-600 text-sm">Pending Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">12</p>
                <p className="text-gray-600 text-sm">Active Chats</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">3</p>
                <p className="text-gray-600 text-sm">Meetings Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">7</p>
                <p className="text-gray-600 text-sm">Career Alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI HelpDesk Assistant */}
        {/* Removed embedded Chatbot to keep single global launcher */}
      </main>
    </div>
  );
};

export default Dashboard;
