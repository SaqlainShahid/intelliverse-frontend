import api from '../../services/api';

export const ask = async (query) => {
  const res = await api.post('/chatbot/ask', { query: query });
  return res.data;
};

export const escalate = async ({ query, aiAnswer, confidence }) => {
  const res = await api.post('/chatbot/escalate', { query, aiAnswer, confidence });
  return res.data;
};
