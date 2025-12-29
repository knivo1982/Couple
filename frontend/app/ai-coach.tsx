import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { usePremiumStore } from '../store/premiumStore';
import { format, subDays, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

// AI Coach suggestions based on data analysis
const generateCoachSuggestions = (data: any) => {
  const suggestions: any[] = [];
  const { intimacyEntries, moodData, stats, specialDates } = data;
  
  // Analyze mood patterns
  if (moodData && moodData.length > 0) {
    const recentMoods = moodData.slice(-7);
    const avgMood = recentMoods.reduce((sum: number, m: any) => sum + (m.mood || 3), 0) / recentMoods.length;
    
    if (avgMood < 3) {
      suggestions.push({
        type: 'emotional',
        icon: '💭',
        title: 'Momento di connessione',
        message: 'Questa settimana il mood sembra più basso del solito. Una serata senza telefono potrebbe aiutare a riconnettervi.',
        action: 'Pianifica una serata insieme',
        priority: 'high',
      });
    }
    
    // Check energy levels
    const avgEnergy = recentMoods.reduce((sum: number, m: any) => sum + (m.energy || 3), 0) / recentMoods.length;
    if (avgEnergy < 2.5) {
      suggestions.push({
        type: 'wellness',
        icon: '🌙',
        title: 'Ricarica le energie',
        message: 'I livelli di energia sono bassi. Un weekend rilassante insieme potrebbe fare la differenza.',
        action: 'Organizza un momento di relax',
        priority: 'medium',
      });
    }
  }
  
  // Analyze intimacy patterns
  if (intimacyEntries && intimacyEntries.length > 0) {
    const lastEntry = intimacyEntries[intimacyEntries.length - 1];
    const daysSinceLastIntimacy = lastEntry ? differenceInDays(new Date(), new Date(lastEntry.date)) : 30;
    
    if (daysSinceLastIntimacy > 14) {
      suggestions.push({
        type: 'intimacy',
        icon: '🔥',
        title: 'Riaccendi la fiamma',
        message: `Sono passati ${daysSinceLastIntimacy} giorni dall'ultimo momento intimo. A volte basta un piccolo gesto per riaccendere la passione.`,
        action: 'Prova il Dado dell\'Amore',
        priority: 'medium',
      });
    } else if (daysSinceLastIntimacy <= 3) {
      suggestions.push({
        type: 'positive',
        icon: '✨',
        title: 'Siete in sintonia!',
        message: 'La vostra intimità è forte in questo periodo. Continuate così!',
        action: null,
        priority: 'low',
      });
    }
    
    // Analyze quality patterns
    const recentIntimacy = intimacyEntries.slice(-5);
    const avgQuality = recentIntimacy.reduce((sum: number, e: any) => sum + (e.quality_rating || 3), 0) / recentIntimacy.length;
    
    if (avgQuality >= 4) {
      suggestions.push({
        type: 'positive',
        icon: '💖',
        title: 'Complicità al top!',
        message: 'La qualità dei vostri momenti insieme è eccellente. State facendo un ottimo lavoro!',
        action: null,
        priority: 'low',
      });
    }
  }
  
  // Check upcoming special dates
  if (specialDates && specialDates.length > 0) {
    const upcoming = specialDates.find((d: any) => {
      const daysUntil = differenceInDays(new Date(d.date), new Date());
      return daysUntil > 0 && daysUntil <= 7;
    });
    
    if (upcoming) {
      const daysUntil = differenceInDays(new Date(upcoming.date), new Date());
      suggestions.push({
        type: 'reminder',
        icon: '🎁',
        title: `${upcoming.name} tra ${daysUntil} giorni`,
        message: 'Hai già pensato a come rendere speciale questo giorno?',
        action: 'Pianifica una sorpresa',
        priority: 'high',
      });
    }
  }
  
  // Weekend suggestion
  const today = new Date().getDay();
  if (today === 5) { // Friday
    suggestions.push({
      type: 'timing',
      icon: '🌟',
      title: 'Weekend in arrivo!',
      message: 'Il weekend è il momento perfetto per dedicarvi tempo di qualità. Avete già dei piani?',
      action: 'Organizza qualcosa di speciale',
      priority: 'medium',
    });
  }
  
  // Default suggestion if none
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'general',
      icon: '💕',
      title: 'Tutto procede bene',
      message: 'La vostra relazione sembra equilibrata. Continuate a coltivare piccoli gesti quotidiani.',
      action: 'Invia una nota d\'amore',
      priority: 'low',
    });
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
};

