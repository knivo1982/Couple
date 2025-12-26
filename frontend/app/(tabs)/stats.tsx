import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { intimacyAPI, moodAPI } from '../../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const LEVEL_EMOJIS: { [key: string]: string } = {
  'Nuova Coppia': '🌱',
  'In Riscaldamento': '🔥',
  'Sulla Buona Strada': '🚀',
  'Coppia Affiatata': '💪',
  'Amanti Esplosivi': '💥',
  'Leggendari': '🌟',
};

const BADGES = [
  { id: 'first_time', name: 'Prima Volta', emoji: '❤️', desc: 'Primo momento insieme' },
  { id: 'week_streak', name: 'Costanza', emoji: '🔥', desc: '7 giorni consecutivi' },
  { id: 'quality_king', name: 'Qualità Top', emoji: '👑', desc: 'Media qualità > 4' },
  { id: 'explorer', name: 'Esploratori', emoji: '🌍', desc: '5+ location diverse' },
  { id: 'marathon', name: 'Maratoneti', emoji: '⏱️', desc: 'Sessione 60+ min' },
  { id: 'morning', name: 'Mattinieri', emoji: '🌅', desc: 'Prima delle 8' },
  { id: 'night_owl', name: 'Nottambuli', emoji: '🌙', desc: 'Dopo mezzanotte' },
  { id: 'perfect_month', name: 'Mese Perfetto', emoji: '🏆', desc: '20+ volte in un mese' },
];

