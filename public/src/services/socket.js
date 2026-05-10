import { io } from 'socket.io-client';

let socket = null;

const getAccessToken = () => localStorage.getItem('accessToken');
const baseUrl = (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

export const getSocket = () => {
  if (socket && socket.connected) return socket;
  const token = getAccessToken();
  socket = io(baseUrl, { transports: ['websocket'], auth: { token } });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }
};

