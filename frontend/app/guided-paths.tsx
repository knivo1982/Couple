import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Guided Paths data
const GUIDED_PATHS = [
  {
    id: 'passion_7',
    title: '7 giorni per riaccendere la passione',
    emoji: '🔥',
    description: 'Un percorso intenso per ravvivare la fiamma tra voi',
    duration: '7 giorni',
    color: '#ff4757',
    premium: true,
    days: [
      { day: 1, title: 'Sguardi intensi', mission: 'Guardatevi negli occhi per 4 minuti senza parlare', reflection: 'Come ti sei sentito/a durante questo momento?', gesture: 'Un complimento sincero sull\'aspetto fisico' },
      { day: 2, title: 'Tocco consapevole', mission: 'Massaggiatevi le mani a vicenda per 10 minuti', reflection: 'Cosa hai scoperto del tocco del partner?', gesture: 'Tieni la mano del partner in un momento inaspettato' },
      { day: 3, title: 'Parole di desiderio', mission: 'Scrivi 3 cose che desideri fare con il partner', reflection: 'È stato facile o difficile esprimere i desideri?', gesture: 'Sussurra qualcosa di piccante all\'orecchio' },
      { day: 4, title: 'Anticipazione', mission: 'Mandate messaggi provocanti durante la giornata', reflection: 'Come ha influito l\'anticipazione sul desiderio?', gesture: 'Bacia il partner in modo inaspettato e appassionato' },
      { day: 5, title: 'Esplorazione', mission: 'Provate una nuova posizione o location', reflection: 'Cosa avete scoperto di nuovo?', gesture: 'Prepara un ambiente romantico (candele, musica)' },
      { day: 6, title: 'Vulnerabilità', mission: 'Condividi una fantasia mai detta prima', reflection: 'Come ti sei sentito/a a condividerla?', gesture: 'Un abbraccio lungo almeno 20 secondi' },
      { day: 7, title: 'Celebrazione', mission: 'Dedicate una serata solo a voi, senza distrazioni', reflection: 'Cosa è cambiato in questi 7 giorni?', gesture: 'Pianifica la prossima avventura insieme' },
    ],
  },
  {
    id: 'connection_30',
    title: '30 giorni di connessione emotiva',
    emoji: '💕',
    description: 'Rafforza il legame emotivo giorno dopo giorno',
    duration: '30 giorni',
    color: '#ff6b8a',
    premium: true,
    days: [
      { day: 1, title: 'Gratitudine', mission: 'Esprimi 3 cose per cui sei grato/a del partner', reflection: 'Come ha reagito?', gesture: 'Lascia un bigliettino dolce' },
      { day: 2, title: 'Ascolto attivo', mission: '15 minuti di conversazione senza telefoni', reflection: 'Cosa hai imparato di nuovo?', gesture: 'Chiedi "Come stai davvero?"' },
      { day: 3, title: 'Ricordi', mission: 'Guardate insieme foto di momenti felici', reflection: 'Quale ricordo vi ha emozionato di più?', gesture: 'Racconta perché ti sei innamorato/a' },
      { day: 4, title: 'Sogni', mission: 'Condividete un sogno per il futuro', reflection: 'I vostri sogni sono allineati?', gesture: 'Pianifica un piccolo passo verso quel sogno' },
      { day: 5, title: 'Supporto', mission: 'Chiedi "Come posso aiutarti oggi?"', reflection: 'Come ti sei sentito/a ad aiutare?', gesture: 'Fai qualcosa che sai che apprezza' },
      // ... altri 25 giorni
    ],
  },
  {
    id: 'intimacy_deep',
    title: 'Percorso intimità profonda',
    emoji: '💋',
    description: 'Esplora nuove dimensioni della vostra intimità',
    duration: '14 giorni',
    color: '#9b59b6',
    premium: true,
    days: [
      { day: 1, title: 'Consapevolezza', mission: 'Meditate insieme per 10 minuti', reflection: 'Come vi siete sentiti?', gesture: 'Respirate all\'unisono per 2 minuti' },
      { day: 2, title: 'Sensorialità', mission: 'Esplorate i 5 sensi insieme', reflection: 'Quale senso vi connette di più?', gesture: 'Preparate un\'esperienza sensoriale' },
      // ... altri giorni
    ],
  },
  {
    id: 'communication',
    title: 'Imparare a comunicare meglio',
    emoji: '💬',
    description: 'Migliora la comunicazione nella coppia',
    duration: '21 giorni',
    color: '#3498db',
    premium: false,
    days: [
      { day: 1, title: 'Io-messaggi', mission: 'Usa solo frasi che iniziano con "Io sento..."', reflection: 'È stato difficile?', gesture: 'Evita "Tu fai sempre..."' },
      { day: 2, title: 'Check-in', mission: 'Fate un check-in emotivo a metà giornata', reflection: 'Vi ha aiutato a sentirvi connessi?', gesture: 'Manda un messaggio "Pensavo a te"' },
      { day: 3, title: 'Bisogni', mission: 'Esprimi un bisogno senza accusare', reflection: 'Come ha reagito il partner?', gesture: 'Chiedi i bisogni del partner' },
    ],
  },
];

