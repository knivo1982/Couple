import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { intimacyAPI, challengeAPI, cycleAPI, userAPI } from '../services/api';
import { format, isToday } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Home() {
  const { user, stats, setStats, fertilityData, setFertilityData, setUser, saveUser } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todaySuggestion, setTodaySuggestion] = useState<any>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.couple_code) return;
    
    try {
      const [statsData, suggestion] = await Promise.all([
        intimacyAPI.getStats(user.couple_code),
        challengeAPI.getRandom(),
      ]);
      setStats(statsData);
      setTodaySuggestion(suggestion);

      // Load fertility data if female
      if (user.gender === 'female') {
        const fertility = await cycleAPI.getFertility(user.id);
        setFertilityData(fertility);
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
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTodayStatus = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (fertilityData?.periods?.includes(today)) {
      return { status: 'period', color: '#ff4757', text: 'Ciclo' };
    }
    if (fertilityData?.ovulation_days?.includes(today)) {
      return { status: 'ovulation', color: '#ffa502', text: 'Ovulazione - Alta fertilità' };
    }
    if (fertilityData?.fertile_days?.includes(today)) {
      return { status: 'fertile', color: '#2ed573', text: 'Giorni fertili' };
    }
    return { status: 'safe', color: '#1e90ff', text: 'Giorni sicuri' };
  };

  const getSessometroColor = (score: number) => {
    if (score >= 8) return '#ff4757';
    if (score >= 6) return '#ff6b8a';
    if (score >= 4) return '#ffa502';
    if (score >= 2) return '#70a1ff';
    return '#888';
  };

  const todayStatus = getTodayStatus();

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
            <Text style={styles.greeting}>Ciao, {user?.name}</Text>
            <Text style={styles.date}>
              {format(new Date(), 'EEEE d MMMM', { locale: it })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Partner Status */}
        <View style={styles.partnerCard}>
          <Ionicons name="heart" size={24} color="#ff6b8a" />
          {user?.partner_id ? (
            <Text style={styles.partnerText}>In coppia con {partnerName || 'Partner'}</Text>
          ) : (
            <TouchableOpacity onPress={handleShareCode}>
              <Text style={styles.partnerText}>
                Codice: {user?.couple_code} <Text style={styles.shareText}>(condividi)</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fertility Status (for females) */}
        {user?.gender === 'female' && (
          <TouchableOpacity
            style={[styles.statusCard, { borderLeftColor: todayStatus.color }]}
            onPress={() => router.push('/calendar')}
          >
            <View style={styles.statusIcon}>
              <Ionicons name="calendar" size={24} color={todayStatus.color} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Oggi</Text>
              <Text style={[styles.statusText, { color: todayStatus.color }]}>
                {todayStatus.text}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        )}

        {/* Sessometro */}
        <TouchableOpacity
          style={styles.sessometroCard}
          onPress={() => router.push('/stats')}
        >
          <View style={styles.sessometroHeader}>
            <Ionicons name="flame" size={28} color="#ff6b8a" />
            <Text style={styles.sessometroTitle}>Sessometro</Text>
          </View>
          
          <View style={styles.sessometroContent}>
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
              {stats?.sessometro_level || 'Inizia a registrare'}
            </Text>
            <View style={styles.sessometroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats?.monthly_count || 0}</Text>
                <Text style={styles.statLabel}>questo mese</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats?.average_quality || 0}</Text>
                <Text style={styles.statLabel}>qualità media</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Today's Suggestion */}
        {todaySuggestion && (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="sparkles" size={20} color="#ffd700" />
              <Text style={styles.suggestionTitle}>Suggerimento del giorno</Text>
            </View>
            <Text style={styles.suggestionName}>
              {todaySuggestion.data.title || todaySuggestion.data.name}
            </Text>
            <Text style={styles.suggestionDesc}>
              {todaySuggestion.data.description}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/calendar')}
          >
            <Ionicons name="calendar" size={28} color="#ff6b8a" />
            <Text style={styles.quickLabel}>Calendario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/spicy')}
          >
            <Ionicons name="flame" size={28} color="#ff6b8a" />
            <Text style={styles.quickLabel}>Piccante</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/stats')}
          >
            <Ionicons name="stats-chart" size={28} color="#ff6b8a" />
            <Text style={styles.quickLabel}>Statistiche</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  partnerText: {
    color: '#fff',
    fontSize: 16,
  },
  shareText: {
    color: '#ff6b8a',
    fontSize: 14,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 14,
    color: '#888',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessometroCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sessometroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sessometroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessometroContent: {
    alignItems: 'center',
  },
  sessometroGauge: {
    width: '100%',
    height: 12,
    backgroundColor: '#3a3a5e',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sessometroFill: {
    height: '100%',
    borderRadius: 6,
  },
  sessometroLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  sessometroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b8a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3a3a5e',
  },
  suggestionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#ffd700',
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    color: '#888',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  quickLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
});
