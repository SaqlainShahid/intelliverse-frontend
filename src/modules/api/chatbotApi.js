import api from '../../services/api';

export const ask = async (query) => {
  const res = await api.post('/chatbot/ask', { query: query });
  return res.data?.data || {};
};

export const escalate = async ({ query, aiAnswer, confidence }) => {
  const res = await api.post('/chatbot/escalate', { query, aiAnswer, confidence });
  return res.data;
};

export const getHistory = async (limit = 100) => {
  const res = await api.get(`/chatbot/history?limit=${limit}`);
  return res.data?.data || { messages: [] };
};

export const clearHistory = async () => {
  const res = await api.delete('/chatbot/history');
  return res.data?.data || { deleted: 0 };
};
