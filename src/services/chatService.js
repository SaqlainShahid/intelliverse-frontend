import api from './api';

export const createOrGetChat = async (recipientId) => {
  const res = await api.post('/p2p/chats', { recipientId });
  return res.data;
};

export const getChats = async () => {
  const res = await api.get('/p2p/chats');
  return res.data;
};

export const getMessages = async (chatId, limit = 50) => {
  const res = await api.get(`/p2p/chats/${chatId}/messages`, { params: { limit } });
  return res.data;
};

export const getChatDetails = async (chatId) => {
  const res = await api.get(`/p2p/chats/${chatId}`);
  return res.data;
};

export const searchMessages = async (chatId, q, limit = 20) => {
  const res = await api.get(`/p2p/chats/${chatId}/search`, { params: { q, limit } });
  return res.data;
};

export const searchUsers = async (search, limit = 8) => {
  const res = await api.get('/p2p/users', { params: { search, limit } });
  return res.data;
};

export const getPeers = async (limit = 10) => {
  const res = await api.get('/p2p/peers', { params: { limit } });
  return res.data;
};

export const getTopInteractions = async ({ limit = 10, windowDays = 7, sort = 'time' } = {}) => {
  const res = await api.get('/p2p/top', { params: { limit, windowDays, sort } });
  return res.data;
};

// ShadowMute API
export const getMutedUsers = async () => {
  const res = await api.get('/user/mute');
  return res.data;
};
export const muteUser = async (userId) => {
  const res = await api.post('/user/mute', { userId });
  return res.data;
};
export const unmuteUser = async (userId) => {
  const res = await api.post('/user/unmute', { userId });
  return res.data;
};

export const uploadMedia = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/p2p/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export const updateChatSettings = async (chatId, settings) => {
  const res = await api.patch(`/p2p/chats/${chatId}/settings`, settings);
  return res.data;
};

export const leaveGroup = async (chatId) => {
  const res = await api.patch(`/p2p/chats/${chatId}/leave`);
  return res.data;
};

export const updateGroupName = async (chatId, name) => {
  const res = await api.patch(`/p2p/chats/${chatId}/name`, { name });
  return res.data;
};

export const updateGroupMembers = async (chatId, action, userId) => {
  const res = await api.patch(`/p2p/chats/${chatId}/members`, { action, userId });
  return res.data;
};

export const updateGroupAdmins = async (chatId, action, userId) => {
  const res = await api.patch(`/p2p/chats/${chatId}/admins`, { action, userId });
  return res.data;
};

export const autoCreateGroup = async (payload) => {
  const res = await api.post('/p2p/groups/auto-create', payload);
  return res.data;
};

export const getAdminGroups = async (category) => {
  const params = {};
  if (category) params.category = category;
  const res = await api.get('/p2p/groups', { params });
  return res.data;
};

export const getGroupMeta = async () => {
  const res = await api.get('/p2p/groups/meta');
  return res.data;
};

// Archive API
export const getArchivedChats = async () => {
  const res = await api.get('/user/archived');
  return res.data;
};
export const archiveChat = async (chatId) => {
  const res = await api.post('/user/archive', { chatId });
  return res.data;
};
export const unarchiveChat = async (chatId) => {
  const res = await api.post('/user/unarchive', { chatId });
  return res.data;
};

export const deleteChat = async (chatId) => {
  const res = await api.post(`/p2p/chats/${chatId}/delete`);
  return res.data;
};
