import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  gender: string;
  couple_code: string | null;
  partner_id: string | null;
}

interface CycleData {
  last_period_date: string;
  cycle_length: number;
  period_length: number;
}

interface IntimacyEntry {
  id: string;
  date: string;
  quality_rating: number;
  notes?: string;
}

interface Stats {
  total_count: number;
  monthly_count: number;
  average_quality: number;
  sessometro_level: string;
  sessometro_score: number;
}

interface FertilityData {
  periods: string[];
  fertile_days: string[];
  ovulation_days: string[];
}

interface AppStore {
  user: User | null;
  cycleData: CycleData | null;
  intimacyEntries: IntimacyEntry[];
  stats: Stats | null;
  fertilityData: FertilityData;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setCycleData: (data: CycleData | null) => void;
  setIntimacyEntries: (entries: IntimacyEntry[]) => void;
  setStats: (stats: Stats | null) => void;
  setFertilityData: (data: FertilityData) => void;
  setLoading: (loading: boolean) => void;
  loadUser: () => Promise<void>;
  saveUser: (user: User) => Promise<void>;
  loadFertilityData: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  cycleData: null,
  intimacyEntries: [],
  stats: null,
  fertilityData: { periods: [], fertile_days: [], ovulation_days: [] },
  isLoading: true,

  setUser: (user) => set({ user }),
  setCycleData: (cycleData) => set({ cycleData }),
  setIntimacyEntries: (intimacyEntries) => set({ intimacyEntries }),
  setStats: (stats) => set({ stats }),
  
  // Salva fertilityData anche in AsyncStorage
  // NON sovrascrive dati validi con dati vuoti
  setFertilityData: async (newFertilityData) => {
    const currentData = get().fertilityData;
    
    // Se i nuovi dati sono vuoti ma abbiamo già dati validi, NON sovrascrivere
    const newDataIsEmpty = !newFertilityData || 
      ((!newFertilityData.periods || newFertilityData.periods.length === 0) &&
       (!newFertilityData.fertile_days || newFertilityData.fertile_days.length === 0) &&
       (!newFertilityData.ovulation_days || newFertilityData.ovulation_days.length === 0));
    
    const currentDataHasValues = currentData && 
      ((currentData.periods && currentData.periods.length > 0) ||
       (currentData.fertile_days && currentData.fertile_days.length > 0) ||
       (currentData.ovulation_days && currentData.ovulation_days.length > 0));
    
    // Se nuovi dati vuoti e abbiamo già dati validi -> non fare nulla
    if (newDataIsEmpty && currentDataHasValues) {
      console.log('Skipping empty fertility update - keeping existing data');
      return;
    }
    
    // Altrimenti aggiorna
    set({ fertilityData: newFertilityData });
    
    // Persisti in AsyncStorage
    try {
      if (!newDataIsEmpty) {
        await AsyncStorage.setItem('fertilityData', JSON.stringify(newFertilityData));
      }
    } catch (e) {
      console.log('Error saving fertility data');
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),

  loadUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        set({ user: JSON.parse(userData), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
  
  // Carica fertilityData da AsyncStorage
  loadFertilityData: async () => {
    try {
      const data = await AsyncStorage.getItem('fertilityData');
      if (data) {
        const parsed = JSON.parse(data);
        set({ fertilityData: parsed });
      }
    } catch (e) {
      console.log('Error loading fertility data');
    }
  },

  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('fertilityData');
      set({ user: null, cycleData: null, intimacyEntries: [], stats: null, fertilityData: { periods: [], fertile_days: [], ovulation_days: [] } });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },
}));
