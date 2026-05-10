import api from '../../services/api';

export const getTickets = async (params = {}) => {
  const res = await api.get('/helpdesk/tickets', { params });
  return res.data;
};

export const updateTicket = async ({ ticketId, status, adminReply }) => {
  const res = await api.post('/helpdesk/update', { ticketId, status, adminReply });
  return res.data;
};

