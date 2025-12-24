import api from '../../services/api';

export const getInternships = async (params = {}) => {
  const { data } = await api.get('/career/internships', { params });
  return data?.data || { items: [], pagination: {} };
};

export const getTips = async (params = {}) => {
  const { data } = await api.get('/career/tips', { params });
  return data?.data || [];
};

export const chat = async ({ message, skills = [], intent = '', signal }) => {
  const { data } = await api.post('/career/chat', { message, skills, intent }, { signal });
  return data?.data || { answer: '' };
};

export const getChatHistory = async (limit = 100) => {
  const { data } = await api.get(`/career/chat/history?limit=${limit}`);
  return data?.data || { messages: [] };
};

export const clearChatHistory = async () => {
  const { data } = await api.delete('/career/chat/history');
  return data?.data || { deleted: 0 };
};

export const improveResume = async ({ role, resumeText, tone }) => {
  const { data } = await api.post('/career/resume/improve', { role, resumeText, tone });
  return data?.data || { advice: '' };
};

export const adminCreateInternship = async (payload) => {
  const { data } = await api.post('/career/internships', payload);
  return data?.data;
};

export const adminUpdateInternship = async (id, payload) => {
  const { data } = await api.put(`/career/internships/${id}`, payload);
  return data?.data;
};

export const adminDeleteInternship = async (id) => {
  const { data } = await api.delete(`/career/internships/${id}`);
  return data?.success;
};

export const adminListManageInternships = async (params = {}) => {
  const { data } = await api.get('/career/internships/manage', { params });
  return data?.data || { items: [], total: 0 };
};

export const adminChangeInternshipStatus = async (id, status) => {
  const { data } = await api.patch(`/career/internships/${id}/status`, { status });
  return data?.data;
};

export const applyInternship = async (id, coverLetter = '') => {
  const { data } = await api.post(`/career/internships/${id}/apply`, { coverLetter });
  return data?.data;
};

export const adminListApplications = async (params = {}) => {
  const { data } = await api.get(`/career/applications`, { params });
  return data?.data || { items: [], total: 0 };
};

export const adminUpdateApplication = async (id, payload) => {
  const { data } = await api.patch(`/career/applications/${id}`, payload);
  return data?.data;
};

export const getMyApplications = async (params = {}) => {
  const { data } = await api.get('/career/applications/my', { params });
  return data?.data || { items: [], total: 0 };
};
