import { create } from 'zustand';

interface PremiumState {
  isPremium: boolean;
  subscriptionType: 'monthly' | 'yearly' | null;
  purchaseDate: string | null;
  hasSeenOnboarding: boolean;
  hasSeenPaywall: boolean;
  setIsPremium: (isPremium: boolean) => void;
  setPurchaseInfo: (type: 'monthly' | 'yearly', date: string) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setHasSeenPaywall: (seen: boolean) => void;
  reset: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  subscriptionType: null,
  purchaseDate: null,
  hasSeenOnboarding: false,
  hasSeenPaywall: false,
  
  setIsPremium: (isPremium) => set({ isPremium }),
  
  setPurchaseInfo: (type, date) => set({
    isPremium: true,
    subscriptionType: type,
    purchaseDate: date,
  }),
  
  setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
  
  setHasSeenPaywall: (seen) => set({ hasSeenPaywall: seen }),
  
  reset: () => set({
    isPremium: false,
    subscriptionType: null,
    purchaseDate: null,
    hasSeenOnboarding: false,
    hasSeenPaywall: false,
  }),
}));
