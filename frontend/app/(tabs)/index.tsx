import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { intimacyAPI, challengeAPI, cycleAPI, userAPI, fertilityAPI, weeklyAPI, specialDatesAPI, moodAPI, loveNotesAPI } from '../../services/api';
import { format, isToday } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '🥰'];

export default function Home() {
  const { user, stats, setStats, fertilityData, setFertilityData, setUser, saveUser } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todaySuggestion, setTodaySuggestion] = useState<any>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [fertilityPredictions, setFertilityPredictions] = useState<any>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null);
  const [specialDates, setSpecialDates] = useState<any>(null);
  const [todayMoods, setTodayMoods] = useState<any[]>([]);
  const [unreadNotes, setUnreadNotes] = useState(0);

  // Check if user was linked by partner (refresh user data)
  const checkUserUpdates = async () => {
    if (!user?.id) return;
    try {
      const updatedUser = await userAPI.get(user.id);
      // If partner_id changed, update local user
      if (updatedUser.partner_id !== user.partner_id) {
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.log('Error checking user updates:', error);
    }
  };

  const loadData = async () => {
    if (!user?.couple_code) return;
    
    // First check if user was linked
    await checkUserUpdates();
    
    try {
      const [statsData, suggestion, weekly, dates] = await Promise.all([
        intimacyAPI.getStats(user.couple_code),
        challengeAPI.getRandom(),
        weeklyAPI.get(user.couple_code),
        specialDatesAPI.getAll(user.couple_code),
      ]);
      setStats(statsData);
      setTodaySuggestion(suggestion);
      setWeeklyChallenge(weekly);
      setSpecialDates(dates);

      // Load fertility predictions (optional)
      try {
        const predictions = await fertilityAPI.getPredictions(user.id);
        setFertilityPredictions(predictions);
      } catch (e) {
        console.log('No fertility predictions');
      }

      // Load fertility data (optional)
      try {
        const fertility = await cycleAPI.getFertility(user.id);
        setFertilityData(fertility);
      } catch (e) {
        console.log('No fertility data');
      }

      // Load today's moods
      try {
        const moods = await moodAPI.getToday(user.couple_code);
        setTodayMoods(moods);
      } catch (e) {
        console.log('No mood data');
      }

      // Load unread notes
      try {
        const unread = await loveNotesAPI.getUnread(user.couple_code, user.id);
        setUnreadNotes(unread.count);
      } catch (e) {
        console.log('No notes');
      }

      // Load partner name if connected
      if (user.partner_id) {
        try {
          const partner = await userAPI.get(user.partner_id);
          setPartnerName(partner.name);
        } catch (e) {
          console.log('Partner not found');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

    useEffect(() => {
        loadData();
        
        // Auto-refresh every 30 seconds for real-time sync
        const pollInterval = setInterval(() => {
          loadData();
        }, 30000);
        
        return () => clearInterval(pollInterval);
      }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkUserUpdates();
    await loadData();
    setRefreshing(false);
  };

  const getTodayStatus = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (fertilityData?.periods?.includes(today)) {
      return { status: 'period', color: '#ff4757', text: 'Ciclo', icon: 'water' };
    }
    if (fertilityData?.ovulation_days?.includes(today)) {
      return { status: 'ovulation', color: '#ffa502', text: 'Ovulazione', icon: 'sunny' };
    }
    if (fertilityData?.fertile_days?.includes(today)) {
      return { status: 'fertile', color: '#2ed573', text: 'Fertile', icon: 'leaf' };
    }
    return { status: 'safe', color: '#1e90ff', text: 'Sicuro', icon: 'shield-checkmark' };
  };

  const getSessometroColor = (score: number) => {
    if (score >= 8) return '#ff4757';
    if (score >= 6) return '#ff6b8a';
    if (score >= 4) return '#ffa502';
    if (score >= 2) return '#70a1ff';
    return '#888';
  };

  const todayStatus = getTodayStatus();
  const myMood = todayMoods.find((m: any) => m.user_id === user?.id);
  const partnerMood = todayMoods.find((m: any) => m.user_id !== user?.id);

  const handleShareCode = () => {
    Alert.alert(
      'Codice Coppia',
      `Condividi questo codice con il tuo partner:\n\n${user?.couple_code}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b8a" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ciao, {user?.name} 💖</Text>
            <Text style={styles.date}>
              {format(new Date(), 'EEEE d MMMM', { locale: it })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Partner Status */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerLeft}>
            <Ionicons name="heart" size={20} color="#ff6b8a" />
            {user?.partner_id ? (
              <Text style={styles.partnerText}>In coppia con {partnerName || 'Partner'}</Text>
            ) : (
              <TouchableOpacity onPress={handleShareCode}>
                <Text style={styles.partnerText}>
                  Codice: <Text style={styles.codeText}>{user?.couple_code}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {unreadNotes > 0 && (
            <View style={styles.noteBadge}>
              <Ionicons name="mail" size={14} color="#fff" />
              <Text style={styles.noteBadgeText}>{unreadNotes}</Text>
            </View>
          )}
        </View>

        {/* Today's Mood Row */}
        {(myMood || partnerMood) && (
          <View style={styles.moodRow}>
            <View style={styles.moodCard}>
              <Text style={styles.moodCardTitle}>Tu</Text>
              <Text style={styles.moodEmoji}>
                {myMood ? MOOD_EMOJIS[myMood.mood - 1] : '❓'}
              </Text>
            </View>
            <View style={styles.moodDivider}>
              <Ionicons name="heart" size={20} color="#ff6b8a" />
            </View>
            <View style={styles.moodCard}>
              <Text style={styles.moodCardTitle}>Partner</Text>
              <Text style={styles.moodEmoji}>
                {partnerMood ? MOOD_EMOJIS[partnerMood.mood - 1] : '❓'}
              </Text>
            </View>
          </View>
        )}

        {/* Fertility Status */}
        {(fertilityData?.periods?.length > 0 || fertilityData?.fertile_days?.length > 0) && (
          <TouchableOpacity style={styles.fertilityCard} onPress={() => router.push('/(tabs)/calendar')}>
            <View style={[styles.fertilityIcon, { backgroundColor: `${todayStatus.color}20` }]}>
              <Ionicons name={todayStatus.icon as any} size={28} color={todayStatus.color} />
            </View>
            <View style={styles.fertilityContent}>
              <Text style={styles.fertilityLabel}>
                {user?.gender === 'male' ? 'Ciclo Partner' : 'Oggi'}
              </Text>
              <Text style={[styles.fertilityText, { color: todayStatus.color }]}>
                {todayStatus.text}
              </Text>
              {fertilityPredictions?.days_to_period > 0 && (
                <Text style={styles.fertilitySubtext}>
                  Prossimo ciclo tra {fertilityPredictions.days_to_period} giorni
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* AI Coach Card */}
        <TouchableOpacity 
          style={styles.aiCoachCard} 
          onPress={() => router.push('/ai-coach')}
        >
          <View style={styles.aiCoachIcon}>
            <Text style={{ fontSize: 32 }}>🧠</Text>
          </View>
          <View style={styles.aiCoachContent}>
            <Text style={styles.aiCoachTitle}>AI Coach di Coppia</Text>
            <Text style={styles.aiCoachDesc}>Consigli personalizzati per voi</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ff6b8a" />
        </TouchableOpacity>

        {/* Secret Desires Card - Premium Feature */}
        <TouchableOpacity 
          style={styles.secretDesiresCard} 
          onPress={() => router.push('/secret-desires')}
        >
          <View style={styles.secretDesiresGlow} />
          <View style={styles.secretDesiresIcon}>
            <Text style={{ fontSize: 32 }}>💭</Text>
          </View>
          <View style={styles.secretDesiresContent}>
            <View style={styles.secretDesiresHeader}>
              <Text style={styles.secretDesiresTitle}>Desideri Segreti</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <Text style={styles.secretDesiresDesc}>Scopri le fantasie che avete in comune!</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9b59b6" />
        </TouchableOpacity>

        {/* Sessometro Card */}
        <TouchableOpacity style={styles.sessometroCard} onPress={() => router.push('/(tabs)/stats')}>
          <View style={styles.sessometroHeader}>
            <View style={styles.sessometroTitle}>
              <Text style={styles.sessometroEmoji}>{stats?.sessometro_level_emoji || '🌱'}</Text>
              <Text style={styles.sessometroName}>Sessometro</Text>
            </View>
            <Text style={[styles.sessometroScore, { color: getSessometroColor(stats?.sessometro_score || 0) }]}>
              {stats?.sessometro_score || 0}/10
            </Text>
          </View>
          
          <View style={styles.sessometroGauge}>
            <View
              style={[
                styles.sessometroFill,
                {
                  width: `${(stats?.sessometro_score || 0) * 10}%`,
                  backgroundColor: getSessometroColor(stats?.sessometro_score || 0),
                },
              ]}
            />
          </View>
          
          <Text style={styles.sessometroLevel}>
            {stats?.sessometro_level || 'Nuova Coppia'}
          </Text>
          
          <View style={styles.sessometroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.monthly_count || 0}</Text>
              <Text style={styles.statLabel}>questo mese</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.streak || 0}</Text>
              <Text style={styles.statLabel}>streak sett.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.average_quality || 0}</Text>
              <Text style={styles.statLabel}>qualità</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weekly Challenge */}
        {weeklyChallenge && !weeklyChallenge.completed && (
          <TouchableOpacity 
            style={styles.weeklyCard}
            onPress={async () => {
              Alert.alert(
                '🏆 ' + weeklyChallenge.challenge.title,
                weeklyChallenge.challenge.description + '\n\nHai completato la sfida?',
                [
                  { text: 'Non ancora', style: 'cancel' },
                  { 
                    text: 'Sì, completata! ✅', 
                    onPress: async () => {
                      try {
                        await weeklyAPI.complete(user!.couple_code);
                        Alert.alert('🎉 Complimenti!', 'Sfida completata! Nuova sfida disponibile la prossima settimana.');
                        loadData();
                      } catch (e) {
                        Alert.alert('Errore', 'Impossibile completare');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <View style={styles.weeklyHeader}>
              <Ionicons name="trophy" size={20} color="#ffd700" />
              <Text style={styles.weeklyTitle}>Sfida della Settimana</Text>
            </View>
            <Text style={styles.weeklyName}>{weeklyChallenge.challenge.title}</Text>
            <Text style={styles.weeklyDesc}>{weeklyChallenge.challenge.description}</Text>
            <View style={styles.weeklyAction}>
              <Text style={styles.weeklyActionText}>Tocca per completare →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Suggestion */}
        {todaySuggestion && (
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => {
              const s = todaySuggestion.data;
              Alert.alert(
                (s.spicy ? '🔥 ' : '💕 ') + (s.title || s.name),
                s.description || 'Prova questo suggerimento con il tuo partner!',
                [
                  { text: 'Più tardi', style: 'cancel' },
                  { text: 'Proviamolo! 💕', onPress: () => router.push('/(tabs)/spicy') }
                ]
              );
            }}
          >
            <View style={styles.suggestionHeader}>
              <Ionicons name="sparkles" size={18} color="#ffa502" />
              <Text style={styles.suggestionTitle}>Suggerimento del giorno</Text>
            </View>
            <Text style={styles.suggestionName}>
              {todaySuggestion.data.title || todaySuggestion.data.name}
            </Text>
            <Text style={styles.suggestionDesc} numberOfLines={2}>
              {todaySuggestion.data.description || 'Tocca per scoprire di più...'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Upcoming Date */}
        {specialDates?.next_date && (
          <TouchableOpacity 
            style={styles.countdownCard}
            onPress={() => {
              Alert.alert(
                '📅 ' + specialDates.next_date.title,
                `Data: ${specialDates.next_date.date}\nTra ${specialDates.days_until_next} giorni`,
                [
                  { text: 'Chiudi', style: 'cancel' },
                  { 
                    text: '🗑️ Elimina', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await specialDatesAPI.delete(specialDates.next_date.id);
                        loadData();
                      } catch (e) {
                        console.error('Delete error:', e);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#ff6b8a" />
            <View style={styles.countdownContent}>
              <Text style={styles.countdownTitle}>{specialDates.next_date.title}</Text>
              <Text style={styles.countdownDays}>
                Tra {specialDates.days_until_next} giorni
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  settingsButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  
  partnerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2a2a4e', padding: 16, borderRadius: 18, marginBottom: 20 },
  partnerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerText: { color: '#fff', fontSize: 14 },
  codeText: { color: '#ff6b8a', fontWeight: '600', letterSpacing: 2 },
  noteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff6b8a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  noteBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  moodCard: { flex: 1, backgroundColor: '#2a2a4e', borderRadius: 18, padding: 16, alignItems: 'center' },
  moodCardTitle: { fontSize: 12, color: '#888', marginBottom: 6 },
  moodEmoji: { fontSize: 36 },
  moodDivider: { marginHorizontal: 4 },
  
  fertilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', padding: 18, borderRadius: 20, marginBottom: 20 },
  fertilityIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  fertilityContent: { flex: 1, marginLeft: 16 },
  fertilityLabel: { fontSize: 12, color: '#888' },
  fertilityText: { fontSize: 20, fontWeight: '600' },
  fertilitySubtext: { fontSize: 12, color: '#666', marginTop: 4 },
  
  sessometroCard: { backgroundColor: '#2a2a4e', borderRadius: 24, padding: 24, marginBottom: 20 },
  sessometroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sessometroTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessometroEmoji: { fontSize: 32 },
  sessometroName: { fontSize: 20, fontWeight: '600', color: '#fff' },
  sessometroScore: { fontSize: 26, fontWeight: 'bold' },
  sessometroGauge: { height: 12, backgroundColor: '#3a3a5e', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  sessometroFill: { height: '100%', borderRadius: 6 },
  sessometroLevel: { fontSize: 15, color: '#aaa', textAlign: 'center', marginBottom: 18 },
  sessometroStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 26, fontWeight: 'bold', color: '#ff6b8a' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  statDivider: { width: 1, height: 44, backgroundColor: '#3a3a5e' },
  
  weeklyCard: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.25)' },
  weeklyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  weeklyTitle: { fontSize: 13, color: '#ffd700', fontWeight: '600' },
  weeklyName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  weeklyDesc: { fontSize: 14, color: '#aaa', marginTop: 6, lineHeight: 20 },
  weeklyAction: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 215, 0, 0.2)' },
  weeklyActionText: { color: '#ffd700', fontSize: 13, fontWeight: '500' },
  
  suggestionCard: { backgroundColor: '#2a2a4e', borderRadius: 18, padding: 18, marginBottom: 20 },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  suggestionTitle: { fontSize: 13, color: '#ffa502', fontWeight: '500' },
  suggestionName: { fontSize: 16, color: '#fff', fontWeight: '600' },
  suggestionDesc: { fontSize: 13, color: '#888', marginTop: 6, lineHeight: 18 },
  
  countdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', padding: 18, borderRadius: 18, gap: 16 },
  countdownContent: { flex: 1 },
  countdownTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
  countdownDays: { fontSize: 13, color: '#ff6b8a', marginTop: 4 },
  
  aiCoachCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(155, 89, 182, 0.15)', 
    padding: 18, 
    borderRadius: 18, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  aiCoachIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: 'rgba(155, 89, 182, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  aiCoachContent: { flex: 1, marginLeft: 14 },
  aiCoachTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  aiCoachDesc: { fontSize: 13, color: '#aaa', marginTop: 4 },
  // Secret Desires Card
  secretDesiresCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 107, 138, 0.1)', 
    padding: 18, 
    borderRadius: 18, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 138, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  secretDesiresGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
  },
  secretDesiresIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255, 107, 138, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  secretDesiresContent: { flex: 1, marginLeft: 14 },
  secretDesiresHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secretDesiresTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  secretDesiresDesc: { fontSize: 13, color: '#aaa', marginTop: 4 },
  newBadge: { 
    backgroundColor: '#ff6b8a', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8 
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
