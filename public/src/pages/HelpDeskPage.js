// pages/HelpDeskPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import TicketForm from '../modules/helpdesk/TicketForm';
import TicketList from '../modules/helpdesk/TicketList';
import TicketDetails from '../modules/helpdesk/TicketDetails';
import StatsCard from '../modules/helpdesk/StatsCard';
import helpdeskService from '../services/helpdeskService';
import toast from 'react-hot-toast';

const HelpDeskPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    overdue: 0,
    avgResolutionTime: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Load tickets and stats
  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsResponse, statsResponse] = await Promise.all([
        helpdeskService.getAllTickets(filters),
        helpdeskService.getDashboardStats()
      ]);
      
      setTickets(ticketsResponse.data.tickets || []);
      setPagination(ticketsResponse.data.pagination || { currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await helpdeskService.createTicket(ticketData);
      toast.success('Ticket created successfully');
      setActiveTab('tickets');
      loadData();
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create ticket');
      throw error;
    }
  };

  const handleUpdateTicket = async (ticketId, updateData) => {
    try {
      const response = await helpdeskService.updateTicket(ticketId, updateData);
      toast.success('Ticket updated successfully');
      loadData();
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(response.data);
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update ticket');
      throw error;
    }
  };

  const handleAddComment = async (ticketId, commentData) => {
    try {
      const response = await helpdeskService.addComment(ticketId, commentData);
      toast.success('Comment added successfully');
      loadData();
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(response.data);
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
      throw error;
    }
  };

  const handleSubmitFeedback = async (ticketId, feedbackData) => {
    try {
      const response = await helpdeskService.submitFeedback(ticketId, feedbackData);
      toast.success('Feedback submitted successfully');
      loadData();
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(response.data);
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to submit feedback');
      throw error;
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await helpdeskService.deleteTicket(ticketId);
      toast.success('Ticket deleted');
      setSelectedTicket(null);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete ticket');
      throw error;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'tickets', label: 'My Tickets', icon: Calendar },
    { id: 'create', label: 'Create Ticket', icon: Plus }
  ];

  // Add admin tabs
  if (user?.role === 'admin' || user?.role === 'faculty') {
    tabs.push({ id: 'manage', label: 'Manage Tickets', icon: Users });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HelpDesk</h1>
              <p className="text-gray-600 mt-1">Submit and track service requests</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="font-medium text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-gray-100 rounded-lg p-2">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon || Calendar;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-700' : 'text-gray-500'}`} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Tickets"
                value={stats.total}
                icon={Calendar}
                color="blue"
                trend={stats.total > 0 ? '+12%' : '0%'}
              />
              <StatsCard
                title="Open Tickets"
                value={stats.open}
                icon={AlertCircle}
                color="yellow"
                trend={stats.open > 0 ? '+5%' : '0%'}
              />
              <StatsCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle}
                color="green"
                trend={stats.resolved > 0 ? '+8%' : '0%'}
              />
              <StatsCard
                title="Overdue"
                value={stats.overdue}
                icon={XCircle}
                color="red"
                trend={stats.overdue > 0 ? '+2%' : '0%'}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('create')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-indigo-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Create New Ticket</p>
                    <p className="text-sm text-gray-500">Submit a service request</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View My Tickets</p>
                    <p className="text-sm text-gray-500">Track your requests</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-8 w-8 text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Tickets</p>
                    <p className="text-sm text-gray-500">Admin panel</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
              </div>
              <div className="p-6">
                {tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket._id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setActiveTab('tickets');
                        }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm cursor-pointer transition"
                        >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{ticket.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tickets found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="h-[calc(100vh-220px)]">
            <TicketList
              tickets={tickets}
              loading={loading}
              filters={filters}
              onFiltersChange={setFilters}
              onTicketSelect={setSelectedTicket}
              selectedTicket={selectedTicket}
              onUpdateTicket={handleUpdateTicket}
              onAddComment={handleAddComment}
              onSubmitFeedback={handleSubmitFeedback}
              pagination={pagination}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        )}

        {/* Create Ticket Tab */}
        {activeTab === 'create' && (
          <TicketForm
            onSubmit={handleCreateTicket}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {/* Manage Tickets Tab (Admin/Faculty) */}
        {activeTab === 'manage' && (user?.role === 'admin' || user?.role === 'faculty') && (
          <div className="h-[calc(100vh-220px)]">
            <TicketList
              tickets={tickets}
              loading={loading}
              filters={filters}
              onFiltersChange={setFilters}
              onTicketSelect={setSelectedTicket}
              selectedTicket={selectedTicket}
              onUpdateTicket={handleUpdateTicket}
              onAddComment={handleAddComment}
              onSubmitFeedback={handleSubmitFeedback}
              isAdminView={true}
              pagination={pagination}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpDeskPage;
