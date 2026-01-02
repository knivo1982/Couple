import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  loadOnboardingState: () => Promise<void>;
  reset: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  subscriptionType: null,
  purchaseDate: null,
  hasSeenOnboarding: true, // Default true - only show for new users
  hasSeenPaywall: false,
  
  setIsPremium: (isPremium) => set({ isPremium }),
  
  setPurchaseInfo: (type, date) => set({
    isPremium: true,
    subscriptionType: type,
    purchaseDate: date,
  }),
  
  setHasSeenOnboarding: async (seen) => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', JSON.stringify(seen));
    } catch (e) {
      console.log('Error saving onboarding state');
    }
    set({ hasSeenOnboarding: seen });
  },
  
  setHasSeenPaywall: (seen) => set({ hasSeenPaywall: seen }),
  
  loadOnboardingState: async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      if (value !== null) {
        set({ hasSeenOnboarding: JSON.parse(value) });
      } else {
        // First time - hasn't seen onboarding yet
        set({ hasSeenOnboarding: false });
      }
    } catch (e) {
      console.log('Error loading onboarding state');
      set({ hasSeenOnboarding: true });
    }
  },
  
  reset: () => set({
    isPremium: false,
    subscriptionType: null,
    purchaseDate: null,
    hasSeenOnboarding: false,
    hasSeenPaywall: false,
  }),
}));
