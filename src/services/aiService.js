import api from './api';

export const sendAiQuery = async (message) => {
  try {
    const response = await api.post('/ai/query', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMyQueries = async () => {
  try {
    const response = await api.get('/ai/my-queries');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getQueries = async (filters = {}) => {
  try {
    const response = await api.get('/ai/queries', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const replyToQuery = async (id, message, status) => {
  try {
    const response = await api.patch(`/ai/queries/${id}/reply`, { message, status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const escalateQuery = async (id) => {
  try {
    const response = await api.patch(`/ai/queries/${id}/escalate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const transferQuery = async (id, toDepartment, note = '') => {
  try {
    const response = await api.patch(`/ai/queries/${id}/transfer`, { toDepartment, note });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const addQueryCollaborator = async (id, department) => {
  try {
    const response = await api.post(`/ai/queries/${id}/collaborators`, { department });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getDepartments = async () => {
    try {
        const response = await api.get('/ai/departments');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}