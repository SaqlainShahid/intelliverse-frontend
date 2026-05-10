import api from './api';

export const getForumPosts = async (filters = {}) => {
  const res = await api.get('/forum/posts', { params: filters });
  return res.data;
};

export const getForumPost = async (id) => {
  const res = await api.get(`/forum/posts/${id}`);
  return res.data;
};

export const createForumPost = async (payload) => {
  const res = await api.post('/forum/posts', payload);
  return res.data;
};

export const upvoteForumPost = async (id) => {
  const res = await api.patch(`/forum/posts/${id}/upvote`);
  return res.data;
};

export const deleteForumPost = async (id) => {
  const res = await api.delete(`/forum/posts/${id}`);
  return res.data;
};

export const postAnswer = async (postId, body) => {
  const res = await api.post(`/forum/posts/${postId}/answers`, { body });
  return res.data;
};

export const upvoteAnswer = async (postId, answerId) => {
  const res = await api.patch(`/forum/posts/${postId}/answers/${answerId}/upvote`);
  return res.data;
};

export const acceptAnswer = async (postId, answerId) => {
  const res = await api.patch(`/forum/posts/${postId}/answers/${answerId}/accept`);
  return res.data;
};

export const deleteAnswer = async (postId, answerId) => {
  const res = await api.delete(`/forum/posts/${postId}/answers/${answerId}`);
  return res.data;
};

export const forwardToFaculty = async (postId) => {
  const res = await api.post(`/forum/posts/${postId}/forward`);
  return res.data;
};
