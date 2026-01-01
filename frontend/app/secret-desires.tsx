import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { usePremiumStore } from '../store/premiumStore';
import api from '../services/api';

const { width } = Dimensions.get('window');

// Lista delle fantasie/desideri
const DESIRES_LIST = [
  { id: 'roleplay', emoji: '🎭', name: 'Giochi di ruolo', category: 'fantasy' },
  { id: 'toys', emoji: '🎁', name: 'Toys & Accessori', category: 'exploration' },
  { id: 'bondage_light', emoji: '🎀', name: 'Bondage leggero', category: 'bdsm' },
  { id: 'blindfold', emoji: '🙈', name: 'Benda sugli occhi', category: 'sensory' },
  { id: 'massage', emoji: '💆', name: 'Massaggio erotico', category: 'sensual' },
  { id: 'public_risk', emoji: '🌃', name: 'Rischio in pubblico', category: 'adventure' },
  { id: 'food_play', emoji: '🍓', name: 'Cibo & Sensualità', category: 'sensory' },
  { id: 'lingerie', emoji: '👙', name: 'Lingerie speciale', category: 'visual' },
  { id: 'video', emoji: '📹', name: 'Filmarsi insieme', category: 'visual' },
  { id: 'photo', emoji: '📸', name: 'Foto intime', category: 'visual' },
  { id: 'domination', emoji: '👑', name: 'Dominazione', category: 'bdsm' },
  { id: 'submission', emoji: '🦋', name: 'Sottomissione', category: 'bdsm' },
  { id: 'outdoor', emoji: '🏕️', name: 'All\'aperto', category: 'adventure' },
  { id: 'shower', emoji: '🚿', name: 'Doccia/Vasca', category: 'location' },
  { id: 'morning', emoji: '🌅', name: 'Sesso mattutino', category: 'timing' },
  { id: 'quickie', emoji: '⚡', name: 'Quickie improvviso', category: 'timing' },
  { id: 'slow', emoji: '🕯️', name: 'Lungo e sensuale', category: 'style' },
  { id: 'rough', emoji: '🔥', name: 'Passionale e intenso', category: 'style' },
  { id: 'oral_give', emoji: '💋', name: 'Dare piacere orale', category: 'acts' },
  { id: 'oral_receive', emoji: '😮', name: 'Ricevere piacere orale', category: 'acts' },
  { id: 'new_positions', emoji: '🤸', name: 'Posizioni nuove', category: 'exploration' },
  { id: 'mirror', emoji: '🪞', name: 'Davanti allo specchio', category: 'visual' },
  { id: 'talking_dirty', emoji: '🗣️', name: 'Parole sporche', category: 'verbal' },
  { id: 'sexting', emoji: '📱', name: 'Sexting durante il giorno', category: 'verbal' },
  { id: 'strip', emoji: '💃', name: 'Spogliarello', category: 'visual' },
  { id: 'costume', emoji: '🎃', name: 'Costumi/Travestimenti', category: 'fantasy' },
  { id: 'threesome_fantasy', emoji: '💭', name: 'Fantasia a tre (solo parlarne)', category: 'fantasy' },
  { id: 'watching', emoji: '👀', name: 'Guardare insieme contenuti', category: 'visual' },
  { id: 'surprise', emoji: '🎉', name: 'Sorprese inaspettate', category: 'adventure' },
  { id: 'hotel', emoji: '🏨', name: 'Fuga in hotel', category: 'location' },
];

