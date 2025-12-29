import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PremiumState {
  isPremium: boolean;
  usageCount: number;
  hasSeenOnboarding: boolean;
  hasSeenPaywall: boolean;
  purchaseDate: string | null;
  subscriptionType: 'monthly' | 'yearly' | null;
  
  // Actions
  setPremium: (value: boolean) => void;
  incrementUsage: () => void;
  setHasSeenOnboarding: (value: boolean) => void;
  setHasSeenPaywall: (value: boolean) => void;
  setPurchaseInfo: (type: 'monthly' | 'yearly', date: string) => void;
  resetPremium: () => void;
  shouldShowPaywall: () => boolean;
  loadPremiumState: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  isPremium: false,
  usageCount: 0,
  hasSeenOnboarding: false,
  hasSeenPaywall: false,
  purchaseDate: null,
  subscriptionType: null,

  setPremium: (value: boolean) => {
    set({ isPremium: value });
    AsyncStorage.setItem('premium_isPremium', JSON.stringify(value));
  },
  
  incrementUsage: () => {
    const newCount = get().usageCount + 1;
    set({ usageCount: newCount });
    AsyncStorage.setItem('premium_usageCount', JSON.stringify(newCount));
  },
  
  setHasSeenOnboarding: (value: boolean) => {
    set({ hasSeenOnboarding: value });
    AsyncStorage.setItem('premium_hasSeenOnboarding', JSON.stringify(value));
  },
  
  setHasSeenPaywall: (value: boolean) => {
    set({ hasSeenPaywall: value });
    AsyncStorage.setItem('premium_hasSeenPaywall', JSON.stringify(value));
  },
  
  setPurchaseInfo: (type: 'monthly' | 'yearly', date: string) => {
    set({
      isPremium: true,
      subscriptionType: type,
      purchaseDate: date,
    });
    AsyncStorage.setItem('premium_isPremium', JSON.stringify(true));
    AsyncStorage.setItem('premium_subscriptionType', JSON.stringify(type));
    AsyncStorage.setItem('premium_purchaseDate', JSON.stringify(date));
  },
  
  resetPremium: () => {
    set({
      isPremium: false,
      purchaseDate: null,
      subscriptionType: null,
    });
    AsyncStorage.removeItem('premium_isPremium');
    AsyncStorage.removeItem('premium_subscriptionType');
    AsyncStorage.removeItem('premium_purchaseDate');
  },
  
  shouldShowPaywall: () => {
    const state = get();
    return !state.isPremium && state.usageCount >= 3 && !state.hasSeenPaywall;
  },
  
  loadPremiumState: async () => {
    try {
      const [isPremium, usageCount, hasSeenOnboarding, hasSeenPaywall, subscriptionType, purchaseDate] = await Promise.all([
        AsyncStorage.getItem('premium_isPremium'),
        AsyncStorage.getItem('premium_usageCount'),
        AsyncStorage.getItem('premium_hasSeenOnboarding'),
        AsyncStorage.getItem('premium_hasSeenPaywall'),
        AsyncStorage.getItem('premium_subscriptionType'),
        AsyncStorage.getItem('premium_purchaseDate'),
      ]);
      
      set({
        isPremium: isPremium ? JSON.parse(isPremium) : false,
        usageCount: usageCount ? JSON.parse(usageCount) : 0,
        hasSeenOnboarding: hasSeenOnboarding ? JSON.parse(hasSeenOnboarding) : false,
        hasSeenPaywall: hasSeenPaywall ? JSON.parse(hasSeenPaywall) : false,
        subscriptionType: subscriptionType ? JSON.parse(subscriptionType) : null,
        purchaseDate: purchaseDate ? JSON.parse(purchaseDate) : null,
      });
    } catch (error) {
      console.error('Error loading premium state:', error);
    }
  },
}));

// Premium feature limits
export const PREMIUM_LIMITS = {
  FREE: {
    intimacyLogs: 5,
    positions: 4,
    wishlistItems: 5,
    notesPerDay: 3,
    challenges: 1,
  },
  PREMIUM: {
    intimacyLogs: Infinity,
    positions: Infinity,
    wishlistItems: Infinity,
    notesPerDay: Infinity,
    challenges: Infinity,
  },
};

// Check if user can access a premium feature
export const canAccessFeature = (isPremium: boolean, feature: string, currentCount: number): boolean => {
  const limits = isPremium ? PREMIUM_LIMITS.PREMIUM : PREMIUM_LIMITS.FREE;
  const limit = limits[feature as keyof typeof limits];
  return currentCount < limit;
};
