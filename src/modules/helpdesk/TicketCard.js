// modules/helpdesk/TicketCard.js
import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Tag,
  ArrowRight
} from 'lucide-react';

const TicketCard = ({ ticket, onClick, isSelected, isAdminView = false }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_user': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending_user': return <User className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isOverdue = ticket.dueDate && new Date() > new Date(ticket.dueDate) && !['resolved', 'closed'].includes(ticket.status);
  const daysUntilDue = ticket.dueDate ? Math.ceil((new Date(ticket.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-transform duration-200 hover:shadow-md ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
      } hover:-translate-y-0.5`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {ticket.ticketNumber}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                  Overdue
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 break-words">
              {ticket.title}
            </h3>
          </div>
          <ArrowRight className={`h-5 w-5 text-gray-400 ${isSelected ? 'text-indigo-600' : ''}`} />
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 break-words mb-3">
          {ticket.description}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
            
            {ticket.dueDate && (
              <div className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {isOverdue ? 'Overdue' : `${daysUntilDue} days left`}
                </span>
              </div>
            )}

            {ticket.comments && ticket.comments.length > 0 && (
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{ticket.comments.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {ticket.category.replace('_', ' ')}
            </span>
            {ticket.department && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {ticket.department}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {ticket.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {ticket.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{ticket.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Admin View - Additional Info */}
        {isAdminView && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-1" />
                <span>
                  {ticket.reportedBy?.profile?.firstName} {ticket.reportedBy?.profile?.lastName}
                </span>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center text-gray-600">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Assigned
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketCard;