// Love Insights - Smart statistics interpretations
const generateLoveInsights = (data: any) => {
  const insights: any[] = [];
  const { intimacyEntries, stats } = data;
  
  if (intimacyEntries && intimacyEntries.length >= 5) {
    // Weekend vs weekday analysis
    const weekendEntries = intimacyEntries.filter((e: any) => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6;
    });
    const weekdayEntries = intimacyEntries.filter((e: any) => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    });
    
    const weekendPct = (weekendEntries.length / intimacyEntries.length) * 100;
    
    if (weekendPct > 60) {
      insights.push({
        icon: '📅',
        title: 'Siete più sincronizzati nel weekend',
        value: `${Math.round(weekendPct)}%`,
        description: 'dei vostri momenti intimi avviene nel fine settimana',
        color: '#ff6b8a',
      });
    } else if (weekendPct < 40) {
      insights.push({
        icon: '🌙',
        title: 'Preferite i giorni feriali',
        value: `${Math.round(100 - weekendPct)}%`,
        description: 'dei vostri momenti intimi avviene durante la settimana',
        color: '#9b59b6',
      });
    }
    
    // Quality trend
    const recentEntries = intimacyEntries.slice(-10);
    const olderEntries = intimacyEntries.slice(-20, -10);
    
    if (olderEntries.length >= 5) {
      const recentAvg = recentEntries.reduce((sum: number, e: any) => sum + (e.quality_rating || 3), 0) / recentEntries.length;
      const olderAvg = olderEntries.reduce((sum: number, e: any) => sum + (e.quality_rating || 3), 0) / olderEntries.length;
      
      const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (improvement > 10) {
        insights.push({
          icon: '📈',
          title: 'La qualità sta migliorando!',
          value: `+${Math.round(improvement)}%`,
          description: 'rispetto alle settimane precedenti',
          color: '#2ed573',
        });
      }
    }
    
    // Favorite location
    const locations: { [key: string]: number } = {};
    intimacyEntries.forEach((e: any) => {
      if (e.location) {
        locations[e.location] = (locations[e.location] || 0) + 1;
      }
    });
    
    const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];
    if (topLocation && topLocation[1] >= 3) {
      const locationNames: { [key: string]: string } = {
        bedroom: 'Camera da letto',
        shower: 'Doccia',
        couch: 'Divano',
        kitchen: 'Cucina',
        car: 'Auto',
        outdoor: 'All\'aperto',
        hotel: 'Hotel',
      };
      
      insights.push({
        icon: '📍',
        title: 'Il vostro posto preferito',
        value: locationNames[topLocation[0]] || topLocation[0],
        description: `${topLocation[1]} volte negli ultimi mesi`,
        color: '#f39c12',
      });
    }
  }
  
  // Total stats
  if (stats) {
    if (stats.total_intimacy_logs > 0) {
      insights.push({
        icon: '❤️',
        title: 'Momenti insieme',
        value: stats.total_intimacy_logs.toString(),
        description: 'momenti intimi registrati',
        color: '#ff6b8a',
      });
    }
    
    if (stats.streak && stats.streak > 3) {
      insights.push({
        icon: '🔥',
        title: 'Serie in corso!',
        value: `${stats.streak} giorni`,
        description: 'di connessione continua',
        color: '#ff4757',
      });
    }
  }
  
  return insights;
};

