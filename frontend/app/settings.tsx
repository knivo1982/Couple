import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { userAPI } from '../services/api';

export default function SettingsScreen() {
  const { user, saveUser, logout } = useStore();
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [coupleCode, setCoupleCode] = useState('');

  useEffect(() => {
    loadPartner();
  }, [user]);

  const loadPartner = async () => {
    if (user?.partner_id) {
      try {
        const partner = await userAPI.get(user.partner_id);
        setPartnerName(partner.name);
      } catch (error) {
        console.log('Partner not found');
      }
    }
  };

  const handleJoinCouple = async () => {
    if (!coupleCode.trim() || !user) return;

    try {
      await userAPI.joinCouple(user.id, coupleCode.trim().toUpperCase());
      const updatedUser = await userAPI.get(user.id);
      await saveUser(updatedUser);
      setJoinModalVisible(false);
      setCoupleCode('');
      Alert.alert('Successo', 'Coppia collegata!');
    } catch (error: any) {
      Alert.alert('Errore', error.response?.data?.detail || 'Codice non valido');
    }
  };

  const handleShareCode = () => {
    Alert.alert(
      'Codice Coppia',
      `Condividi questo codice con il tuo partner:\n\n${user?.couple_code}`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Esci',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Impostazioni</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profilo</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons
                name={user?.gender === 'male' ? 'male' : 'female'}
                size={40}
                color="#ff6b8a"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileGender}>
                {user?.gender === 'male' ? 'Uomo' : 'Donna'}
              </Text>
            </View>
          </View>
        </View>

        {/* Couple Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coppia</Text>
          
          <View style={styles.coupleCard}>
            <View style={styles.coupleRow}>
              <Text style={styles.coupleLabel}>Il tuo codice:</Text>
              <TouchableOpacity onPress={handleShareCode}>
                <Text style={styles.coupleCode}>{user?.couple_code}</Text>
              </TouchableOpacity>
            </View>

            {user?.partner_id ? (
              <View style={styles.coupleRow}>
                <Text style={styles.coupleLabel}>Partner:</Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="heart" size={16} color="#ff6b8a" />
                  <Text style={styles.partnerName}>{partnerName || 'Partner'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.notConnected}>
                <Text style={styles.notConnectedText}>
                  Non ancora collegato a un partner
                </Text>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => setJoinModalVisible(true)}
                >
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.joinButtonText}>Inserisci Codice Partner</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Come Funziona</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(255, 71, 87, 0.2)' }]}>
                <Ionicons name="calendar" size={24} color="#ff4757" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Calendario</Text>
                <Text style={styles.infoDesc}>
                  Traccia il ciclo e i giorni fertili. Registra i momenti insieme.
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(255, 107, 138, 0.2)' }]}>
                <Ionicons name="flame" size={24} color="#ff6b8a" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Sessometro</Text>
                <Text style={styles.infoDesc}>
                  Misura l'affinità di coppia basata su frequenza e qualità.
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(255, 165, 2, 0.2)' }]}>
                <Ionicons name="sparkles" size={24} color="#ffa502" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Zona Piccante</Text>
                <Text style={styles.infoDesc}>
                  Sfide, suggerimenti e quiz per ravvivare la passione.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#ff4757" />
          <Text style={styles.logoutText}>Esci</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Couple Bliss v1.0</Text>
      </ScrollView>

      {/* Join Couple Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collega Partner</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Inserisci il codice del tuo partner per collegare i vostri account
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Codice Partner"
              placeholderTextColor="#888"
              value={coupleCode}
              onChangeText={(text) => setCoupleCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.submitButton, !coupleCode.trim() && styles.submitButtonDisabled]}
              onPress={handleJoinCouple}
              disabled={!coupleCode.trim()}
            >
              <Text style={styles.submitButtonText}>Collega</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  profileGender: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  coupleCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
  },
  coupleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coupleLabel: {
    fontSize: 14,
    color: '#888',
  },
  coupleCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff6b8a',
    letterSpacing: 2,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  partnerName: {
    fontSize: 14,
    color: '#ff6b8a',
  },
  notConnected: {
    alignItems: 'center',
    paddingTop: 12,
  },
  notConnectedText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b8a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a4e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    textAlign: 'center',
    letterSpacing: 4,
  },
  submitButton: {
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
