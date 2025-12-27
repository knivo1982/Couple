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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../../store/useStore';
import { cycleAPI, intimacyAPI, challengeAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Componente cuore per sfondo
const HeartShape = ({ size = 40, color = '#ff6b8a' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
    />
  </Svg>
);

LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
};
LocaleConfig.defaultLocale = 'it';

const LOCATIONS = [
  { id: 'bedroom', name: 'Camera', icon: 'bed' },
  { id: 'shower', name: 'Doccia', icon: 'water' },
  { id: 'couch', name: 'Divano', icon: 'tv' },
  { id: 'kitchen', name: 'Cucina', icon: 'restaurant' },
  { id: 'car', name: 'Auto', icon: 'car' },
  { id: 'outdoor', name: 'All\'aperto', icon: 'leaf' },
  { id: 'hotel', name: 'Hotel', icon: 'business' },
  { id: 'other', name: 'Altro', icon: 'ellipsis-horizontal' },
];

export default function CalendarScreen() {
  const { user, fertilityData, setFertilityData, intimacyEntries, setIntimacyEntries } = useStore();
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [intimacyModalVisible, setIntimacyModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [positionsModalVisible, setPositionsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [qualityRating, setQualityRating] = useState(3);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cycleConfigured, setCycleConfigured] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create sets for faster lookup
  const intimacyDates = new Set(intimacyEntries?.map((e: any) => e.date) || []);
  const periodDates = new Set(fertilityData?.periods || []);
  const ovulationDates = new Set(fertilityData?.ovulation_days || []);
  const fertileDates = new Set(fertilityData?.fertile_days || []);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const suggestions = await challengeAPI.getSuggestions();
      if (suggestions?.positions) {
        setPositions(suggestions.positions);
      }

      const cycleData = await cycleAPI.get(user.id);
      if (cycleData && cycleData.last_period_date) {
        setLastPeriodDate(cycleData.last_period_date);
        setCycleLength(String(cycleData.cycle_length));
        setPeriodLength(String(cycleData.period_length));
        setCycleConfigured(true);
      }
      
      const fertility = await cycleAPI.getFertility(user.id);
      setFertilityData(fertility);

      if (user.couple_code) {
        const entries = await intimacyAPI.getAll(user.couple_code);
        setIntimacyEntries(entries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveCycleData = async () => {
    if (!lastPeriodDate || !user) return;
    
    setIsLoading(true);
    try {
      await cycleAPI.save(user.id, lastPeriodDate, parseInt(cycleLength) || 28, parseInt(periodLength) || 5);
      const fertility = await cycleAPI.getFertility(user.id);
      setFertilityData(fertility);
      setCycleConfigured(true);
      setCycleModalVisible(false);
      Alert.alert('Salvato!', 'Dati del ciclo aggiornati');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare');
    } finally {
      setIsLoading(false);
    }
  };

  const logIntimacy = async () => {
    if (!selectedDate || !user?.couple_code) return;
    
    setIsLoading(true);
    try {
      await intimacyAPI.log(user.couple_code, selectedDate, qualityRating, user.id, selectedPositions, duration ? parseInt(duration) : undefined, selectedLocation || undefined, notes || undefined);
      await loadData();
      resetForm();
      setIntimacyModalVisible(false);
      Alert.alert('Registrato! 💕', 'Momento salvato');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQualityRating(3);
    setSelectedPositions([]);
    setSelectedLocation(null);
    setDuration('');
    setNotes('');
  };

  const togglePosition = (id: string) => {
    setSelectedPositions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getDifficultyColor = (d: string) => d === 'facile' ? '#2ed573' : d === 'medio' ? '#ffa502' : '#ff4757';

  // Custom day component with heart shape background for intimacy
  const renderDay = (date: any, state: any) => {
    const dateString = date.dateString;
    const isToday = dateString === format(new Date(), 'yyyy-MM-dd');
    const isSelected = dateString === selectedDate;
    const hasIntimacy = intimacyDates.has(dateString);
    const isPeriod = periodDates.has(dateString);
    const isOvulation = ovulationDates.has(dateString);
    const isFertile = fertileDates.has(dateString);
    
    let bgColor = 'transparent';
    let textColor = state === 'disabled' ? '#444' : '#fff';
    let borderColor = 'transparent';
    let showHeart = false;
    
    if (hasIntimacy) {
      showHeart = true;
      textColor = '#fff';
    } else if (isPeriod) {
      bgColor = '#ff4757';
      textColor = '#fff';
    } else if (isOvulation) {
      bgColor = '#ffa502';
      textColor = '#fff';
    } else if (isFertile) {
      borderColor = '#2ed573';
      textColor = '#2ed573';
    }
    
    if (isToday && !hasIntimacy && !isPeriod && !isOvulation) {
      textColor = '#ff6b8a';
    }
    
    if (isSelected && !hasIntimacy) {
      bgColor = '#ff6b8a';
      textColor = '#fff';
      borderColor = 'transparent';
    }

    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          !showHeart && { backgroundColor: bgColor, borderColor: borderColor, borderWidth: borderColor !== 'transparent' ? 2 : 0 }
        ]}
        onPress={() => {
          setSelectedDate(dateString);
          setIntimacyModalVisible(true);
        }}
      >
        {showHeart && <HeartShape size={42} color={isSelected ? '#ff4757' : '#ff6b8a'} />}
        <Text style={[styles.dayText, { color: textColor, zIndex: 1 }]}>{date.day}</Text>
      </TouchableOpacity>
    );
  };

  // Get existing entry for selected date
  const getEntryForDate = (dateStr: string) => {
    return intimacyEntries?.find((e: any) => e.date === dateStr);
  };

  // Delete intimacy entry
  const deleteIntimacy = async (entryId: string) => {
    Alert.alert(
      'Elimina evento',
      'Sei sicuro di voler eliminare questo momento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await intimacyAPI.delete(entryId);
              await loadData();
              setIntimacyModalVisible(false);
              Alert.alert('Eliminato', 'Evento rimosso');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendario</Text>
        {user?.gender === 'female' && (
          <TouchableOpacity style={styles.configButton} onPress={() => setCycleModalVisible(true)}>
            <Ionicons name="options" size={22} color="#ff6b8a" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff4757' }]} />
            <Text style={styles.legendText}>Ciclo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ffa502' }]} />
            <Text style={styles.legendText}>Ovulazione</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderWidth: 2, borderColor: '#2ed573' }]} />
            <Text style={styles.legendText}>Fertile</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={{ fontSize: 14 }}>❤️</Text>
            <Text style={styles.legendText}>Intimità</Text>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            dayComponent={({ date, state }: any) => renderDay(date, state)}
            onMonthChange={(month: any) => setCurrentMonth(new Date(month.dateString))}
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: '#888',
              monthTextColor: '#fff',
              arrowColor: '#ff6b8a',
              textMonthFontWeight: 'bold',
              textMonthFontSize: 18,
            }}
            style={styles.calendar}
          />
        </View>

        {user?.gender === 'female' && !cycleConfigured && (
          <TouchableOpacity style={styles.setupBanner} onPress={() => setCycleModalVisible(true)}>
            <View style={styles.setupIcon}>
              <Ionicons name="calendar-outline" size={28} color="#ffa502" />
            </View>
            <View style={styles.setupContent}>
              <Text style={styles.setupTitle}>Configura il tuo ciclo</Text>
              <Text style={styles.setupText}>Inserisci i dati per vedere i giorni fertili</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ffa502" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cycle Modal */}
      <Modal visible={cycleModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Impostazioni Ciclo</Text>
              <TouchableOpacity onPress={() => setCycleModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Data ultima mestruazione</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar" size={20} color="#ff6b8a" />
              <Text style={styles.dateBtnText}>
                {lastPeriodDate ? format(parseISO(lastPeriodDate), 'd MMMM yyyy', { locale: it }) : 'Seleziona data'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Durata ciclo (giorni)</Text>
            <View style={styles.numberRow}>
              <TouchableOpacity style={styles.numBtn} onPress={() => setCycleLength(String(Math.max(21, parseInt(cycleLength) - 1)))}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numValue}>{cycleLength}</Text>
              <TouchableOpacity style={styles.numBtn} onPress={() => setCycleLength(String(Math.min(35, parseInt(cycleLength) + 1)))}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Durata mestruazioni (giorni)</Text>
            <View style={styles.numberRow}>
              <TouchableOpacity style={styles.numBtn} onPress={() => setPeriodLength(String(Math.max(3, parseInt(periodLength) - 1)))}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numValue}>{periodLength}</Text>
              <TouchableOpacity style={styles.numBtn} onPress={() => setPeriodLength(String(Math.min(7, parseInt(periodLength) + 1)))}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveBtn, !lastPeriodDate && styles.saveBtnDisabled]} onPress={saveCycleData} disabled={!lastPeriodDate || isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salva</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={datePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Data</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => { setLastPeriodDate(day.dateString); setDatePickerVisible(false); }}
              markedDates={lastPeriodDate ? { [lastPeriodDate]: { selected: true, selectedColor: '#ff6b8a' } } : {}}
              maxDate={format(new Date(), 'yyyy-MM-dd')}
              theme={{ calendarBackground: '#2a2a4e', selectedDayBackgroundColor: '#ff6b8a', selectedDayTextColor: '#fff', todayTextColor: '#ff6b8a', dayTextColor: '#fff', textDisabledColor: '#444', monthTextColor: '#fff', arrowColor: '#ff6b8a' }}
            />
          </View>
        </View>
      </Modal>

      {/* Intimacy Modal */}
      <Modal visible={intimacyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.intimacyScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registra Momento 💕</Text>
                <TouchableOpacity onPress={() => { setIntimacyModalVisible(false); resetForm(); }} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateBadge}>
                <Ionicons name="calendar" size={18} color="#ff6b8a" />
                <Text style={styles.dateBadgeText}>
                  {selectedDate && format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
                </Text>
              </View>

              <Text style={styles.label}>Come è stato?</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setQualityRating(n)}>
                    <Ionicons name={qualityRating >= n ? 'heart' : 'heart-outline'} size={36} color={qualityRating >= n ? '#ff6b8a' : '#555'} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingLabel}>
                {qualityRating === 1 ? 'Così così' : qualityRating === 2 ? 'Ok' : qualityRating === 3 ? 'Bello' : qualityRating === 4 ? 'Fantastico' : 'Esplosivo! 🔥'}
              </Text>

              <View style={styles.sectionRow}>
                <Text style={styles.label}>Posizioni</Text>
                <TouchableOpacity onPress={() => setPositionsModalVisible(true)}>
                  <Text style={styles.seeAll}>Vedi tutte →</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {positions.slice(0, 8).map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.posChip, selectedPositions.includes(p.id) && styles.posChipActive]} onPress={() => togglePosition(p.id)}>
                    <Text style={styles.posEmoji}>{p.emoji}</Text>
                    <Text style={[styles.posName, selectedPositions.includes(p.id) && styles.posNameActive]}>{p.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Dove?</Text>
              <View style={styles.locGrid}>
                {LOCATIONS.map(l => (
                  <TouchableOpacity key={l.id} style={[styles.locBtn, selectedLocation === l.id && styles.locBtnActive]} onPress={() => setSelectedLocation(selectedLocation === l.id ? null : l.id)}>
                    <Ionicons name={l.icon as any} size={18} color={selectedLocation === l.id ? '#fff' : '#888'} />
                    <Text style={[styles.locText, selectedLocation === l.id && styles.locTextActive]}>{l.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Durata (minuti)</Text>
              <TextInput style={styles.input} placeholder="Es: 30" placeholderTextColor="#666" value={duration} onChangeText={setDuration} keyboardType="numeric" />

              <Text style={styles.label}>Note</Text>
              <TextInput style={[styles.input, { height: 80 }]} placeholder="Qualcosa di speciale?" placeholderTextColor="#666" value={notes} onChangeText={setNotes} multiline />

              <TouchableOpacity style={styles.saveBtn} onPress={logIntimacy} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="heart" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Registra</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Positions Modal */}
      <Modal visible={positionsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔥 Posizioni</Text>
              <TouchableOpacity onPress={() => setPositionsModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 450 }}>
              {positions.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.posCard, selectedPositions.includes(p.id) && styles.posCardActive]} onPress={() => togglePosition(p.id)}>
                  <View style={styles.posCardRow}>
                    <Text style={styles.posCardEmoji}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.posCardName}>{p.name}</Text>
                      <View style={styles.posCardMeta}>
                        <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(p.difficulty) + '30' }]}>
                          <Text style={[styles.diffText, { color: getDifficultyColor(p.difficulty) }]}>{p.difficulty}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedPositions.includes(p.id) && (
                      <View style={styles.checkMark}><Ionicons name="checkmark" size={18} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={styles.posCardDesc} numberOfLines={2}>{p.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setPositionsModalVisible(false)}>
              <Text style={styles.saveBtnText}>{selectedPositions.length > 0 ? `Fatto (${selectedPositions.length})` : 'Chiudi'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  configButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { color: '#888', fontSize: 12 },
  
  calendarContainer: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 12, marginBottom: 16 },
  calendar: { borderRadius: 16 },
  
  dayContainer: { width: 40, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', margin: 2 },
  dayText: { fontSize: 16, fontWeight: '500' },
  heartIcon: { fontSize: 12, position: 'absolute', bottom: 2 },
  
  setupBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 165, 2, 0.3)' },
  setupIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255, 165, 2, 0.15)', justifyContent: 'center', alignItems: 'center' },
  setupContent: { flex: 1, marginHorizontal: 14 },
  setupTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  setupText: { fontSize: 12, color: '#888', marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e1e38', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  
  intimacyScroll: { maxHeight: '92%' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255, 107, 138, 0.15)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 20 },
  dateBadgeText: { fontSize: 16, color: '#ff6b8a', fontWeight: '600' },
  
  label: { color: '#aaa', fontSize: 14, marginBottom: 10, marginTop: 16, fontWeight: '500' },
  input: { backgroundColor: '#2a2a4e', borderRadius: 14, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#3a3a5e' },
  
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#3a3a5e' },
  dateBtnText: { color: '#fff', fontSize: 16 },
  
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a4e', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: '#3a3a5e' },
  numBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ff6b8a', justifyContent: 'center', alignItems: 'center' },
  numValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginHorizontal: 40 },
  
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  ratingLabel: { textAlign: 'center', color: '#ff6b8a', fontSize: 14, marginTop: 8, fontWeight: '500' },
  
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  seeAll: { color: '#ff6b8a', fontSize: 13 },
  
  posChip: { alignItems: 'center', backgroundColor: '#2a2a4e', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, marginRight: 8, borderWidth: 2, borderColor: '#3a3a5e', minWidth: 80 },
  posChipActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.2)' },
  posEmoji: { fontSize: 24, marginBottom: 4 },
  posName: { fontSize: 11, color: '#888', textAlign: 'center' },
  posNameActive: { color: '#ff6b8a' },
  
  locGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#3a3a5e' },
  locBtnActive: { backgroundColor: '#ff6b8a', borderColor: '#ff6b8a' },
  locText: { color: '#888', fontSize: 13 },
  locTextActive: { color: '#fff' },
  
  posCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#3a3a5e' },
  posCardActive: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.1)' },
  posCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  posCardEmoji: { fontSize: 36 },
  posCardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  posCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  checkMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ff6b8a', justifyContent: 'center', alignItems: 'center' },
  posCardDesc: { color: '#aaa', fontSize: 13 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', paddingVertical: 16, borderRadius: 16, gap: 8, marginTop: 20 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
