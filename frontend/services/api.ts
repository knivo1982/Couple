import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userAPI = {
  create: async (name: string, gender: string) => {
    const response = await api.post('/users', { name, gender });
    return response.data;
  },
  get: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  joinCouple: async (userId: string, coupleCode: string) => {
    const response = await api.post(`/users/join-couple?user_id=${userId}&couple_code=${coupleCode}`);
    return response.data;
  },
};

export const cycleAPI = {
  save: async (userId: string, lastPeriodDate: string, cycleLength: number, periodLength: number) => {
    const response = await api.post('/cycle', {
      user_id: userId,
      last_period_date: lastPeriodDate,
      cycle_length: cycleLength,
      period_length: periodLength,
    });
    return response.data;
  },
  get: async (userId: string) => {
    const response = await api.get(`/cycle/${userId}`);
    return response.data;
  },
  getFertility: async (userId: string) => {
    const response = await api.get(`/cycle/fertility/${userId}`);
    return response.data;
  },
};

export const intimacyAPI = {
  log: async (coupleCode: string, date: string, qualityRating: number, createdBy: string, notes?: string) => {
    const response = await api.post('/intimacy', {
      couple_code: coupleCode,
      date,
      quality_rating: qualityRating,
      created_by: createdBy,
      notes,
    });
    return response.data;
  },
  getAll: async (coupleCode: string) => {
    const response = await api.get(`/intimacy/${coupleCode}`);
    return response.data;
  },
  delete: async (entryId: string) => {
    const response = await api.delete(`/intimacy/${entryId}`);
    return response.data;
  },
  getStats: async (coupleCode: string) => {
    const response = await api.get(`/intimacy/stats/${coupleCode}`);
    return response.data;
  },
};

export const challengeAPI = {
  getSuggestions: async () => {
    const response = await api.get('/challenges/suggestions');
    return response.data;
  },
  add: async (coupleCode: string, title: string, description: string, category: string) => {
    const response = await api.post('/challenges', {
      couple_code: coupleCode,
      title,
      description,
      category,
    });
    return response.data;
  },
  getAll: async (coupleCode: string) => {
    const response = await api.get(`/challenges/${coupleCode}`);
    return response.data;
  },
  complete: async (challengeId: string) => {
    const response = await api.put(`/challenges/${challengeId}/complete`);
    return response.data;
  },
  getRandom: async () => {
    const response = await api.get('/random-suggestion');
    return response.data;
  },
};

export default api;
