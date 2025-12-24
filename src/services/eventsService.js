import api from './api';

const list = async (params = {}) => {
  const { data } = await api.get('/events', { params });
  return data;
};

const getCategories = async () => {
  const { data } = await api.get('/events/categories');
  return data;
};

const getById = async (id) => {
  const { data } = await api.get(`/events/${id}`);
  return data;
};

const create = async (payload) => {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'tags' && Array.isArray(v)) {
      form.append('tags', v.join(','));
    } else {
      form.append(k, v);
    }
  });
  const { data } = await api.post('/events', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

const update = async (id, payload) => {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'tags' && Array.isArray(v)) {
      form.append('tags', v.join(','));
    } else {
      form.append(k, v);
    }
  });
  const { data } = await api.put(`/events/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

const remove = async (id) => {
  const { data } = await api.delete(`/events/${id}`);
  return data;
};

const join = async (id) => {
  const { data } = await api.post(`/events/${id}/join`);
  return data;
};

const leave = async (id) => {
  const { data } = await api.post(`/events/${id}/leave`);
  return data;
};

const generateQr = async (id, expiresInMinutes = 120) => {
  const { data } = await api.post(`/events/${id}/qr`, { expiresInMinutes });
  return data;
};

const checkIn = async (id, code) => {
  const { data } = await api.post(`/events/${id}/checkin`, { code });
  return data;
};

const submitFeedback = async (id, payload) => {
  const { data } = await api.post(`/events/${id}/feedback`, payload);
  return data;
};

const getFeedback = async (id) => {
  const { data } = await api.get(`/events/${id}/feedback`);
  return data;
};

const sendReminders = async () => {
  const { data } = await api.post(`/events/reminders/send`);
  return data;
};

const resolveByCode = async (code) => {
  const { data } = await api.get(`/events/resolve`, { params: { code } });
  return data;
};

const downloadIcs = async (id) => {
  const res = await api.get(`/events/${id}/ics`, { responseType: 'blob' });
  return res.data;
};

const downloadAttendeesCsv = async (id) => {
  const res = await api.get(`/events/${id}/attendees.csv`, { responseType: 'blob' });
  return res.data;
};

const announce = async (id, payload) => {
  const { data } = await api.post(`/events/${id}/announce`, payload);
  return data;
};

const approve = async (id) => {
  const { data } = await api.patch(`/events/${id}/approve`);
  return data;
};

const reject = async (id, reason) => {
  const { data } = await api.patch(`/events/${id}/reject`, { reason });
  return data;
};

export default { list, getCategories, getById, create, update, remove, join, leave, generateQr, checkIn, submitFeedback, getFeedback, sendReminders, resolveByCode, downloadIcs, downloadAttendeesCsv, announce, approve, reject };
