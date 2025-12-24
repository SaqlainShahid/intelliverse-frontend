// services/helpdeskService.js
import api from './api';

const helpdeskService = {
  // Get all tickets with filtering and pagination
  getAllTickets: async (params = {}) => {
    try {
      const response = await api.get('/helpdesk', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single ticket by ID
  getTicketById: async (ticketId) => {
    try {
      const response = await api.get(`/helpdesk/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/helpdesk', ticketData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update ticket
  updateTicket: async (ticketId, updateData) => {
    try {
      const response = await api.put(`/helpdesk/${ticketId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add comment to ticket
  addComment: async (ticketId, commentData) => {
    try {
      const response = await api.post(`/helpdesk/${ticketId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit feedback for ticket
  submitFeedback: async (ticketId, feedbackData) => {
    try {
      const response = await api.post(`/helpdesk/${ticketId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get ticket statistics (admin/faculty only)
  getTicketStats: async () => {
    try {
      const response = await api.get('/helpdesk/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete ticket (admin only)
  deleteTicket: async (ticketId) => {
    try {
      const response = await api.delete(`/helpdesk/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload file attachment
  uploadAttachment: async (ticketId, file) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      
      const response = await api.post(`/helpdesk/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download file attachment
  downloadAttachment: async (ticketId, filename) => {
    try {
      const response = await api.get(`/helpdesk/${ticketId}/attachments/${filename}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get ticket categories
  getCategories: () => {
    return [
      { value: 'academic', label: 'Academic', description: 'Transcript requests, enrollment letters, grade inquiries' },
      { value: 'administrative', label: 'Administrative', description: 'General administrative requests' },
      { value: 'it_support', label: 'IT Support', description: 'Technical issues, password resets, software problems' },
      { value: 'facilities', label: 'Facilities', description: 'Building maintenance, room bookings' },
      { value: 'financial', label: 'Financial', description: 'Fee inquiries, payment issues, scholarships' },
      { value: 'library', label: 'Library', description: 'Book requests, research assistance' },
      { value: 'transportation', label: 'Transportation', description: 'Bus schedules, parking issues' },
      { value: 'other', label: 'Other', description: 'Miscellaneous requests' }
    ];
  },

  // Get priority options
  getPriorities: () => {
    return [
      { value: 'low', label: 'Low', color: 'green', description: 'Non-urgent requests' },
      { value: 'medium', label: 'Medium', color: 'yellow', description: 'Standard requests' },
      { value: 'high', label: 'High', color: 'orange', description: 'Important requests' },
      { value: 'urgent', label: 'Urgent', color: 'red', description: 'Critical requests' }
    ];
  },

  // Get status options
  getStatuses: () => {
    return [
      { value: 'open', label: 'Open', color: 'blue', description: 'New ticket' },
      { value: 'in_progress', label: 'In Progress', color: 'yellow', description: 'Being worked on' },
      { value: 'pending_user', label: 'Pending User', color: 'purple', description: 'Waiting for user response' },
      { value: 'resolved', label: 'Resolved', color: 'green', description: 'Issue resolved' },
      { value: 'closed', label: 'Closed', color: 'gray', description: 'Ticket closed' },
      { value: 'cancelled', label: 'Cancelled', color: 'red', description: 'Ticket cancelled' }
    ];
  },

  // Get departments (same set used in Signup)
  getDepartments: () => {
    return [
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
  },

  // Helper function to format ticket data for display
  formatTicketForDisplay: (ticket) => {
    const categories = helpdeskService.getCategories();
    const priorities = helpdeskService.getPriorities();
    const statuses = helpdeskService.getStatuses();

    const category = categories.find(c => c.value === ticket.category);
    const priority = priorities.find(p => p.value === ticket.priority);
    const status = statuses.find(s => s.value === ticket.status);

    return {
      ...ticket,
      categoryLabel: category?.label || ticket.category,
      priorityLabel: priority?.label || ticket.priority,
      statusLabel: status?.label || ticket.status,
      priorityColor: priority?.color || 'gray',
      statusColor: status?.color || 'gray',
      isOverdue: ticket.dueDate && new Date() > new Date(ticket.dueDate) && !['resolved', 'closed'].includes(ticket.status),
      daysUntilDue: ticket.dueDate ? Math.ceil((new Date(ticket.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };
  },

  // Helper function to get ticket statistics for dashboard
  getDashboardStats: async () => {
    try {
      const stats = await helpdeskService.getTicketStats();
      return {
        total: stats.data.overview.total || 0,
        open: stats.data.overview.open || 0,
        inProgress: stats.data.overview.inProgress || 0,
        resolved: stats.data.overview.resolved || 0,
        closed: stats.data.overview.closed || 0,
        urgent: stats.data.overview.urgent || 0,
        overdue: stats.data.overview.overdue || 0,
        avgResolutionTime: stats.data.avgResolutionTime || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        urgent: 0,
        overdue: 0,
        avgResolutionTime: 0
      };
    }
  }
};

export default helpdeskService;
