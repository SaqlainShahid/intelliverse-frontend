import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Send, UserCheck, UserX, Info } from 'lucide-react';

const ChatRequestStatusModal = ({ isOpen, onClose, status, message, userName }) => {
  if (!isOpen) return null;

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Request Sent Successfully! 🎉',
      description: message || `Your chat request has been sent to ${userName}. They will be notified.`,
      buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
    },
    already_sent: {
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      title: 'Request Already Sent',
      description: message || `You have already sent a chat request to ${userName}. Please wait for their response.`,
      buttonColor: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
    },
    already_connected: {
      icon: UserCheck,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      title: 'Already Connected',
      description: message || `You are already connected with ${userName}. You can start chatting!`,
      buttonColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
    },
    accepted: {
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Request Accepted! 🎊',
      description: message || `${userName} has accepted your chat request. You can now start messaging!`,
      buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
    },
    declined: {
      icon: UserX,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Request Declined',
      description: message || `${userName} has declined your chat request.`,
      buttonColor: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Failed to Send Request',
      description: message || 'Something went wrong while sending your request. Please try again.',
      buttonColor: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
    }
  };

  const config = statusConfig[status] || statusConfig.error;
  const Icon = config.icon;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-sm transform transition-all duration-300 animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>

          {/* Card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl">
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
              <Icon className={`w-10 h-10 ${config.color}`} />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {config.title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {config.description}
            </p>

            {/* Action Button */}
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${config.buttonColor}`}
            >
              {status === 'accepted' ? 'Start Chatting' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ChatRequestStatusModal;
