import api from './api';

export const createCollabRequest = async (payload) => {
  const res = await api.post('/collab/requests', payload);
  return res.data;
};

export const getCollabRequests = async (filters = {}) => {
  const res = await api.get('/collab/requests', { params: filters });
  return res.data;
};

export const respondToCollab = async (id, message = '') => {
  const res = await api.post(`/collab/requests/${id}/respond`, { message });
  return res.data;
};

export const acceptRespondent = async (requestId, respondentId) => {
  const res = await api.patch(`/collab/requests/${requestId}/respondents/${respondentId}/accept`);
  return res.data;
};

export const declineRespondent = async (requestId, respondentId) => {
  const res = await api.patch(`/collab/requests/${requestId}/respondents/${respondentId}/decline`);
  return res.data;
};

export const startTeamChat = async (requestId) => {
  const res = await api.post(`/collab/requests/${requestId}/team-chat`);
  return res.data;
};

export const closeCollabRequest = async (id) => {
  const res = await api.patch(`/collab/requests/${id}/close`);
  return res.data;
};

export const deleteCollabRequest = async (id) => {
  const res = await api.delete(`/collab/requests/${id}`);
  return res.data;
};
