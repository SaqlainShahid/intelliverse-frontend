/**
 * Chat Permission Utility
 * Handles role-based messaging hierarchy
 */

export const ROLE_HIERARCHY = {
  admin: 0,
  hod: 1,
  faculty: 2,
  student: 3
};

/**
 * Check if a user can message another user without approval
 * @param {string} senderRole - The role of the user sending the message
 * @param {string} recipientRole - The role of the user receiving the message
 * @returns {boolean} - True if no approval is needed
 */
export const canMessageWithoutApproval = (senderRole, recipientRole) => {
  // Admin can message everyone
  if (senderRole === 'admin') {
    return true;
  }

  // HOD can message anyone except admin
  if (senderRole === 'hod') {
    return recipientRole !== 'admin';
  }

  // Faculty can message students only
  if (senderRole === 'faculty') {
    return recipientRole === 'student';
  }

  // Students need approval from everyone
  if (senderRole === 'student') {
    return false;
  }

  return false;
};

/**
 * Get a description of the messaging requirement
 * @param {string} senderRole - The role of the user sending the message
 * @param {string} recipientRole - The role of the user receiving the message
 * @returns {object} - Object with requiresApproval and description
 */
export const getMessageRequirement = (senderRole, recipientRole) => {
  const requiresApproval = !canMessageWithoutApproval(senderRole, recipientRole);

  let description = '';
  let emoji = '✅';

  if (senderRole === 'admin') {
    description = 'You can message anyone as an Admin';
    emoji = '👤';
  } else if (senderRole === 'hod') {
    if (requiresApproval) {
      description = 'Requires approval from Admin';
      emoji = '⏳';
    } else {
      description = 'You can message Faculty and Students';
      emoji = '✅';
    }
  } else if (senderRole === 'faculty') {
    if (requiresApproval) {
      description = 'Requires approval from HOD or Admin';
      emoji = '⏳';
    } else {
      description = 'You can message your Students';
      emoji = '✅';
    }
  } else if (senderRole === 'student') {
    description = 'Requires approval from all users';
    emoji = '⏳';
  }

  return { requiresApproval, description, emoji };
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role) => {
  const colors = {
    admin: 'from-red-500 to-red-600',
    hod: 'from-purple-500 to-purple-600',
    faculty: 'from-blue-500 to-blue-600',
    student: 'from-green-500 to-green-600'
  };
  return colors[role] || 'from-gray-500 to-gray-600';
};

/**
 * Get role badge text
 */
export const getRoleBadge = (role) => {
  const badges = {
    admin: '👤 Admin',
    hod: '🎓 HOD',
    faculty: '📚 Faculty',
    student: '👨‍🎓 Student'
  };
  return badges[role] || role;
};

const chatPermissions = {
  canMessageWithoutApproval,
  getMessageRequirement,
  getRoleColor,
  getRoleBadge,
  ROLE_HIERARCHY
};

export default chatPermissions;
