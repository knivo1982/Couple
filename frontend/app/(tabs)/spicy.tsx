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
import { challengeAPI, wishlistAPI, specialDatesAPI, weeklyAPI } from '../../services/api';
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

// Wishlist items predefiniti
const WISHLIST_ITEMS = [
  { id: 'roleplay', title: 'Gioco di ruolo', emoji: '🎭', category: 'fantasia' },
  { id: 'bondage_light', title: 'Bondage leggero', emoji: '🎀', category: 'kink' },
  { id: 'massage_sensual', title: 'Massaggio sensuale con oli', emoji: '💆', category: 'romantico' },
  { id: 'toys', title: 'Usare un toy insieme', emoji: '🎁', category: 'novità' },
  { id: 'outdoor', title: 'Fare l\'amore all\'aperto', emoji: '🌳', category: 'avventura' },
  { id: 'mirror', title: 'Davanti allo specchio', emoji: '🪞', category: 'novità' },
  { id: 'food_play', title: 'Cibo e panna', emoji: '🍓', category: 'gioco' },
  { id: 'strip_tease', title: 'Spogliarello', emoji: '💃', category: 'gioco' },
  { id: 'photos', title: 'Foto/video intimi', emoji: '📸', category: 'ricordi' },
  { id: 'shower_together', title: 'Doccia/vasca insieme', emoji: '🚿', category: 'romantico' },
  { id: 'blindfold', title: 'Benda sugli occhi', emoji: '🙈', category: 'kink' },
  { id: 'ice_play', title: 'Gioco con il ghiaccio', emoji: '🧊', category: 'gioco' },
  { id: 'morning_sex', title: 'Sesso mattutino', emoji: '🌅', category: 'tempo' },
  { id: 'quickie', title: 'Quickie improvviso', emoji: '⚡', category: 'tempo' },
  { id: 'lingerie', title: 'Lingerie sexy nuova', emoji: '👙', category: 'novità' },
  { id: 'dirty_talk', title: 'Dirty talk intenso', emoji: '🔥', category: 'comunicazione' },
  { id: 'massage_full', title: 'Massaggio corpo intero', emoji: '✨', category: 'romantico' },
  { id: 'fantasies_share', title: 'Condividere fantasie', emoji: '💭', category: 'comunicazione' },
];

