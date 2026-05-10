import { io } from 'socket.io-client';

const getAccessToken = () => localStorage.getItem('accessToken');

export const createSocket = () => {
  const token = getAccessToken();
  const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
    transports: ['websocket'],
    auth: { token },
  });
  return socket;
};