export default function GuidedPathsScreen() {
  const router = useRouter();
  const { isPremium } = usePremiumStore();
  const [activePath, setActivePath] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedPath = await AsyncStorage.getItem('active_guided_path');
      const savedDay = await AsyncStorage.getItem('active_guided_day');
      const completed = await AsyncStorage.getItem('completed_guided_days');
      
      if (savedPath) setActivePath(JSON.parse(savedPath));
      if (savedDay) setActiveDay(JSON.parse(savedDay));
      if (completed) setCompletedDays(JSON.parse(completed));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startPath = async (path: any) => {
    if (path.premium && !isPremium) {
      router.push('/paywall');
      return;
    }
    
    setActivePath(path);
    setActiveDay(1);
    setCompletedDays([]);
    
    await AsyncStorage.setItem('active_guided_path', JSON.stringify(path));
    await AsyncStorage.setItem('active_guided_day', JSON.stringify(1));
    await AsyncStorage.setItem('completed_guided_days', JSON.stringify([]));
    
    setPathModalVisible(false);
    Alert.alert('Percorso iniziato! 🎉', `Hai iniziato "${path.title}". Buona fortuna!`);
  };

  const completeDay = async () => {
    const dayKey = `${activePath.id}_day_${activeDay}`;
    const newCompleted = [...completedDays, dayKey];
    setCompletedDays(newCompleted);
    
    await AsyncStorage.setItem('completed_guided_days', JSON.stringify(newCompleted));
    
    if (activeDay < activePath.days.length) {
      const nextDay = activeDay + 1;
      setActiveDay(nextDay);
      await AsyncStorage.setItem('active_guided_day', JSON.stringify(nextDay));
      Alert.alert('Giorno completato! ✨', `Complimenti! Domani ti aspetta il Giorno ${nextDay}`);
    } else {
      Alert.alert('Percorso completato! 🎉', `Hai completato "${activePath.title}"! Siete fantastici!`);
      setActivePath(null);
      await AsyncStorage.removeItem('active_guided_path');
    }
    
    setDayModalVisible(false);
  };

  const openPathDetails = (path: any) => {
    setSelectedPath(path);
    setPathModalVisible(true);
  };

  const openDayDetails = (day: any) => {
    setSelectedDay(day);
    setDayModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🔥 Percorsi Guidati</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Active Path Progress */}
        {activePath && (
          <View style={[styles.activePathCard, { borderColor: activePath.color }]}>
            <View style={styles.activePathHeader}>
              <Text style={styles.activePathEmoji}>{activePath.emoji}</Text>
              <View style={styles.activePathInfo}>
                <Text style={styles.activePathTitle}>{activePath.title}</Text>
                <Text style={styles.activePathProgress}>
                  Giorno {activeDay} di {activePath.days.length}
                </Text>
              </View>
            </View>
            
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(activeDay / activePath.days.length) * 100}%`,
                    backgroundColor: activePath.color 
                  }
                ]} 
              />
            </View>
            
            {/* Today's challenge */}
            {activePath.days[activeDay - 1] && (
              <TouchableOpacity 
                style={styles.todayChallenge}
                onPress={() => openDayDetails(activePath.days[activeDay - 1])}
              >
                <View style={styles.todayChallengeContent}>
                  <Text style={styles.todayChallengeTitle}>
                    Giorno {activeDay}: {activePath.days[activeDay - 1].title}
                  </Text>
                  <Text style={styles.todayChallengeMission} numberOfLines={2}>
                    {activePath.days[activeDay - 1].mission}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={activePath.color} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Path List */}
        <Text style={styles.sectionTitle}>
          {activePath ? 'Altri percorsi' : 'Scegli un percorso'}
        </Text>
        
        {GUIDED_PATHS.filter(p => !activePath || p.id !== activePath.id).map((path) => (
          <TouchableOpacity 
            key={path.id} 
            style={styles.pathCard}
            onPress={() => openPathDetails(path)}
          >
            <View style={[styles.pathIcon, { backgroundColor: path.color + '20' }]}>
              <Text style={styles.pathEmoji}>{path.emoji}</Text>
            </View>
            <View style={styles.pathContent}>
              <View style={styles.pathHeader}>
                <Text style={styles.pathTitle}>{path.title}</Text>
                {path.premium && !isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={12} color="#f39c12" />
                  </View>
                )}
              </View>
              <Text style={styles.pathDescription} numberOfLines={2}>{path.description}</Text>
              <Text style={styles.pathDuration}>{path.duration}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Path Details Modal */}
      <Modal visible={pathModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPath && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>{selectedPath.emoji}</Text>
                  <TouchableOpacity onPress={() => setPathModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalTitle}>{selectedPath.title}</Text>
                <Text style={styles.modalDescription}>{selectedPath.description}</Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Ionicons name="calendar" size={20} color="#ff6b8a" />
                    <Text style={styles.modalStatText}>{selectedPath.duration}</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Ionicons name="flame" size={20} color="#ff6b8a" />
                    <Text style={styles.modalStatText}>{selectedPath.days.length} sfide</Text>
                  </View>
                </View>
                
                <Text style={styles.modalSectionTitle}>Cosa include:</Text>
                <View style={styles.includesList}>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ed573" />
                    <Text style={styles.includeText}>Missione giornaliera</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ed573" />
                    <Text style={styles.includeText}>Riflessione guidata</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ed573" />
                    <Text style={styles.includeText}>Gesto concreto</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.startButton, { backgroundColor: selectedPath.color }]}
                  onPress={() => startPath(selectedPath)}
                >
                  {selectedPath.premium && !isPremium ? (
                    <>
                      <Ionicons name="diamond" size={20} color="#fff" />
                      <Text style={styles.startButtonText}>Sblocca con Premium</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.startButtonText}>Inizia il percorso</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Day Details Modal */}
      <Modal visible={dayModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDay && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Giorno {activeDay}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDayModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.dayTitle}>{selectedDay.title}</Text>
                
                <View style={styles.daySection}>
                  <Text style={styles.daySectionTitle}>🎯 Missione</Text>
                  <Text style={styles.daySectionText}>{selectedDay.mission}</Text>
                </View>
                
                <View style={styles.daySection}>
                  <Text style={styles.daySectionTitle}>💭 Riflessione</Text>
                  <Text style={styles.daySectionText}>{selectedDay.reflection}</Text>
                </View>
                
                <View style={styles.daySection}>
                  <Text style={styles.daySectionTitle}>💕 Gesto del giorno</Text>
                  <Text style={styles.daySectionText}>{selectedDay.gesture}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={completeDay}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.completeButtonText}>Completa il giorno</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20, paddingBottom: 100 },
  
  activePathCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 2 },
  activePathHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  activePathEmoji: { fontSize: 40, marginRight: 14 },
  activePathInfo: { flex: 1 },
  activePathTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  activePathProgress: { fontSize: 14, color: '#888', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#3a3a5e', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 4 },
  todayChallenge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3a3a5e', borderRadius: 14, padding: 16 },
  todayChallengeContent: { flex: 1 },
  todayChallengeTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  todayChallengeMission: { fontSize: 13, color: '#aaa' },
  
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 16 },
  
  pathCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 12 },
  pathIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  pathEmoji: { fontSize: 28 },
  pathContent: { flex: 1 },
  pathHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  premiumBadge: { backgroundColor: 'rgba(243, 156, 18, 0.2)', padding: 4, borderRadius: 8 },
  pathDescription: { fontSize: 13, color: '#888', marginTop: 4 },
  pathDuration: { fontSize: 12, color: '#ff6b8a', marginTop: 6 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e1e38', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalEmoji: { fontSize: 48 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  modalDescription: { fontSize: 16, color: '#aaa', lineHeight: 24, marginBottom: 20 },
  modalStats: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  modalStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalStatText: { fontSize: 14, color: '#fff' },
  modalSectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  includesList: { gap: 10, marginBottom: 24 },
  includeItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  includeText: { fontSize: 15, color: '#ccc' },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
  startButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  
  dayBadge: { backgroundColor: '#ff6b8a', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  dayBadgeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  dayTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  daySection: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 18, marginBottom: 14 },
  daySectionTitle: { fontSize: 14, fontWeight: '600', color: '#ff6b8a', marginBottom: 8 },
  daySectionText: { fontSize: 16, color: '#fff', lineHeight: 24 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ed573', paddingVertical: 18, borderRadius: 16, gap: 10, marginTop: 10 },
  completeButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
});