export default function SpicyScreen() {
  const { user } = useStore();
  const [diceResult, setDiceResult] = useState<any>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
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
      // Load suggestions first (most important)
      const suggestionsData = await challengeAPI.getSuggestions();
      setSuggestions(suggestionsData?.challenges || []);
      
      // Load other data with individual error handling
      try {
        const wishlistData = await wishlistAPI.get(user.couple_code, user.id);
        // API returns { my_wishes: [], unlocked_wishes: [], partner_secret_wishes_count: 0 }
        const allWishes = [
          ...(wishlistData?.my_wishes || []),
          ...(wishlistData?.unlocked_wishes || [])
        ];
        setWishlist(allWishes);
      } catch (e) {
        console.log('Wishlist not available');
        setWishlist([]);
      }
      
      try {
        const dates = await specialDatesAPI.getAll(user.couple_code);
        if (dates?.dates) {
          setSpecialDates(dates.dates);
          if (dates.next_date) setNextDate(dates.next_date);
        }
      } catch (e) {
        console.log('Special dates not available');
      }
      
      try {
        const weekly = await weeklyAPI.get(user.couple_code);
        setWeeklyChallenge(weekly);
      } catch (e) {
        console.log('Weekly challenge not available');
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

  const isItemSelected = (itemId: string) => {
    if (!Array.isArray(wishlist)) return false;
    return wishlist.some((w: any) => w.item_id === itemId && w.wants);
  };

  const isItemUnlocked = (itemId: string) => {
    if (!Array.isArray(wishlist)) return false;
    return wishlist.some((w: any) => w.item_id === itemId && w.both_want);
  };

  const getUnlockedCount = () => {
    if (!Array.isArray(wishlist)) return 0;
    return WISHLIST_ITEMS.filter(item => isItemUnlocked(item.id)).length;
  };

  const getSelectedCount = () => {
    if (!Array.isArray(wishlist)) return 0;
    return WISHLIST_ITEMS.filter(item => isItemSelected(item.id)).length;
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fantasia': return '#9b59b6';
      case 'kink': return '#e74c3c';
      case 'romantico': return '#ff6b8a';
      case 'novità': return '#3498db';
      case 'avventura': return '#27ae60';
      case 'gioco': return '#f39c12';
      case 'tempo': return '#1abc9c';
      case 'comunicazione': return '#e91e63';
      default: return '#888';
    }
  };

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
          
          {!diceResult && (
            <Text style={styles.diceHint}>Tocca il dado per una sfida!</Text>
          )}
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => setTimerModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(255, 107, 138, 0.2)' }]}>
              <Ionicons name="time" size={26} color="#ff6b8a" />
            </View>
            <Text style={styles.quickLabel}>Timer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setWishlistModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(255, 165, 2, 0.2)' }]}>
              <Ionicons name="heart-half" size={26} color="#ffa502" />
              {getUnlockedCount() > 0 && (
                <View style={styles.quickBadge}>
                  <Text style={styles.quickBadgeText}>{getUnlockedCount()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickLabel}>Wishlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setDateModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(46, 213, 115, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={26} color="#2ed573" />
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
          {suggestions.slice(0, 6).map((suggestion, index) => (
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
            <View style={styles.countdownIcon}>
              <Ionicons name="heart" size={28} color="#ff6b8a" />
            </View>
            <View style={styles.countdownContent}>
              <Text style={styles.countdownTitle}>{nextDate.title}</Text>
              <Text style={styles.countdownDate}>
                {format(parseISO(nextDate.date), 'd MMMM yyyy', { locale: it })}
              </Text>
            </View>
            <View style={styles.countdownDaysContainer}>
              <Text style={styles.countdownDays}>
                {differenceInDays(parseISO(nextDate.date), new Date())}
              </Text>
              <Text style={styles.countdownDaysLabel}>giorni</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Timer Modal */}
      <Modal visible={timerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⏱️ Timer Romantico</Text>
              <TouchableOpacity onPress={() => setTimerModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
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

      {/* Wishlist Modal - FIXED */}
      <Modal visible={wishlistModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.wishlistModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💋 Wishlist Segreta</Text>
              <TouchableOpacity onPress={() => setWishlistModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.wishlistStats}>
              <View style={styles.wishlistStat}>
                <Text style={styles.wishlistStatNumber}>{getSelectedCount()}</Text>
                <Text style={styles.wishlistStatLabel}>Selezionate</Text>
              </View>
              <View style={styles.wishlistStatDivider} />
              <View style={styles.wishlistStat}>
                <Text style={[styles.wishlistStatNumber, { color: '#2ed573' }]}>{getUnlockedCount()}</Text>
                <Text style={styles.wishlistStatLabel}>Match! 🔓</Text>
              </View>
            </View>

            <Text style={styles.wishlistHint}>
              Se entrambi selezionate lo stesso desiderio... si sblocca! 🔥
            </Text>

            <ScrollView style={styles.wishlistScroll} showsVerticalScrollIndicator={false}>
              {WISHLIST_ITEMS.map((item) => {
                const selected = isItemSelected(item.id);
                const unlocked = isItemUnlocked(item.id);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.wishlistItem,
                      selected && styles.wishlistItemSelected,
                      unlocked && styles.wishlistItemUnlocked
                    ]}
                    onPress={() => toggleWishlistItem(item.id)}
                  >
                    <View style={styles.wishlistItemLeft}>
                      <Text style={styles.wishlistEmoji}>{item.emoji}</Text>
                      <View style={styles.wishlistItemContent}>
                        <Text style={[styles.wishlistText, unlocked && styles.wishlistTextUnlocked]}>
                          {item.title}
                        </Text>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '30' }]}>
                          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                            {item.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.wishlistItemRight}>
                      {unlocked ? (
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchText}>Match!</Text>
                        </View>
                      ) : selected ? (
                        <View style={styles.heartFilled}>
                          <Ionicons name="heart" size={22} color="#ff6b8a" />
                        </View>
                      ) : (
                        <View style={styles.heartOutline}>
                          <Ionicons name="heart-outline" size={22} color="#555" />
                        </View>
                      )}
                    </View>
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
              <TouchableOpacity onPress={() => setDateModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Titolo (es. Anniversario)"
              placeholderTextColor="#666"
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
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
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
  
  timerBanner: { backgroundColor: 'rgba(255, 107, 138, 0.15)', borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: '#ff6b8a' },
  timerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerBannerTime: { fontSize: 52, fontWeight: 'bold', color: '#ff6b8a' },
  timerBannerText: { color: '#888', marginTop: 8 },
  
  diceCard: { backgroundColor: '#2a2a4e', borderRadius: 24, padding: 28, marginBottom: 24, alignItems: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 20 },
  diceButton: { width: 110, height: 110, borderRadius: 24, backgroundColor: '#3a3a5e', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  diceEmoji: { fontSize: 60 },
  diceResult: { alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#3a3a5e', width: '100%' },
  diceResultEmoji: { fontSize: 44, marginBottom: 8 },
  diceResultAction: { fontSize: 24, fontWeight: 'bold', color: '#ff6b8a' },
  diceResultTarget: { fontSize: 16, color: '#aaa', marginTop: 4 },
  diceHint: { color: '#666', fontSize: 14 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickIcon: { width: 68, height: 68, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#2ed573', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  quickLabel: { fontSize: 13, color: '#888' },
  
  challengeCard: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  challengeTitle: { fontSize: 14, color: '#ffd700', fontWeight: '600' },
  challengeName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 6 },
  challengeDesc: { fontSize: 14, color: '#aaa', marginBottom: 16, lineHeight: 20 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ed573', padding: 14, borderRadius: 14, gap: 8 },
  completeButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 14 },
  suggestionsScroll: { marginBottom: 24, marginHorizontal: -20, paddingHorizontal: 20 },
  suggestionCard: { width: 170, backgroundColor: '#2a2a4e', borderRadius: 18, padding: 18, marginRight: 12 },
  suggestionEmoji: { fontSize: 28, marginBottom: 10 },
  suggestionTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 6 },
  suggestionDesc: { fontSize: 12, color: '#888', lineHeight: 16 },
  
  countdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', padding: 18, borderRadius: 18, gap: 14 },
  countdownIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255, 107, 138, 0.2)', justifyContent: 'center', alignItems: 'center' },
  countdownContent: { flex: 1 },
  countdownTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  countdownDate: { fontSize: 13, color: '#888', marginTop: 2 },
  countdownDaysContainer: { alignItems: 'center' },
  countdownDays: { fontSize: 32, fontWeight: 'bold', color: '#ff6b8a' },
  countdownDaysLabel: { fontSize: 11, color: '#888' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e1e38', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  wishlistModalContent: { backgroundColor: '#1e1e38', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 30, maxHeight: '85%' },
  datePickerModal: { backgroundColor: '#1e1e38', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  
  timerLabel: { color: '#aaa', marginBottom: 14, fontSize: 15 },
  timerPicker: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  timerOption: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3a3a5e' },
  timerOptionActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.2)' },
  timerOptionText: { fontSize: 20, color: '#888', fontWeight: '600' },
  timerOptionTextActive: { color: '#ff6b8a' },
  timerHint: { color: '#666', textAlign: 'center', marginBottom: 24 },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 18, borderRadius: 16, gap: 10 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  
  wishlistStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 16 },
  wishlistStat: { alignItems: 'center', flex: 1 },
  wishlistStatNumber: { fontSize: 28, fontWeight: 'bold', color: '#ff6b8a' },
  wishlistStatLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  wishlistStatDivider: { width: 1, height: 40, backgroundColor: '#3a3a5e' },
  wishlistHint: { color: '#888', marginBottom: 16, textAlign: 'center', fontSize: 13 },
  wishlistScroll: { maxHeight: 420 },
  
  wishlistItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2a2a4e', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: '#3a3a5e' },
  wishlistItemSelected: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.1)' },
  wishlistItemUnlocked: { borderColor: '#2ed573', backgroundColor: 'rgba(46, 213, 115, 0.1)' },
  wishlistItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  wishlistEmoji: { fontSize: 32 },
  wishlistItemContent: { flex: 1 },
  wishlistText: { color: '#fff', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  wishlistTextUnlocked: { color: '#2ed573' },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  wishlistItemRight: {},
  heartFilled: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 107, 138, 0.2)', justifyContent: 'center', alignItems: 'center' },
  heartOutline: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3a3a5e', justifyContent: 'center', alignItems: 'center' },
  matchBadge: { backgroundColor: '#2ed573', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  matchText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  input: { backgroundColor: '#2a2a4e', borderRadius: 14, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#3a3a5e', gap: 12 },
  datePickerText: { color: '#fff', fontSize: 16 },
  calendar: { borderRadius: 16, overflow: 'hidden' },
  saveButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 18, borderRadius: 16 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
