import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { intimacyAPI } from '../services/api';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { user, stats, setStats, intimacyEntries, setIntimacyEntries } = useStore();
  const [monthlyData, setMonthlyData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.couple_code) return;

    try {
      const [statsData, entries] = await Promise.all([
        intimacyAPI.getStats(user.couple_code),
        intimacyAPI.getAll(user.couple_code),
      ]);
      setStats(statsData);
      setIntimacyEntries(entries);

      // Calculate monthly data for chart
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const data = days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const count = entries.filter((e: any) => e.date === dateStr).length;
        return { day: format(day, 'd'), count };
      });

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getSessometroColor = (score: number) => {
    if (score >= 8) return '#ff4757';
    if (score >= 6) return '#ff6b8a';
    if (score >= 4) return '#ffa502';
    if (score >= 2) return '#70a1ff';
    return '#888';
  };

  const getQualityEmoji = (quality: number) => {
    switch (quality) {
      case 5:
        return 'flame';
      case 4:
        return 'heart';
      case 3:
        return 'happy';
      case 2:
        return 'sad';
      default:
        return 'thumbs-down';
    }
  };

  const maxCount = Math.max(...monthlyData.map((d) => d.count), 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Statistiche</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sessometro Card */}
        <View style={styles.sessometroCard}>
          <View style={styles.sessometroHeader}>
            <Ionicons name="flame" size={32} color="#ff6b8a" />
            <Text style={styles.sessometroTitle}>Sessometro</Text>
          </View>

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
            <Text style={styles.gaugeScore}>{stats?.sessometro_score || 0}/10</Text>
          </View>

          <Text
            style={[
              styles.levelText,
              { color: getSessometroColor(stats?.sessometro_score || 0) },
            ]}
          >
            {stats?.sessometro_level || 'Inizia a registrare'}
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="calendar" size={24} color="#ff6b8a" />
              <Text style={styles.statNumber}>{stats?.total_count || 0}</Text>
              <Text style={styles.statLabel}>Totale</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="today" size={24} color="#ffa502" />
              <Text style={styles.statNumber}>{stats?.monthly_count || 0}</Text>
              <Text style={styles.statLabel}>Questo Mese</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="star" size={24} color="#2ed573" />
              <Text style={styles.statNumber}>{stats?.average_quality || 0}</Text>
              <Text style={styles.statLabel}>Qualità Media</Text>
            </View>
          </View>
        </View>

        {/* Monthly Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {format(new Date(), 'MMMM yyyy', { locale: it })}
          </Text>
          <View style={styles.chartContainer}>
            {monthlyData.slice(0, 15).map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (item.count / maxCount) * 80,
                      backgroundColor: item.count > 0 ? '#ff6b8a' : '#3a3a5e',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
          {monthlyData.length > 15 && (
            <View style={styles.chartContainer}>
              {monthlyData.slice(15).map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.count / maxCount) * 80,
                        backgroundColor: item.count > 0 ? '#ff6b8a' : '#3a3a5e',
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Attività Recente</Text>
          {intimacyEntries.slice(0, 10).map((entry: any, index: number) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityDate}>
                <Text style={styles.activityDay}>
                  {format(parseISO(entry.date), 'd')}
                </Text>
                <Text style={styles.activityMonth}>
                  {format(parseISO(entry.date), 'MMM', { locale: it })}
                </Text>
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityRating}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < entry.quality_rating ? 'heart' : 'heart-outline'}
                      size={16}
                      color={i < entry.quality_rating ? '#ff6b8a' : '#3a3a5e'}
                    />
                  ))}
                </View>
                {entry.notes && (
                  <Text style={styles.activityNotes} numberOfLines={1}>
                    {entry.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {intimacyEntries.length === 0 && (
            <Text style={styles.emptyText}>Nessuna attività registrata</Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={24} color="#ffd700" />
          <Text style={styles.tipsTitle}>Consiglio</Text>
          <Text style={styles.tipsText}>
            Per una relazione sana, gli esperti consigliano almeno 2-3 momenti
            intimi a settimana. Comunicazione e qualità sono più importanti della
            quantità!
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  sessometroCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sessometroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sessometroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gauge: {
    flex: 1,
    height: 16,
    backgroundColor: '#3a3a5e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 8,
  },
  gaugeScore: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    width: 50,
  },
  levelText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 4,
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    minHeight: 4,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5e',
  },
  activityDate: {
    width: 50,
    alignItems: 'center',
  },
  activityDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b8a',
  },
  activityMonth: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  activityContent: {
    flex: 1,
    marginLeft: 16,
  },
  activityRating: {
    flexDirection: 'row',
    gap: 2,
  },
  activityNotes: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
    marginTop: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    lineHeight: 20,
  },
});
