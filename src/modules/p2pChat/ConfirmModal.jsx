import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
      border: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      button: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
      border: 'border-yellow-200'
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;
  const Icon = style.icon;

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
          className="relative w-full max-w-md transform transition-all duration-300 animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-rose-500/10 rounded-3xl blur-2xl"></div>

          {/* Card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/40 shadow-2xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${style.iconBg} border-2 ${style.border} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${style.iconColor}`} />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
              {title}
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed text-sm sm:text-base">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full sm:flex-1 px-4 py-2.5 sm:px-6 sm:py-3 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl ${style.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ConfirmModal;