export default function SecretDesiresScreen() {
  const router = useRouter();
  const { user } = useStore();
  const { isPremium } = usePremiumStore();
  const [myDesires, setMyDesires] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [partnerHasSelected, setPartnerHasSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    loadDesires();
  }, []);

  const loadDesires = async () => {
    if (!user?.couple_code) return;
    
    try {
      const response = await api.get(`/desires/${user.couple_code}/${user.id}`);
      if (response.data) {
        setMyDesires(response.data.my_desires || []);
        setMatches(response.data.matches || []);
        setPartnerHasSelected(response.data.partner_has_selected || false);
      }
    } catch (error) {
      console.log('No desires yet');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDesire = (desireId: string) => {
    setMyDesires(prev => 
      prev.includes(desireId) 
        ? prev.filter(d => d !== desireId)
        : [...prev, desireId]
    );
  };

  const saveDesires = async () => {
    if (!user?.couple_code) return;
    
    setIsSaving(true);
    try {
      const response = await api.post('/desires/save', {
        couple_code: user.couple_code,
        user_id: user.id,
        desires: myDesires,
      });
      
      if (response.data.matches) {
        setMatches(response.data.matches);
        setPartnerHasSelected(response.data.partner_has_selected);
        
        if (response.data.matches.length > 0) {
          Alert.alert(
            '🎉 Nuovi Match!',
            `Hai ${response.data.matches.length} desideri in comune con il tuo partner!`,
            [{ text: 'Scopri', onPress: () => setShowMatches(true) }]
          );
        } else if (response.data.partner_has_selected) {
          Alert.alert(
            '✅ Salvato!',
            'Le tue preferenze sono state salvate. Nessun match ancora - ma continuate a esplorare!',
          );
        } else {
          Alert.alert(
            '✅ Salvato!',
            'Le tue preferenze sono state salvate in segreto. Quando il tuo partner farà le sue scelte, scoprirete i match!',
          );
        }
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  // Non Premium - mostra paywall
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>💭 Desideri Segreti</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Text style={{ fontSize: 60 }}>🔒</Text>
          </View>
          <Text style={styles.lockedTitle}>Funzione Premium</Text>
          <Text style={styles.lockedDesc}>
            Scopri in segreto quali fantasie avete in comune con il tuo partner!
            {'\n\n'}
            • Seleziona i tuoi desideri in totale privacy
            {'\n'}
            • Vedi SOLO quelli che avete entrambi scelto
            {'\n'}
            • Nessun imbarazzo, solo scoperte eccitanti!
          </Text>
          
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => router.push('/paywall')}
          >
            <Ionicons name="lock-open" size={20} color="#fff" />
            <Text style={styles.unlockButtonText}>Sblocca Premium</Text>
          </TouchableOpacity>

          <View style={styles.previewGrid}>
            {DESIRES_LIST.slice(0, 6).map((desire) => (
              <View key={desire.id} style={styles.previewCard}>
                <Text style={styles.previewEmoji}>{desire.emoji}</Text>
                <Text style={styles.previewText}>???</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b8a" />
      </SafeAreaView>
    );
  }

  // Mostra i match
  if (showMatches && matches.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowMatches(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>🎉 I Vostri Match!</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.matchesContent}>
          <View style={styles.matchesHeader}>
            <Text style={styles.matchesEmoji}>💕</Text>
            <Text style={styles.matchesTitle}>
              Avete {matches.length} desideri in comune!
            </Text>
            <Text style={styles.matchesSubtitle}>
              Questi sono i desideri che avete entrambi selezionato in segreto
            </Text>
          </View>

          <View style={styles.matchesGrid}>
            {matches.map((matchId) => {
              const desire = DESIRES_LIST.find(d => d.id === matchId);
              if (!desire) return null;
              return (
                <View key={matchId} style={styles.matchCard}>
                  <Text style={styles.matchEmoji}>{desire.emoji}</Text>
                  <Text style={styles.matchName}>{desire.name}</Text>
                  <View style={styles.matchBadge}>
                    <Ionicons name="heart" size={12} color="#ff6b8a" />
                    <Text style={styles.matchBadgeText}>Match!</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.backToSelectButton}
            onPress={() => setShowMatches(false)}
          >
            <Text style={styles.backToSelectText}>Modifica le tue selezioni</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>💭 Desideri Segreti</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          {partnerHasSelected ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#2ed573" />
              <Text style={styles.statusText}>
                Il tuo partner ha fatto le sue scelte!
              </Text>
              {matches.length > 0 && (
                <TouchableOpacity 
                  style={styles.viewMatchesButton}
                  onPress={() => setShowMatches(true)}
                >
                  <Text style={styles.viewMatchesText}>
                    🎉 {matches.length} Match - Vedi
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Ionicons name="hourglass" size={24} color="#ffa502" />
              <Text style={styles.statusText}>
                In attesa che il tuo partner faccia le sue scelte...
              </Text>
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="eye-off" size={20} color="#888" />
          <Text style={styles.infoText}>
            Le tue selezioni sono segrete! Vedrete solo i desideri che avete entrambi scelto.
          </Text>
        </View>

        {/* Selection Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            Hai selezionato <Text style={styles.counterNumber}>{myDesires.length}</Text> desideri
          </Text>
        </View>

        {/* Desires Grid */}
        <View style={styles.desiresGrid}>
          {DESIRES_LIST.map((desire) => {
            const isSelected = myDesires.includes(desire.id);
            return (
              <TouchableOpacity
                key={desire.id}
                style={[styles.desireCard, isSelected && styles.desireCardSelected]}
                onPress={() => toggleDesire(desire.id)}
              >
                <Text style={styles.desireEmoji}>{desire.emoji}</Text>
                <Text style={[styles.desireName, isSelected && styles.desireNameSelected]}>
                  {desire.name}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, myDesires.length === 0 && styles.saveButtonDisabled]}
          onPress={saveDesires}
          disabled={myDesires.length === 0 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Salva i miei desideri</Text>
            </>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  statusText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  viewMatchesButton: {
    backgroundColor: '#ff6b8a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewMatchesText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#888',
    fontSize: 13,
  },
  // Counter
  counterContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  counterText: {
    color: '#888',
    fontSize: 14,
  },
  counterNumber: {
    color: '#ff6b8a',
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Desires Grid
  desiresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  desireCard: {
    width: (width - 60) / 3,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  desireCardSelected: {
    borderColor: '#ff6b8a',
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
  },
  desireEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  desireName: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
  },
  desireNameSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff6b8a',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#444',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Locked State
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  lockedIcon: {
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  lockedDesc: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
    marginBottom: 30,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    opacity: 0.5,
  },
  previewCard: {
    width: (width - 80) / 3,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 10,
    color: '#666',
  },
  // Matches View
  matchesContent: {
    padding: 20,
    alignItems: 'center',
  },
  matchesHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  matchesEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  matchesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  matchesSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 30,
  },
  matchCard: {
    width: (width - 64) / 2,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b8a',
  },
  matchEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 138, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  matchBadgeText: {
    fontSize: 12,
    color: '#ff6b8a',
    fontWeight: '600',
  },
  backToSelectButton: {
    paddingVertical: 12,
  },
  backToSelectText: {
    color: '#888',
    fontSize: 14,
  },
});
