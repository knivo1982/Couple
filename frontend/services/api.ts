import axios from 'axios';

// Production URL for your backend server
const PRODUCTION_API_URL = 'https://couplebliss.edercomm.it';

// Use production URL for builds, fallback to env variable for development
const API_URL = __DEV__ 
  ? (process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API_URL)
  : PRODUCTION_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
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
    const response = await api.post('/users/join-couple', {
      user_id: userId,
      partner_code: coupleCode
    });
    return response.data;
  },
};

export const cycleAPI = {
  save: async (userId: string, lastPeriodDate: string, cycleLength: number, periodLength: number) => {
    const response = await api.post('/cycle', {
      user_id: userId,
      start_date: lastPeriodDate,
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
  // New: Start new period
  startPeriod: async (userId: string, periodStartDate: string, notes?: string) => {
    const response = await api.post('/cycle/start-period', {
      user_id: userId,
      period_start_date: periodStartDate,
      notes,
    });
    return response.data;
  },
  // New: Get cycle history
  getHistory: async (userId: string) => {
    const response = await api.get(`/cycle/history/${userId}`);
    return response.data;
  },
  // New: End period
  endPeriod: async (historyId: string, endDate: string) => {
    const response = await api.put(`/cycle/end-period/${historyId}?end_date=${endDate}`);
    return response.data;
  },
};

export const intimacyAPI = {
  log: async (coupleCode: string, date: string, qualityRating: number, createdBy: string, positionsUsed: string[] = [], durationMinutes?: number, location?: string, notes?: string) => {
    const response = await api.post('/intimacy', {
      couple_code: coupleCode,
      date,
      quality_rating: qualityRating,
      positions_used: positionsUsed,
      duration_minutes: durationMinutes,
      location,
      notes,
      created_by: createdBy,
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

export const loveDiceAPI = {
  roll: async () => {
    const response = await api.get('/love-dice/roll');
    return response.data;
  },
};

export const wishlistAPI = {
  add: async (coupleCode: string, userId: string, title: string, description: string, category: string) => {
    const response = await api.post('/wishlist', {
      couple_code: coupleCode,
      user_id: userId,
      title,
      description,
      category,
    });
    return response.data;
  },
  get: async (coupleCode: string, userId: string) => {
    const response = await api.get(`/wishlist/${coupleCode}/${userId}`);
    return response.data;
  },
  toggle: async (coupleCode: string, userId: string, itemId: string) => {
    const response = await api.post('/wishlist/toggle', {
      couple_code: coupleCode,
      user_id: userId,
      item_id: itemId
    });
    return response.data;
  },
  delete: async (itemId: string) => {
    const response = await api.delete(`/wishlist/${itemId}`);
    return response.data;
  },
};

export const quizAPI = {
  saveAnswer: async (coupleCode: string, userId: string, questionId: number, answerIndex: number) => {
    const response = await api.post('/quiz/answer', {
      couple_code: coupleCode,
      user_id: userId,
      question_id: questionId,
      answer_index: answerIndex,
    });
    return response.data;
  },
  getResults: async (coupleCode: string) => {
    const response = await api.get(`/quiz/results/${coupleCode}`);
    return response.data;
  },
};

export const specialDatesAPI = {
  create: async (coupleCode: string, title: string, date: string, createdBy: string, time?: string, notes?: string) => {
    const response = await api.post('/special-dates', {
      couple_code: coupleCode,
      title,
      date,
      time,
      notes,
      created_by: createdBy,
    });
    return response.data;
  },
  getAll: async (coupleCode: string) => {
    const response = await api.get(`/special-dates/${coupleCode}`);
    return response.data;
  },
  delete: async (dateId: string) => {
    const response = await api.delete(`/special-dates/${dateId}`);
    return response.data;
  },
};

export const weeklyAPI = {
  get: async (coupleCode: string) => {
    const response = await api.get(`/weekly-challenge/${coupleCode}`);
    return response.data;
  },
  complete: async (coupleCode: string) => {
    const response = await api.put(`/weekly-challenge/${coupleCode}/complete`);
    return response.data;
  },
};

export const fertilityAPI = {
  getPredictions: async (userId: string) => {
    const response = await api.get(`/fertility/predictions/${userId}`);
    return response.data;
  },
};

// ================= MOOD API =================
export const moodAPI = {
  log: async (userId: string, coupleCode: string, date: string, mood: number, energy: number, stress: number, libido: number, notes?: string) => {
    const response = await api.post('/mood', {
      user_id: userId,
      couple_code: coupleCode,
      date,
      mood,
      energy,
      stress,
      libido,
      notes,
    });
    return response.data;
  },
  getAll: async (coupleCode: string, days: number = 30) => {
    const response = await api.get(`/mood/${coupleCode}?days=${days}`);
    return response.data;
  },
  getToday: async (coupleCode: string) => {
    const response = await api.get(`/mood/today/${coupleCode}`);
    return response.data;
  },
  getStats: async (coupleCode: string) => {
    const response = await api.get(`/mood/stats/${coupleCode}`);
    return response.data;
  },
};

// ================= LOVE NOTES API =================
export const loveNotesAPI = {
  send: async (coupleCode: string, senderId: string, senderName: string, message: string, category: string) => {
    const response = await api.post('/love-notes', {
      couple_code: coupleCode,
      sender_id: senderId,
      sender_name: senderName,
      message,
      category,
    });
    return response.data;
  },
  getReceived: async (coupleCode: string, userId: string) => {
    const response = await api.get(`/love-notes/${coupleCode}/${userId}`);
    return response.data;
  },
  getUnread: async (coupleCode: string, userId: string) => {
    const response = await api.get(`/love-notes/unread/${coupleCode}/${userId}`);
    return response.data;
  },
  markRead: async (noteId: string) => {
    const response = await api.put(`/love-notes/${noteId}/read`);
    return response.data;
  },
  getTemplates: async () => {
    const response = await api.get('/love-notes/templates');
    return response.data;
  },
};

export default api;
