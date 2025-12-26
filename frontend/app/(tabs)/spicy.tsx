import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { challengeAPI, wishlistAPI, quizAPI, specialDatesAPI, weeklyAPI } from '../../services/api';
import { format, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

const LOVE_DICE_ACTIONS = [
  { action: 'Bacia', target: 'il collo', emoji: '💋' },
  { action: 'Massaggia', target: 'la schiena', emoji: '💆' },
  { action: 'Sussurra', target: 'qualcosa di dolce', emoji: '💬' },
  { action: 'Accarezza', target: 'i capelli', emoji: '🧚' },
  { action: 'Abbraccia', target: 'da dietro', emoji: '🫂' },
  { action: 'Lecca', target: 'il lobo', emoji: '👅' },
  { action: 'Mordicchia', target: 'il labbro', emoji: '😻' },
  { action: 'Guarda negli occhi', target: 'per 30 secondi', emoji: '👀' },
  { action: 'Spoglia lentamente', target: 'un capo', emoji: '👙' },
  { action: 'Bendami e', target: 'sorprendimi', emoji: '🙈' },
];

export default function SpicyScreen() {
  const { user } = useStore();
  const [diceResult, setDiceResult] = useState<any>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [specialDates, setSpecialDates] = useState<any[]>([]);
  const [nextDate, setNextDate] = useState<any>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null);
  
  // Modals
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  
  // Form states
  const [newDateTitle, setNewDateTitle] = useState('');
  const [newDateDate, setNewDateDate] = useState('');
  
  // Timer states
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  
  const diceAnimation = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<any>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [user]);

  const loadData = async () => {
    if (!user?.couple_code) return;

    try {
      const [suggestionsData, wishlistData, quizData, dates, weekly] = await Promise.all([
        challengeAPI.getSuggestions(),
        wishlistAPI.get(user.couple_code, user.id),
        quizAPI.getResults(user.couple_code),
        specialDatesAPI.getAll(user.couple_code),
        weeklyAPI.get(user.couple_code),
      ]);

      setSuggestions(suggestionsData?.challenges || []);
      setWishlist(wishlistData || []);
      setQuizResults(quizData);
      setWeeklyChallenge(weekly);

      if (dates?.dates) {
        setSpecialDates(dates.dates);
        if (dates.next_date) setNextDate(dates.next_date);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const rollDice = () => {
    setIsDiceRolling(true);
    
    Animated.sequence([
      Animated.timing(diceAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      const randomIndex = Math.floor(Math.random() * LOVE_DICE_ACTIONS.length);
      setDiceResult(LOVE_DICE_ACTIONS[randomIndex]);
      setIsDiceRolling(false);
    });
  };

  const toggleWishlistItem = async (itemId: string) => {
    if (!user?.couple_code) return;
    
    try {
      const result = await wishlistAPI.toggle(user.couple_code, user.id, itemId);
      if (result.unlocked) {
        Alert.alert('🎉 Match!', 'Entrambi volete la stessa cosa! È il momento di provare!');
      }
      loadData();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare');
    }
  };

  const addSpecialDate = async () => {
    if (!newDateTitle.trim() || !newDateDate || !user?.couple_code) {
      Alert.alert('Errore', 'Inserisci titolo e data');
      return;
    }

    try {
      await specialDatesAPI.add(user.couple_code, newDateTitle.trim(), newDateDate);
      setNewDateTitle('');
      setNewDateDate('');
      setDateModalVisible(false);
      loadData();
      Alert.alert('Aggiunto!', 'Data speciale salvata');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare');
    }
  };

  const startTimer = () => {
    setTimerRemaining(timerMinutes * 60);
    setTimerActive(true);
    setTimerModalVisible(false);
    
    timerInterval.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current);
          setTimerActive(false);
          Alert.alert('⏰ Tempo scaduto!', 'Il vostro momento speciale è finito');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimerActive(false);
    setTimerRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const diceRotation = diceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Zona Piccante 🔥</Text>

        {/* Active Timer Banner */}
        {timerActive && (
          <TouchableOpacity style={styles.timerBanner} onPress={stopTimer}>
            <View style={styles.timerContent}>
              <Ionicons name="time" size={28} color="#ff6b8a" />
              <Text style={styles.timerBannerTime}>{formatTime(timerRemaining)}</Text>
            </View>
            <Text style={styles.timerBannerText}>Tocca per fermare</Text>
          </TouchableOpacity>
        )}

        {/* Love Dice */}
        <View style={styles.diceCard}>
          <Text style={styles.cardTitle}>🎲 Dado dell'Amore</Text>
          
          <TouchableOpacity style={styles.diceButton} onPress={rollDice} disabled={isDiceRolling}>
            <Animated.View style={{ transform: [{ rotate: diceRotation }] }}>
              <Text style={styles.diceEmoji}>🎲</Text>
            </Animated.View>
          </TouchableOpacity>

          {diceResult && (
            <View style={styles.diceResult}>
              <Text style={styles.diceResultEmoji}>{diceResult.emoji}</Text>
              <Text style={styles.diceResultAction}>{diceResult.action}</Text>
              <Text style={styles.diceResultTarget}>{diceResult.target}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => setTimerModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(255, 107, 138, 0.2)' }]}>
              <Ionicons name="time" size={24} color="#ff6b8a" />
            </View>
            <Text style={styles.quickLabel}>Timer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setWishlistModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(255, 165, 2, 0.2)' }]}>
              <Ionicons name="heart-half" size={24} color="#ffa502" />
            </View>
            <Text style={styles.quickLabel}>Wishlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setDateModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(46, 213, 115, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={24} color="#2ed573" />
            </View>
            <Text style={styles.quickLabel}>Date</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Challenge */}
        {weeklyChallenge && !weeklyChallenge.completed && (
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Ionicons name="trophy" size={24} color="#ffd700" />
              <Text style={styles.challengeTitle}>Sfida della Settimana</Text>
            </View>
            <Text style={styles.challengeName}>{weeklyChallenge.challenge.title}</Text>
            <Text style={styles.challengeDesc}>{weeklyChallenge.challenge.description}</Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={async () => {
                try {
                  await weeklyAPI.complete(user!.couple_code);
                  Alert.alert('Complimenti! 🎉', 'Sfida completata!');
                  loadData();
                } catch (e) {
                  Alert.alert('Errore', 'Impossibile completare');
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.completeButtonText}>Completata!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Suggestions */}
        <Text style={styles.sectionTitle}>💡 Suggerimenti</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <View key={index} style={styles.suggestionCard}>
              <Text style={styles.suggestionEmoji}>{suggestion.spicy ? '🔥' : '🌸'}</Text>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDesc} numberOfLines={2}>{suggestion.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Next Special Date */}
        {nextDate && (
          <View style={styles.countdownCard}>
            <Ionicons name="heart" size={28} color="#ff6b8a" />
            <View style={styles.countdownContent}>
              <Text style={styles.countdownTitle}>{nextDate.title}</Text>
              <Text style={styles.countdownDate}>
                {format(parseISO(nextDate.date), 'd MMMM yyyy', { locale: it })}
              </Text>
            </View>
            <Text style={styles.countdownDays}>
              {differenceInDays(parseISO(nextDate.date), new Date())} giorni
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Timer Modal */}
      <Modal visible={timerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⏱️ Timer Romantico</Text>
              <TouchableOpacity onPress={() => setTimerModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.timerLabel}>Durata (minuti)</Text>
            <View style={styles.timerPicker}>
              {[5, 10, 15, 20, 30].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.timerOption, timerMinutes === mins && styles.timerOptionActive]}
                  onPress={() => setTimerMinutes(mins)}
                >
                  <Text style={[styles.timerOptionText, timerMinutes === mins && styles.timerOptionTextActive]}>{mins}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.timerHint}>Perfetto per massaggi, coccole, o sfide a tempo!</Text>

            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Inizia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wishlist Modal */}
      <Modal visible={wishlistModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.wishlistModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💋 Wishlist Segreta</Text>
              <TouchableOpacity onPress={() => setWishlistModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.wishlistHint}>Se entrambi selezionate lo stesso... si sblocca!</Text>

            <ScrollView style={styles.wishlistScroll}>
              {suggestions.filter(s => s.spicy).slice(0, 10).map((item, index) => {
                const isSelected = wishlist.some((w: any) => w.item_id === item.id && w.wants);
                const isUnlocked = wishlist.some((w: any) => w.item_id === item.id && w.both_want);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.wishlistItem, isUnlocked && styles.wishlistItemUnlocked]}
                    onPress={() => toggleWishlistItem(item.id || `item-${index}`)}
                  >
                    <View style={styles.wishlistLeft}>
                      {isUnlocked ? (
                        <Ionicons name="lock-open" size={20} color="#2ed573" />
                      ) : isSelected ? (
                        <Ionicons name="heart" size={20} color="#ff6b8a" />
                      ) : (
                        <Ionicons name="heart-outline" size={20} color="#666" />
                      )}
                      <Text style={[styles.wishlistText, isUnlocked && styles.wishlistTextUnlocked]}>
                        {item.title}
                      </Text>
                    </View>
                    {isUnlocked && <Text style={styles.matchBadge}>Match!</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Date Modal */}
      <Modal visible={dateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Nuova Data Speciale</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Titolo (es. Anniversario)"
              placeholderTextColor="#888"
              value={newDateTitle}
              onChangeText={setNewDateTitle}
            />

            <TouchableOpacity style={styles.datePickerButton} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar" size={20} color="#ff6b8a" />
              <Text style={styles.datePickerText}>
                {newDateDate ? format(parseISO(newDateDate), 'd MMMM yyyy', { locale: it }) : 'Seleziona data'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, (!newDateTitle.trim() || !newDateDate) && styles.saveButtonDisabled]}
              onPress={addSpecialDate}
              disabled={!newDateTitle.trim() || !newDateDate}
            >
              <Text style={styles.saveButtonText}>Salva</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={datePickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Data</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => { setNewDateDate(day.dateString); setDatePickerVisible(false); }}
              markedDates={newDateDate ? { [newDateDate]: { selected: true, selectedColor: '#ff6b8a' } } : {}}
              theme={{ calendarBackground: '#2a2a4e', selectedDayBackgroundColor: '#ff6b8a', selectedDayTextColor: '#fff', todayTextColor: '#ff6b8a', dayTextColor: '#fff', textDisabledColor: '#444', monthTextColor: '#fff', arrowColor: '#ff6b8a' }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  
  timerBanner: { backgroundColor: 'rgba(255, 107, 138, 0.2)', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: '#ff6b8a' },
  timerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerBannerTime: { fontSize: 48, fontWeight: 'bold', color: '#ff6b8a' },
  timerBannerText: { color: '#888', marginTop: 8 },
  
  diceCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  diceButton: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#3a3a5e', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  diceEmoji: { fontSize: 56 },
  diceResult: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#3a3a5e', width: '100%' },
  diceResultEmoji: { fontSize: 40, marginBottom: 8 },
  diceResultAction: { fontSize: 22, fontWeight: 'bold', color: '#ff6b8a' },
  diceResultTarget: { fontSize: 16, color: '#aaa', marginTop: 4 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, color: '#888' },
  
  challengeCard: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  challengeTitle: { fontSize: 14, color: '#ffd700', fontWeight: '500' },
  challengeName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  challengeDesc: { fontSize: 14, color: '#aaa', marginBottom: 16 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ed573', padding: 12, borderRadius: 10, gap: 8 },
  completeButtonText: { color: '#fff', fontWeight: '600' },
  
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  suggestionsScroll: { marginBottom: 20, marginHorizontal: -20, paddingHorizontal: 20 },
  suggestionCard: { width: 160, backgroundColor: '#2a2a4e', borderRadius: 14, padding: 16, marginRight: 12 },
  suggestionEmoji: { fontSize: 24, marginBottom: 8 },
  suggestionTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  suggestionDesc: { fontSize: 12, color: '#888' },
  
  countdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', padding: 16, borderRadius: 16, gap: 14 },
  countdownContent: { flex: 1 },
  countdownTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  countdownDate: { fontSize: 12, color: '#888', marginTop: 2 },
  countdownDays: { fontSize: 24, fontWeight: 'bold', color: '#ff6b8a' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  wishlistModalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  datePickerModal: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  
  timerLabel: { color: '#888', marginBottom: 12 },
  timerPicker: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  timerOption: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3a3a5e' },
  timerOptionActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.2)' },
  timerOptionText: { fontSize: 18, color: '#888', fontWeight: '600' },
  timerOptionTextActive: { color: '#ff6b8a' },
  timerHint: { color: '#666', textAlign: 'center', marginBottom: 20 },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 14, gap: 8 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  
  wishlistHint: { color: '#888', marginBottom: 16 },
  wishlistScroll: { maxHeight: 400 },
  wishlistItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 8 },
  wishlistItemUnlocked: { backgroundColor: 'rgba(46, 213, 115, 0.1)', borderWidth: 1, borderColor: '#2ed573' },
  wishlistLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  wishlistText: { color: '#fff', fontSize: 14, flex: 1 },
  wishlistTextUnlocked: { color: '#2ed573' },
  matchBadge: { backgroundColor: '#2ed573', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3a3a5e', gap: 12 },
  datePickerText: { color: '#fff', fontSize: 16 },
  calendar: { borderRadius: 16, overflow: 'hidden' },
  saveButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 14 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
