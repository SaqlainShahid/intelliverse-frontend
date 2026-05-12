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
    department: '',
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
      const ticketsResponse = await helpdeskService.getAllTickets(filters);
      const items = ticketsResponse.data.tickets || [];
      setTickets(items);
      setPagination(ticketsResponse.data.pagination || { currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
      if (user?.role === 'admin') {
        const statsResponse = await helpdeskService.getDashboardStats();
        setStats(statsResponse);
      } else {
        const dept = (user?.profile?.department || '').toLowerCase();
        const scopedItems = (user?.role === 'faculty' || user?.role === 'hod')
          ? items.filter(t => (t.department || '').toLowerCase() === dept)
          : items;
        const now = new Date();
        const resolvedItems = scopedItems.filter(t => ['resolved', 'closed'].includes(t.status) && t.resolvedAt);
        const avgDays = resolvedItems.length
          ? Math.round(resolvedItems.reduce((sum, t) => sum + Math.max(0, (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60 * 24)), 0) / resolvedItems.length)
          : 0;
        setStats({
          total: scopedItems.length,
          open: scopedItems.filter(t => t.status === 'open').length,
          inProgress: scopedItems.filter(t => t.status === 'in_progress').length,
          resolved: scopedItems.filter(t => t.status === 'resolved').length,
          closed: scopedItems.filter(t => t.status === 'closed').length,
          urgent: scopedItems.filter(t => t.priority === 'urgent').length,
          overdue: scopedItems.filter(t => t.dueDate && new Date(t.dueDate) < now && !['resolved','closed'].includes(t.status)).length,
          avgResolutionTime: avgDays
        });
      }
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

  useEffect(() => {
    if (user?.role === 'faculty' || user?.role === 'hod') {
      setFilters(prev => {
        const dept = user?.profile?.department || '';
        return prev.department === dept ? prev : { ...prev, department: dept };
      });
    } else if (user && user.role !== 'faculty' && user.role !== 'hod') {
      setFilters(prev => (prev.department ? { ...prev, department: '' } : prev));
    }
  }, [user]);

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
  if (user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'hod') {
    tabs.push({ id: 'manage', label: 'Manage Tickets', icon: Users });
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-b-[2.5rem] p-8 sm:p-12 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)] overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner self-start sm:self-center">
              <AlertCircle className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight drop-shadow-md text-white">HelpDesk</h1>
              <p className="mt-2 text-indigo-100 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                Submit and track service requests seamlessly across all campus departments.
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
            <p className="text-sm text-indigo-100 font-medium uppercase tracking-wider mb-1">Welcome back</p>
            <p className="font-bold text-white text-lg">
              {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-start">
          <div className="inline-flex bg-white/60 backdrop-blur-xl border border-white/50 p-1.5 rounded-2xl shadow-sm overflow-x-auto max-w-full no-scrollbar">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon || Calendar;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center whitespace-nowrap space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]'
                        : 'text-gray-500 hover:text-indigo-600 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
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
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-sm p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => setActiveTab('create')}
                  className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-4 bg-indigo-100/50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-4">
                     <Plus className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 mb-1">Create New Ticket</p>
                    <p className="text-xs text-gray-500 font-medium">Submit a service request</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white border border-green-100 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-4 bg-green-100/50 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors mb-4">
                    <Calendar className="h-8 w-8 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 mb-1">View My Tickets</p>
                    <p className="text-xs text-gray-500 font-medium">Track your requests</p>
                  </div>
                </button>
                {(user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'hod') && (
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-white border border-purple-100 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="p-4 bg-purple-100/50 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors mb-4">
                      <Users className="h-8 w-8 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 mb-1">Manage Tickets</p>
                      <p className="text-xs text-gray-500 font-medium">Admin & Faculty panel</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Recent Tickets</h3>
                <button onClick={() => setActiveTab('tickets')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
              </div>
              <div className="p-2 sm:p-4">
                {(() => {
                  const dept = user?.profile?.department || '';
                  const recentTickets = (user?.role === 'faculty' || user?.role === 'hod')
                    ? tickets.filter(t => (t.department || '').toLowerCase() === dept.toLowerCase())
                    : tickets;
                  return recentTickets.length > 0 ? (
                  <div className="space-y-2">
                    {recentTickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket._id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setActiveTab('tickets');
                        }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-transparent hover:border-indigo-100 rounded-2xl hover:bg-indigo-50/30 cursor-pointer transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:-translate-y-0.5 group"
                        >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-widest">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-black rounded text-white shadow-sm ${
                              ticket.priority === 'urgent' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                              ticket.priority === 'high' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                              ticket.priority === 'medium' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                              'bg-gradient-to-r from-emerald-400 to-teal-500'
                            }`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-black rounded-full border shadow-sm ${
                              ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              ticket.status === 'closed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors drop-shadow-sm">{ticket.title}</p>
                        </div>
                        <div className="text-left sm:text-right mt-3 sm:mt-0">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                            {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mb-3 opacity-50" />
                    <p className="font-medium text-sm">No recent tickets found</p>
                  </div>
                );
                })()}
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

        {/* Manage Tickets Tab (Admin/Faculty/HOD) */}
        {activeTab === 'manage' && (user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'hod') && (
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
