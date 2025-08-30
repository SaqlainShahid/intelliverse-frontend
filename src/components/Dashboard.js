// src/components/Dashboard.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Calendar, 
  HelpCircle, 
  Briefcase, 
  Search,
  Bell,
  Settings,
  LogOut,
  Bot,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

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

  const quickActions = [
    { title: 'Notifications', icon: Bell, count: 5, path: '/notifications' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">IntelliVerse</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition duration-200"
                  title={action.title}
                >
                  <action.icon className="h-5 w-5" />
                  {action.count && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {action.count}
                    </span>
                  )}
                </button>
              ))}
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.profile?.firstName?.charAt(0)}{user?.profile?.lastName?.charAt(0)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.firstName}! 👋
          </h2>
          <p className="mt-2 text-gray-600">
            Your smart campus companion is ready. What would you like to do today?
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
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
              {user?.role === 'faculty' && user?.profile?.employeeId && (
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
      </main>
    </div>
  );
};

export default Dashboard;