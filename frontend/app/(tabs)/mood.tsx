import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { moodAPI, loveNotesAPI } from '../../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '🥰'];
const ENERGY_EMOJIS = ['😴', '🥱', '😌', '💪', '⚡'];
const STRESS_EMOJIS = ['😌', '🙂', '😬', '😰', '🤯'];
const LIBIDO_EMOJIS = ['❄️', '🌸', '🌺', '🔥', '💋'];

// Template di note precompilate
const NOTE_TEMPLATES: { [key: string]: string[] } = {
  sweet: [
    'Grazie di esistere nella mia vita 🌹',
    'Sei il mio pensiero fisso 💭',
    'Mi manchi tantissimo 💕',
    'Sei la persona più speciale che conosca ✨',
    'Non vedo l\'ora di abbracciarti 🤗',
  ],
  spicy: [
    'Stasera ho voglia di te... 🔥',
    'Non riesco a smettere di pensare a ieri notte 😏',
    'Mi fai impazzire... in senso buono 😈',
    'Ho delle idee per stasera... 💋',
    'Sei irresistibile 🥵',
  ],
  funny: [
    'Sei il mio preferito tra tutti i miei partner 😂',
    'Ti amo più del wifi ❤️📶',
    'Sei la mia persona strana preferita 🤪',
    'Senza di te sarei single 🤷‍♂️',
    'Sei il formaggio dei miei maccheroni 🧀',
  ],
  romantic: [
    'Sei la cosa più bella che mi sia mai capitata 💕',
    'Non vedo l\'ora di rivederti ❤️',
    'Con te ogni giorno è speciale 🌟',
    'Sei il mio per sempre 💍',
    'Ti amo più di ieri, meno di domani ❤️',
  ],
};

