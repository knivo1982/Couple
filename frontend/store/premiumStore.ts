import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      usageCount: 0,
      hasSeenOnboarding: false,
      hasSeenPaywall: false,
      purchaseDate: null,
      subscriptionType: null,

      setPremium: (value: boolean) => set({ isPremium: value }),
      
      incrementUsage: () => set((state) => ({ usageCount: state.usageCount + 1 })),
      
      setHasSeenOnboarding: (value: boolean) => set({ hasSeenOnboarding: value }),
      
      setHasSeenPaywall: (value: boolean) => set({ hasSeenPaywall: value }),
      
      setPurchaseInfo: (type: 'monthly' | 'yearly', date: string) => set({
        isPremium: true,
        subscriptionType: type,
        purchaseDate: date,
      }),
      
      resetPremium: () => set({
        isPremium: false,
        purchaseDate: null,
        subscriptionType: null,
      }),
      
      shouldShowPaywall: () => {
        const state = get();
        // Show paywall after 3 uses if not premium and hasn't seen it recently
        return !state.isPremium && state.usageCount >= 3 && !state.hasSeenPaywall;
      },
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

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
