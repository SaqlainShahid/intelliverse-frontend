import api from './api';

const list = async (params = {}) => {
  const { data } = await api.get('/clubs', { params });
  return data;
};

const getById = async (id) => {
  const { data } = await api.get(`/clubs/${id}`);
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
  const { data } = await api.post('/clubs', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
  const { data } = await api.put(`/clubs/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

const remove = async (id) => {
  const { data } = await api.delete(`/clubs/${id}`);
  return data;
};

const join = async (id) => {
  const { data } = await api.post(`/clubs/${id}/join`);
  return data;
};

const leave = async (id) => {
  const { data } = await api.post(`/clubs/${id}/leave`);
  return data;
};

const generateQr = async (id) => {
  const { data } = await api.post(`/clubs/${id}/qr`);
  return data;
};

const resolveByCode = async (code) => {
  const { data } = await api.get(`/clubs/resolve`, { params: { code } });
  return data;
};

const announce = async (id, payload) => {
  const { data } = await api.post(`/clubs/${id}/announce`, payload);
  return data;
};

export default { list, getById, create, update, remove, join, leave, generateQr, resolveByCode, announce };
