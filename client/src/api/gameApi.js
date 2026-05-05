import axios from 'axios';
import API_BASE_URL from '../config/api.js';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    let parsedToken = token;
    try {
      const parsed = JSON.parse(token);
      if (typeof parsed === 'string') {
        parsedToken = parsed;
      }
    } catch (e) {
      // Not JSON, use as is
    }
    config.headers['x-auth-token'] = parsedToken;
  }
  return config;
});

export const getQuests = async () => {
  const res = await api.get('/quests/daily');
  return res.data;
};

export const claimQuest = async (questId) => {
  const res = await api.post('/quests/claim', { questId });
  return res.data;
};

export const getLeaderboards = async () => {
  const res = await api.get('/users/leaderboard');
  return res.data;
};

export const getBadges = async () => {
  const res = await api.get('/badges');
  return res.data;
};
