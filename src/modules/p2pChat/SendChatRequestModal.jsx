import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { sendChatRequest } from '../../services/chatService';
import { getRoleColor, getRoleBadge, getMessageRequirement } from '../../utils/chatPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';
import ChatRequestStatusModal from './ChatRequestStatusModal';

const SendChatRequestModal = ({ user, isOpen, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: '', message: '', userName: '' });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const { requiresApproval, description } = getMessageRequirement(
    currentUser?.role,
    user.role
  );

  const handleSend = async () => {
    if (!message.trim() && requiresApproval) {
      toast.error('Please write a message to introduce yourself');
      return;
    }

    setLoading(true);
    try {
      const res = await sendChatRequest(user._id, message.trim() || null);
      
      // Close the request modal first
      setMessage('');
      onClose();
      
      // Show success status modal
      setStatusModal({
        isOpen: true,
        status: 'success',
        message: res.message || `Your chat request has been sent to ${user.profile?.firstName || user.firstName}`,
        userName: `${user.profile?.firstName || user.firstName} ${user.profile?.lastName || user.lastName}`
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Send chat request error:', error);
      
      // Close the request modal
      setMessage('');
      onClose();
      
      // Determine the status based on error
      const errorMessage = error.response?.data?.message || 'Failed to send chat request';
      let statusType = 'error';
      
      if (errorMessage.includes('already pending') || errorMessage.includes('Request already pending')) {
        statusType = 'already_sent';
      } else if (errorMessage.includes('already connected')) {
        statusType = 'already_connected';
      }
      
      // Show error status modal
      setStatusModal({
        isOpen: true,
        status: statusType,
        message: errorMessage,
        userName: `${user.profile?.firstName || user.firstName} ${user.profile?.lastName || user.lastName}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusModalClose = () => {
    setStatusModal({ isOpen: false, status: '', message: '', userName: '' });
  };

  return createPortal(
    <>
      {/* Animated Backdrop */}
      <div 
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      ></div>

      {/* Animated Modal Container */}
      <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{
          transform: isOpen ? 'scale(1)' : 'scale(0.95)'
        }}
      >
        {/* Modal Card */}
        <div 
          className="relative w-full max-w-md lg:max-w-lg pointer-events-auto transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(-20px)'
          }}
        >
        {/* Animated gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl sm:rounded-3xl blur-2xl"></div>

        {/* Main card */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border border-white/40 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Send Chat Request</h2>
            <p className="text-sm sm:text-base text-gray-600">Connect with {user.profile.firstName}</p>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} p-1 flex-shrink-0 shadow-lg`}>
                <img
                  src={user.profilePicture || user.profile?.profilePicture || (user.profile?.avatar ? `http://localhost:5000${user.profile.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.firstName + ' ' + user.profile?.lastName)}&background=random&size=128`)}
                  alt={user.profile?.firstName || user.firstName}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.profile?.firstName || user.firstName) + ' ' + (user.profile?.lastName || user.lastName))}&background=random&size=128`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  {user.profile?.firstName || user.firstName} {user.profile?.lastName || user.lastName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">{getRoleBadge(user.role)}</p>
                {user.profile?.designation && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{user.profile.designation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Permission Info */}
          <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 ${
            requiresApproval
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <p className={`text-xs sm:text-sm font-medium ${
              requiresApproval ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {requiresApproval ? '⏳' : '✅'} {description}
            </p>
            {requiresApproval && (
              <p className="text-xs text-yellow-700 mt-1 sm:mt-2">
                A message is recommended to help them understand your reason for connecting.
              </p>
            )}
          </div>

          {/* Message Input */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              {requiresApproval ? 'Message (required)' : 'Message (optional)'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                requiresApproval
                  ? 'Hi! I would like to connect with you because...'
                  : 'Add a personal message (optional)'
              }
              maxLength={500}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
            />
            <div className="text-xs text-gray-500 mt-1 sm:mt-2">
              {message.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-200/80 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all font-medium order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading || (requiresApproval && !message.trim())}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Status Modal */}
      <ChatRequestStatusModal
        isOpen={statusModal.isOpen}
        onClose={handleStatusModalClose}
        status={statusModal.status}
        message={statusModal.message}
        userName={statusModal.userName}
      />
    </>,
    document.body
  );
};

export default SendChatRequestModal;
