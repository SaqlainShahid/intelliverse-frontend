// modules/helpdesk/TicketList.js
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Tag
} from 'lucide-react';
import TicketCard from './TicketCard';
import TicketDetails from './TicketDetails';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import helpdeskService from '../../services/helpdeskService';

const TicketList = ({ 
  tickets, 
  loading, 
  filters, 
  onFiltersChange, 
  onTicketSelect, 
  selectedTicket,
  onUpdateTicket,
  onAddComment,
  onSubmitFeedback,
  isAdminView = false,
  pagination,
  onDeleteTicket
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = helpdeskService.getCategories();
  const priorities = helpdeskService.getPriorities();
  const statuses = helpdeskService.getStatuses();

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      priority: '',
      category: '',
      department: '',
      search: ''
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !filters.search || 
      ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || ticket.status === filters.status;
    const matchesPriority = !filters.priority || ticket.priority === filters.priority;
    const matchesCategory = !filters.category || ticket.category === filters.category;
    const matchesDepartment = !filters.department || ticket.department === filters.department;
    const staffDeptRule = (user?.role === 'faculty' || user?.role === 'hod')
      ? ((user?.profile?.department) ? ((ticket.department || '').toLowerCase() === user.profile.department.toLowerCase()) : false)
      : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDepartment && staffDeptRule;
  });

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 overflow-x-hidden">
      {/* Left Panel - Ticket List */}
      <div className="w-full md:flex-1 md:pr-6 h-full overflow-y-auto">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className={`px-3 py-1 rounded text-sm ${!filters.status ? 'bg-white shadow-sm text-gray-800' : 'text-gray-700 hover:bg-white'}`}
                >
                  All
                </button>
                {['open','in_progress','resolved','closed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFilterChange('status', s)}
                    className={`px-3 py-1 rounded text-sm ${filters.status === s ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-700 hover:bg-white'}`}
                  >
                    {statuses.find(st => st.value === s)?.label || s}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sort</label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="createdAt">Created</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                </select>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {(filters.status || filters.priority || filters.category || filters.department) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.status && (
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    Status: {statuses.find(s => s.value === filters.status)?.label || filters.status}
                    <span className="ml-2 text-blue-700">×</span>
                  </button>
                )}
                {filters.priority && (
                  <button
                    onClick={() => handleFilterChange('priority', '')}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                  >
                    Priority: {priorities.find(p => p.value === filters.priority)?.label || filters.priority}
                    <span className="ml-2 text-yellow-700">×</span>
                  </button>
                )}
                {filters.category && (
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                  >
                    Category: {categories.find(c => c.value === filters.category)?.label || filters.category}
                    <span className="ml-2 text-gray-700">×</span>
                  </button>
                )}
                {filters.department && (
                  <button
                    onClick={() => handleFilterChange('department', '')}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                  >
                    Department: {filters.department}
                    <span className="ml-2 text-green-700">×</span>
                  </button>
                )}
              </div>
            )}

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Priorities</option>
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ticket List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                onClick={() => onTicketSelect(ticket)}
                isSelected={selectedTicket?._id === ticket._id}
                isAdminView={isAdminView}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500">
                {filters.search || filters.status || filters.priority || filters.category
                  ? 'Try adjusting your filters or search terms'
                  : 'No tickets have been created yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => onFiltersChange(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border rounded bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => onFiltersChange(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border rounded bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Ticket Details */}
      {selectedTicket && (
        <div className="w-full md:w-1/2 h-full overflow-y-auto mt-6 md:mt-0">
          <TicketDetails
            ticket={selectedTicket}
            onUpdate={onUpdateTicket}
            onAddComment={onAddComment}
            onSubmitFeedback={onSubmitFeedback}
            isAdminView={isAdminView}
            onClose={() => onTicketSelect(null)}
            onDeleteTicket={onDeleteTicket}
            onViewFull={() => navigate(`/helpdesk/tickets/${selectedTicket._id}`)}
          />
        </div>
      )}
    </div>
  );
};

export default TicketList;