export default function AICoachScreen() {
  const router = useRouter();
  const { user, intimacyEntries, stats } = useStore();
  const { isPremium } = usePremiumStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coach' | 'insights'>('coach');

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    setIsLoading(true);
    try {
      // Gather all data for analysis
      const data = {
        intimacyEntries: intimacyEntries || [],
        moodData: [], // Would come from API
        stats: stats || {},
        specialDates: [], // Would come from API
      };
      
      // Generate AI suggestions
      const coachSuggestions = generateCoachSuggestions(data);
      setSuggestions(coachSuggestions);
      
      // Generate love insights
      const loveInsights = generateLoveInsights(data);
      setInsights(loveInsights);
    } catch (error) {
      console.error('Error loading coach data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff6b8a';
      case 'medium': return '#f39c12';
      case 'low': return '#2ed573';
      default: return '#888';
    }
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>AI Coach</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.premiumGate}>
          <View style={styles.premiumIcon}>
            <Ionicons name="diamond" size={48} color="#f39c12" />
          </View>
          <Text style={styles.premiumTitle}>Funzione Premium</Text>
          <Text style={styles.premiumDesc}>
            L'AI Coach analizza i tuoi dati e ti dà suggerimenti personalizzati per migliorare la vostra relazione.
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall')}
          >
            <Ionicons name="diamond" size={20} color="#fff" />
            <Text style={styles.upgradeText}>Sblocca Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🧠 AI Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'coach' && styles.tabActive]}
          onPress={() => setActiveTab('coach')}
        >
          <Ionicons name="bulb" size={20} color={activeTab === 'coach' ? '#ff6b8a' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'coach' && styles.tabTextActive]}>Suggerimenti</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons name="analytics" size={20} color={activeTab === 'insights' ? '#ff6b8a' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>Insights</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b8a" />
          <Text style={styles.loadingText}>Analizzando i vostri dati...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'coach' ? (
            <>
              <Text style={styles.sectionIntro}>
                Ecco cosa ho notato dalla vostra relazione 💕
              </Text>
              
              {suggestions.map((suggestion, index) => (
                <View 
                  key={index} 
                  style={[styles.suggestionCard, { borderLeftColor: getPriorityColor(suggestion.priority) }]}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  </View>
                  <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
                  {suggestion.action && (
                    <TouchableOpacity style={styles.suggestionAction}>
                      <Text style={styles.suggestionActionText}>{suggestion.action}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#ff6b8a" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <View style={styles.refreshCard}>
                <TouchableOpacity style={styles.refreshButton} onPress={loadCoachData}>
                  <Ionicons name="refresh" size={20} color="#ff6b8a" />
                  <Text style={styles.refreshText}>Aggiorna suggerimenti</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionIntro}>
                Le statistiche intelligenti della vostra coppia ❤️
              </Text>
              
              <View style={styles.insightsGrid}>
                {insights.map((insight, index) => (
                  <View 
                    key={index} 
                    style={[styles.insightCard, { borderColor: insight.color + '40' }]}
                  >
                    <Text style={styles.insightIcon}>{insight.icon}</Text>
                    <Text style={[styles.insightValue, { color: insight.color }]}>{insight.value}</Text>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDesc}>{insight.description}</Text>
                  </View>
                ))}
              </View>
              
              {insights.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="analytics-outline" size={48} color="#555" />
                  <Text style={styles.emptyText}>
                    Registra più momenti insieme per sbloccare gli insights!
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#3a3a5e',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ff6b8a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  sectionIntro: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  suggestionMessage: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionActionText: {
    fontSize: 14,
    color: '#ff6b8a',
    fontWeight: '500',
  },
  refreshCard: {
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    borderRadius: 12,
  },
  refreshText: {
    color: '#ff6b8a',
    fontSize: 14,
    fontWeight: '500',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: (width - 52) / 2,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
