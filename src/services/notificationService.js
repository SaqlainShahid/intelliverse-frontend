import api from './api';

export const getNotifications = async (params = {}) => {
  const res = await api.get('/notifications', { params });
  return res.data;
};

export const markNotificationsRead = async ({ ids = [], all = false } = {}) => {
  const res = await api.post('/notifications/read', { ids, all });
  return res.data;
};

export const clearAllNotifications = async () => {
  const res = await api.post('/notifications/clear');
  return res.data;
};