export default function StatsScreen() {
  const { user, stats, setStats } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [moodStats, setMoodStats] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const loadData = async () => {
    if (!user?.couple_code) return;

    try {
      const [statsData, entriesData] = await Promise.all([
        intimacyAPI.getStats(user.couple_code),
        intimacyAPI.getAll(user.couple_code),
      ]);
      setStats(statsData);
      setEntries(entriesData || []);

      try {
        const mood = await moodAPI.getStats(user.couple_code);
        setMoodStats(mood);
      } catch (e) {
        console.log('No mood stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSessometroColor = (score: number) => {
    if (score >= 8) return '#ff4757';
    if (score >= 6) return '#ff6b8a';
    if (score >= 4) return '#ffa502';
    if (score >= 2) return '#70a1ff';
    return '#888';
  };

  const earnedBadges = stats?.badges || [];

  // Calculate fun stats
  const totalMinutes = entries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
  const avgDuration = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;
  const uniqueLocations = [...new Set(entries.map((e: any) => e.location).filter(Boolean))].length;
  const favoriteDay = stats?.day_frequency?.[0]?.[0] || null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b8a" />}
      >
        <Text style={styles.title}>Statistiche 📊</Text>

        {/* Sessometro Main Card */}
        <View style={styles.sessometroCard}>
          <View style={styles.sessometroHeader}>
            <Text style={styles.sessometroEmoji}>
              {LEVEL_EMOJIS[stats?.sessometro_level || 'Nuova Coppia'] || '🌱'}
            </Text>
            <Text style={styles.sessometroLevel}>{stats?.sessometro_level || 'Nuova Coppia'}</Text>
          </View>

          <Text style={[styles.sessometroScore, { color: getSessometroColor(stats?.sessometro_score || 0) }]}>
            {stats?.sessometro_score || 0}/10
          </Text>

          <View style={styles.gaugeContainer}>
            <View style={styles.gauge}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${(stats?.sessometro_score || 0) * 10}%`,
                    backgroundColor: getSessometroColor(stats?.sessometro_score || 0),
                  },
                ]}
              />
            </View>
          </View>

          {/* Score Breakdown */}
          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Ionicons name="flame" size={18} color="#ff6b8a" />
              <Text style={styles.breakdownLabel}>Frequenza</Text>
              <Text style={styles.breakdownValue}>{stats?.breakdown?.frequency?.toFixed(1) || '0'}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="star" size={18} color="#ffa502" />
              <Text style={styles.breakdownLabel}>Qualità</Text>
              <Text style={styles.breakdownValue}>{stats?.breakdown?.quality?.toFixed(1) || '0'}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="repeat" size={18} color="#2ed573" />
              <Text style={styles.breakdownLabel}>Costanza</Text>
              <Text style={styles.breakdownValue}>{stats?.breakdown?.consistency?.toFixed(1) || '0'}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="trending-up" size={18} color="#70a1ff" />
              <Text style={styles.breakdownLabel}>Trend</Text>
              <Text style={styles.breakdownValue}>{stats?.breakdown?.trend?.toFixed(1) || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{stats?.monthly_count || 0}</Text>
            <Text style={styles.quickStatLabel}>Questo mese</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{stats?.streak || 0}</Text>
            <Text style={styles.quickStatLabel}>Streak sett.</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{stats?.total_count || 0}</Text>
            <Text style={styles.quickStatLabel}>Totale</Text>
          </View>
        </View>

        {/* Mood Sync Score */}
        {moodStats && moodStats.sync_score > 0 && (
          <View style={styles.moodSyncCard}>
            <View style={styles.moodSyncHeader}>
              <Ionicons name="heart-half" size={24} color="#ff6b8a" />
              <Text style={styles.moodSyncTitle}>Sintonia Emotiva</Text>
            </View>
            <Text style={styles.moodSyncScore}>{moodStats.sync_score}%</Text>
            <View style={styles.moodSyncBar}>
              <View style={[styles.moodSyncFill, { width: `${moodStats.sync_score}%` }]} />
            </View>
            {moodStats.best_day && (
              <Text style={styles.moodSyncHint}>Il vostro giorno migliore: {moodStats.best_day}</Text>
            )}
          </View>
        )}

        {/* Fun Stats */}
        <View style={styles.funStatsCard}>
          <Text style={styles.sectionTitle}>🎉 Statistiche Divertenti</Text>
          
          <View style={styles.funStatRow}>
            <View style={styles.funStatItem}>
              <Text style={styles.funStatEmoji}>⏱️</Text>
              <Text style={styles.funStatValue}>{avgDuration} min</Text>
              <Text style={styles.funStatLabel}>Media durata</Text>
            </View>
            <View style={styles.funStatItem}>
              <Text style={styles.funStatEmoji}>🌍</Text>
              <Text style={styles.funStatValue}>{uniqueLocations}</Text>
              <Text style={styles.funStatLabel}>Location esplorate</Text>
            </View>
          </View>

          <View style={styles.funStatRow}>
            <View style={styles.funStatItem}>
              <Text style={styles.funStatEmoji}>⭐</Text>
              <Text style={styles.funStatValue}>{stats?.average_quality?.toFixed(1) || '0'}</Text>
              <Text style={styles.funStatLabel}>Qualità media</Text>
            </View>
            {favoriteDay && (
              <View style={styles.funStatItem}>
                <Text style={styles.funStatEmoji}>📅</Text>
                <Text style={styles.funStatValue}>{favoriteDay}</Text>
                <Text style={styles.funStatLabel}>Giorno preferito</Text>
              </View>
            )}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>🏅 Badge</Text>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                    {earned ? badge.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        {entries.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>📝 Attività Recente</Text>
            {entries.slice(0, 5).map((entry: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityDate}>
                    {format(new Date(entry.date), 'd MMM yyyy', { locale: it })}
                  </Text>
                  <View style={styles.activityDetails}>
                    <View style={styles.activityRating}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Ionicons
                          key={num}
                          name={num <= entry.quality_rating ? 'heart' : 'heart-outline'}
                          size={12}
                          color={num <= entry.quality_rating ? '#ff6b8a' : '#444'}
                        />
                      ))}
                    </View>
                    {entry.location && (
                      <Text style={styles.activityLocation}>
                        <Ionicons name="location" size={10} color="#666" /> {entry.location}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  
  sessometroCard: { backgroundColor: '#2a2a4e', borderRadius: 24, padding: 24, marginBottom: 20, alignItems: 'center' },
  sessometroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sessometroEmoji: { fontSize: 36 },
  sessometroLevel: { fontSize: 20, fontWeight: '600', color: '#fff' },
  sessometroScore: { fontSize: 64, fontWeight: 'bold', marginBottom: 12 },
  gaugeContainer: { width: '100%', marginBottom: 20 },
  gauge: { height: 12, backgroundColor: '#3a3a5e', borderRadius: 6, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 6 },
  breakdown: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#3a3a5e' },
  breakdownItem: { alignItems: 'center', gap: 4 },
  breakdownLabel: { fontSize: 11, color: '#888' },
  breakdownValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  quickStats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickStatCard: { flex: 1, backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickStatNumber: { fontSize: 28, fontWeight: 'bold', color: '#ff6b8a' },
  quickStatLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  
  moodSyncCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  moodSyncHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  moodSyncTitle: { fontSize: 16, color: '#fff', fontWeight: '500' },
  moodSyncScore: { fontSize: 48, fontWeight: 'bold', color: '#ff6b8a' },
  moodSyncBar: { width: '100%', height: 8, backgroundColor: '#3a3a5e', borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  moodSyncFill: { height: '100%', backgroundColor: '#ff6b8a', borderRadius: 4 },
  moodSyncHint: { color: '#888', fontSize: 12, marginTop: 12 },
  
  funStatsCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  funStatRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  funStatItem: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  funStatEmoji: { fontSize: 28, marginBottom: 8 },
  funStatValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  funStatLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  
  badgesSection: { marginBottom: 20 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: (width - 64) / 2, backgroundColor: '#2a2a4e', borderRadius: 14, padding: 14, alignItems: 'center' },
  badgeCardLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 32, marginBottom: 8 },
  badgeEmojiLocked: { opacity: 0.3 },
  badgeName: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  badgeNameLocked: { color: '#666' },
  badgeDesc: { fontSize: 10, color: '#888', textAlign: 'center' },
  
  recentSection: { marginBottom: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff6b8a', marginTop: 4, marginRight: 12 },
  activityContent: { flex: 1 },
  activityDate: { fontSize: 14, color: '#fff', fontWeight: '500' },
  activityDetails: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  activityRating: { flexDirection: 'row', gap: 2 },
  activityLocation: { fontSize: 11, color: '#666' },
});