export default function MoodScreen() {
  const { user } = useStore();
  const [todayMood, setTodayMood] = useState<any>(null);
  const [partnerMood, setPartnerMood] = useState<any>(null);
  const [moodStats, setMoodStats] = useState<any>(null);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [receivedNotes, setReceivedNotes] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Mood form state
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [libido, setLibido] = useState(3);
  const [moodNotes, setMoodNotes] = useState('');
  
  // Note form state
  const [noteMessage, setNoteMessage] = useState('');
  const [noteCategory, setNoteCategory] = useState('sweet');

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds for real-time sync
    const pollInterval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [user]);

  const loadData = async () => {
    if (!user?.couple_code) return;

    try {
      const [todayEntries, stats, unread, notes] = await Promise.all([
        moodAPI.getToday(user.couple_code),
        moodAPI.getStats(user.couple_code),
        loveNotesAPI.getUnread(user.couple_code, user.id),
        loveNotesAPI.getReceived(user.couple_code, user.id),
      ]);

      // Find my mood and partner's mood
      const myMood = todayEntries.find((e: any) => e.user_id === user.id);
      const partnerMoodEntry = todayEntries.find((e: any) => e.user_id !== user.id);
      
      setTodayMood(myMood);
      setPartnerMood(partnerMoodEntry);
      setMoodStats(stats);
      setUnreadCount(unread.count);
      setReceivedNotes(notes);
    } catch (error) {
      console.error('Error loading mood data:', error);
    }
  };

  const saveMood = async () => {
    if (!user?.couple_code) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await moodAPI.log(
        user.id,
        user.couple_code,
        today,
        mood,
        energy,
        stress,
        libido,
        moodNotes || undefined
      );
      setMoodModalVisible(false);
      loadData();
      Alert.alert('Salvato!', 'Il tuo mood è stato registrato 💕');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare il mood');
    }
  };

  const sendNote = async () => {
    if (!noteMessage.trim() || !user?.couple_code) return;

    try {
      await loveNotesAPI.send(
        user.couple_code,
        user.id,
        user.name,
        noteMessage.trim(),
        noteCategory
      );
      setNoteModalVisible(false);
      setNoteMessage('');
      Alert.alert('Inviato!', 'La tua nota d\'amore è stata inviata 💌');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile inviare la nota');
    }
  };

  const markNoteAsRead = async (noteId: string) => {
    try {
      await loveNotesAPI.markRead(noteId);
      loadData();
    } catch (error) {
      console.error('Error marking note as read:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sweet': return '#ff9ff3';
      case 'spicy': return '#ff4757';
      case 'funny': return '#ffa502';
      case 'romantic': return '#ff6b8a';
      default: return '#888';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'sweet': return '💕';
      case 'spicy': return '🔥';
      case 'funny': return '😄';
      case 'romantic': return '💋';
      default: return '💬';
    }
  };

  const renderMoodSlider = (
    label: string,
    value: number,
    setValue: (v: number) => void,
    emojis: string[]
  ) => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.emojiRow}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emojiButton,
              value === index + 1 && styles.emojiButtonActive,
            ]}
            onPress={() => setValue(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mood Tracker</Text>
          <Text style={styles.subtitle}>
            {format(new Date(), 'EEEE d MMMM', { locale: it })}
          </Text>
        </View>

        {/* Today's Mood Card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Il Tuo Mood Oggi</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setMoodModalVisible(true)}
            >
              <Ionicons name={todayMood ? 'pencil' : 'add'} size={20} color="#ff6b8a" />
            </TouchableOpacity>
          </View>

          {todayMood ? (
            <View style={styles.moodDisplay}>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{MOOD_EMOJIS[todayMood.mood - 1]}</Text>
                <Text style={styles.moodLabel}>Umore</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{ENERGY_EMOJIS[todayMood.energy - 1]}</Text>
                <Text style={styles.moodLabel}>Energia</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{STRESS_EMOJIS[todayMood.stress - 1]}</Text>
                <Text style={styles.moodLabel}>Stress</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{LIBIDO_EMOJIS[todayMood.libido - 1]}</Text>
                <Text style={styles.moodLabel}>Desiderio</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addMoodButton}
              onPress={() => setMoodModalVisible(true)}
            >
              <Ionicons name="add-circle" size={48} color="#ff6b8a" />
              <Text style={styles.addMoodText}>Registra il tuo mood</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Partner's Mood */}
        {partnerMood && (
          <View style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
              <Ionicons name="heart" size={20} color="#ff6b8a" />
              <Text style={styles.partnerTitle}>Mood del Partner</Text>
            </View>
            <View style={styles.moodDisplay}>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmojiSmall}>{MOOD_EMOJIS[partnerMood.mood - 1]}</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmojiSmall}>{ENERGY_EMOJIS[partnerMood.energy - 1]}</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmojiSmall}>{STRESS_EMOJIS[partnerMood.stress - 1]}</Text>
              </View>
              <View style={styles.moodItem}>
                <Text style={styles.moodEmojiSmall}>{LIBIDO_EMOJIS[partnerMood.libido - 1]}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sync Score */}
        {moodStats && moodStats.sync_score > 0 && (
          <View style={styles.syncCard}>
            <Text style={styles.syncTitle}>Sintonia di Coppia</Text>
            <Text style={styles.syncScore}>{moodStats.sync_score}%</Text>
            <View style={styles.syncBar}>
              <View style={[styles.syncFill, { width: `${moodStats.sync_score}%` }]} />
            </View>
            <Text style={styles.syncLabel}>Basato sugli ultimi 30 giorni</Text>
          </View>
        )}

        {/* Love Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <Text style={styles.notesSectionTitle}>Note d'Amore</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.sendNoteButton}
            onPress={() => setNoteModalVisible(true)}
          >
            <Ionicons name="heart" size={24} color="#fff" />
            <Text style={styles.sendNoteText}>Invia una nota al partner</Text>
          </TouchableOpacity>

          {/* Received Notes */}
          {receivedNotes.slice(0, 3).map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[
                styles.noteCard,
                !note.is_read && styles.noteCardUnread,
              ]}
              onPress={() => !note.is_read && markNoteAsRead(note.id)}
            >
              <View style={[styles.noteCategoryDot, { backgroundColor: getCategoryColor(note.category) }]} />
              <View style={styles.noteContent}>
                <Text style={styles.noteSender}>Da {note.sender_name}</Text>
                <Text style={styles.noteMessage}>{note.message}</Text>
                <Text style={styles.noteTime}>
                  {format(new Date(note.created_at), 'd MMM HH:mm', { locale: it })}
                </Text>
              </View>
              {!note.is_read && <View style={styles.newDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Mood Entry Modal */}
      <Modal visible={moodModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            activeOpacity={1} 
            onPress={() => Keyboard.dismiss()}
          >
            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Come stai oggi?</Text>
                  <TouchableOpacity onPress={() => setMoodModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                {renderMoodSlider('Umore', mood, setMood, MOOD_EMOJIS)}
                {renderMoodSlider('Energia', energy, setEnergy, ENERGY_EMOJIS)}
                {renderMoodSlider('Stress', stress, setStress, STRESS_EMOJIS)}
                {renderMoodSlider('Desiderio', libido, setLibido, LIBIDO_EMOJIS)}

                <Text style={styles.inputLabel}>Note (opzionale)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Come ti senti?"
                  placeholderTextColor="#888"
                  value={moodNotes}
                  onChangeText={setMoodNotes}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit={true}
                />

                <TouchableOpacity style={styles.saveButton} onPress={saveMood}>
                  <Text style={styles.saveButtonText}>Salva Mood</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Note Modal */}
      <Modal visible={noteModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            activeOpacity={1} 
            onPress={() => Keyboard.dismiss()}
          >
            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Nota d'Amore 💌</Text>
                  <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Categoria</Text>
                <View style={styles.categoryPicker}>
                  {['sweet', 'spicy', 'funny', 'romantic'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        noteCategory === cat && { backgroundColor: getCategoryColor(cat) },
                      ]}
                      onPress={() => setNoteCategory(cat)}
                    >
                      <Text style={styles.categoryText}>
                        {getCategoryEmoji(cat)} {cat === 'sweet' ? 'Dolce' : cat === 'spicy' ? 'Piccante' : cat === 'funny' ? 'Divertente' : 'Romantico'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Templates - now using local templates */}
                <Text style={styles.inputLabel}>Scegli un messaggio precompilato</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                  {NOTE_TEMPLATES[noteCategory]?.map((template: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.templateChip,
                        noteMessage === template && styles.templateChipActive
                      ]}
                      onPress={() => setNoteMessage(template)}
                    >
                      <Text style={[
                        styles.templateText,
                        noteMessage === template && styles.templateTextActive
                      ]}>{template}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Oppure scrivi il tuo messaggio</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Scrivi il tuo messaggio..."
                  placeholderTextColor="#888"
                  value={noteMessage}
                  onChangeText={setNoteMessage}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit={true}
                />

                <TouchableOpacity
                  style={[styles.saveButton, !noteMessage.trim() && styles.buttonDisabled]}
                  onPress={sendNote}
                  disabled={!noteMessage.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Invia</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  
  todayCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 20, marginBottom: 16 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  todayTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  editButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 107, 138, 0.2)', justifyContent: 'center', alignItems: 'center' },
  
  moodDisplay: { flexDirection: 'row', justifyContent: 'space-around' },
  moodItem: { alignItems: 'center' },
  moodEmoji: { fontSize: 36 },
  moodEmojiSmall: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  
  addMoodButton: { alignItems: 'center', paddingVertical: 20 },
  addMoodText: { fontSize: 14, color: '#888', marginTop: 8 },
  
  partnerCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 16 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  partnerTitle: { fontSize: 14, color: '#ff6b8a' },
  
  syncCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  syncTitle: { fontSize: 14, color: '#888', marginBottom: 8 },
  syncScore: { fontSize: 48, fontWeight: 'bold', color: '#ff6b8a' },
  syncBar: { width: '100%', height: 8, backgroundColor: '#3a3a5e', borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  syncFill: { height: '100%', backgroundColor: '#ff6b8a', borderRadius: 4 },
  syncLabel: { fontSize: 11, color: '#666', marginTop: 8 },
  
  notesSection: { marginTop: 8 },
  notesSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  notesSectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  unreadBadge: { backgroundColor: '#ff4757', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  sendNoteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 12, gap: 8, marginBottom: 16 },
  sendNoteText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  noteCard: { backgroundColor: '#2a2a4e', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' },
  noteCardUnread: { borderWidth: 1, borderColor: '#ff6b8a' },
  noteCategoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 6 },
  noteContent: { flex: 1 },
  noteSender: { fontSize: 12, color: '#ff6b8a', marginBottom: 4 },
  noteMessage: { fontSize: 14, color: '#fff' },
  noteTime: { fontSize: 11, color: '#666', marginTop: 8 },
  newDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4757' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalOverlayTouch: { flex: 1, justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  
  sliderContainer: { marginBottom: 20 },
  sliderLabel: { fontSize: 14, color: '#888', marginBottom: 12 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emojiButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3a3a5e' },
  emojiButtonActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.2)' },
  emoji: { fontSize: 28 },
  
  inputLabel: { fontSize: 14, color: '#888', marginBottom: 8, marginTop: 8 },
  notesInput: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#3a3a5e' },
  messageInput: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#3a3a5e' },
  
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#3a3a5e' },
  categoryText: { color: '#fff', fontSize: 12 },
  
  templatesScroll: { marginTop: 8, marginBottom: 8 },
  templateChip: { backgroundColor: '#1a1a2e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginRight: 8, maxWidth: 220, borderWidth: 1, borderColor: '#3a3a5e' },
  templateChipActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.15)' },
  templateText: { color: '#aaa', fontSize: 12 },
  templateTextActive: { color: '#ff6b8a' },
  
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 12, gap: 8, marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
