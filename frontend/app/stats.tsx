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
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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
    if (score >= 9) return '#ff0000';
    if (score >= 8) return '#ff4757';
    if (score >= 7) return '#ff6b8a';
    if (score >= 5.5) return '#ff9ff3';
    if (score >= 4) return '#ffa502';
    if (score >= 2.5) return '#70a1ff';
    return '#888';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return { icon: 'trending-up', color: '#2ed573', text: 'In crescita' };
      case 'cooling': return { icon: 'trending-down', color: '#ff6b8a', text: 'In calo' };
      default: return { icon: 'remove', color: '#ffa502', text: 'Stabile' };
    }
  };

  const maxCount = Math.max(...monthlyData.map((d) => d.count), 1);
  const trendInfo = getTrendIcon(stats?.passion_trend || 'stable');

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
            <Text style={styles.sessometroEmoji}>{stats?.sessometro_level_emoji || '🌱'}</Text>
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
            {stats?.sessometro_level || 'Nuova Coppia'}
          </Text>

          {/* Score Breakdown */}
          {stats?.score_breakdown && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Come viene calcolato:</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Frequenza (30%)</Text>
                <View style={styles.miniGauge}>
                  <View style={[styles.miniGaugeFill, { width: `${stats.score_breakdown.frequency * 10}%` }]} />
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Qualità (25%)</Text>
                <View style={styles.miniGauge}>
                  <View style={[styles.miniGaugeFill, { width: `${stats.score_breakdown.quality * 10}%` }]} />
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Costanza (20%)</Text>
                <View style={styles.miniGauge}>
                  <View style={[styles.miniGaugeFill, { width: `${stats.score_breakdown.consistency * 10}%` }]} />
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Trend (15%)</Text>
                <View style={styles.miniGauge}>
                  <View style={[styles.miniGaugeFill, { width: `${stats.score_breakdown.trend * 10}%` }]} />
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Varietà (10%)</Text>
                <View style={styles.miniGauge}>
                  <View style={[styles.miniGaugeFill, { width: `${stats.score_breakdown.variety * 10}%` }]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatBox}>
            <Ionicons name="calendar" size={24} color="#ff6b8a" />
            <Text style={styles.quickStatNumber}>{stats?.total_count || 0}</Text>
            <Text style={styles.quickStatLabel}>Totale</Text>
          </View>
          <View style={styles.quickStatBox}>
            <Ionicons name="today" size={24} color="#ffa502" />
            <Text style={styles.quickStatNumber}>{stats?.monthly_count || 0}</Text>
            <Text style={styles.quickStatLabel}>Questo Mese</Text>
          </View>
          <View style={styles.quickStatBox}>
            <Ionicons name="flame" size={24} color="#ff4757" />
            <Text style={styles.quickStatNumber}>{stats?.streak || 0}</Text>
            <Text style={styles.quickStatLabel}>Streak Sett.</Text>
          </View>
          <View style={styles.quickStatBox}>
            <Ionicons name="star" size={24} color="#2ed573" />
            <Text style={styles.quickStatNumber}>{stats?.average_quality || 0}</Text>
            <Text style={styles.quickStatLabel}>Qualità</Text>
          </View>
        </View>

        {/* Trend & Favorite Day */}
        <View style={styles.insightsRow}>
          <View style={styles.insightCard}>
            <Ionicons name={trendInfo.icon as any} size={28} color={trendInfo.color} />
            <Text style={styles.insightLabel}>Passione</Text>
            <Text style={[styles.insightValue, { color: trendInfo.color }]}>{trendInfo.text}</Text>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="heart" size={28} color="#ff6b8a" />
            <Text style={styles.insightLabel}>Giorno Preferito</Text>
            <Text style={styles.insightValue}>{stats?.favorite_day || '-'}</Text>
          </View>
        </View>

        {/* Fun Stats */}
        {stats?.fun_stats && (
          <View style={styles.funStatsCard}>
            <Text style={styles.funStatsTitle}>Statistiche Curiose</Text>
            
            <View style={styles.funStatRow}>
              <View style={styles.funStatIcon}>
                <Ionicons name="time" size={20} color="#70a1ff" />
              </View>
              <View style={styles.funStatContent}>
                <Text style={styles.funStatLabel}>Tempo insieme stimato</Text>
                <Text style={styles.funStatValue}>{stats.fun_stats.total_hours_estimated} ore</Text>
              </View>
            </View>

            <View style={styles.funStatRow}>
              <View style={styles.funStatIcon}>
                <Ionicons name="fitness" size={20} color="#ff6b8a" />
              </View>
              <View style={styles.funStatContent}>
                <Text style={styles.funStatLabel}>Calorie bruciate stimate</Text>
                <Text style={styles.funStatValue}>{stats.fun_stats.calories_burned_estimated} kcal</Text>
              </View>
            </View>

            <View style={styles.funStatRow}>
              <View style={styles.funStatIcon}>
                <Ionicons name="happy" size={20} color="#2ed573" />
              </View>
              <View style={styles.funStatContent}>
                <Text style={styles.funStatLabel}>Boost umore</Text>
                <Text style={styles.funStatValue}>{stats.fun_stats.mood_boost_score}%</Text>
              </View>
            </View>

            <View style={styles.funStatRow}>
              <View style={styles.funStatIcon}>
                <Ionicons name="shuffle" size={20} color="#ffa502" />
              </View>
              <View style={styles.funStatContent}>
                <Text style={styles.funStatLabel}>Spontaneità</Text>
                <Text style={styles.funStatValue}>{stats.fun_stats.spontaneity_score}%</Text>
              </View>
            </View>

            <View style={styles.funStatRow}>
              <View style={styles.funStatIcon}>
                <Ionicons name="heart-half" size={20} color="#ff9ff3" />
              </View>
              <View style={styles.funStatContent}>
                <Text style={styles.funStatLabel}>Stile coppia</Text>
                <Text style={styles.funStatValue}>{stats.fun_stats.romance_vs_passion}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Badges */}
        {stats?.badges && stats.badges.length > 0 && (
          <View style={styles.badgesCard}>
            <Text style={styles.badgesTitle}>I Vostri Badge</Text>
            <View style={styles.badgesGrid}>
              {stats.badges.map((badge: any, index: number) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Next Milestone */}
        {stats?.next_milestone && (
          <View style={styles.milestoneCard}>
            <Ionicons name="trophy" size={24} color="#ffd700" />
            <Text style={styles.milestoneText}>{stats.next_milestone}</Text>
          </View>
        )}

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
                      height: Math.max((item.count / maxCount) * 80, 4),
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
                        height: Math.max((item.count / maxCount) * 80, 4),
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
          {intimacyEntries.slice(0, 5).map((entry: any, index: number) => (
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
    marginBottom: 16,
  },
  sessometroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sessometroEmoji: {
    fontSize: 32,
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
    marginBottom: 16,
  },
  breakdownContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#888',
    width: 100,
  },
  miniGauge: {
    flex: 1,
    height: 6,
    backgroundColor: '#3a3a5e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniGaugeFill: {
    height: '100%',
    backgroundColor: '#ff6b8a',
    borderRadius: 3,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickStatBox: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  funStatsCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  funStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  funStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  funStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  funStatContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  funStatLabel: {
    fontSize: 14,
    color: '#888',
  },
  funStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  badgesCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  badgeDesc: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  milestoneText: {
    flex: 1,
    fontSize: 14,
    color: '#ffd700',
  },
  chartCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
});
