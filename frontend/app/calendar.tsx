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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../store/useStore';
import { cycleAPI, intimacyAPI, challengeAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const { width } = Dimensions.get('window');

// Configure Italian locale
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
  const [partnerHasCycle, setPartnerHasCycle] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load positions from suggestions
      const suggestions = await challengeAPI.getSuggestions();
      if (suggestions?.positions) {
        setPositions(suggestions.positions);
      }

      // Load cycle data
      const cycleData = await cycleAPI.get(user.id);
      if (cycleData && cycleData.last_period_date) {
        setLastPeriodDate(cycleData.last_period_date);
        setCycleLength(String(cycleData.cycle_length));
        setPeriodLength(String(cycleData.period_length));
        setCycleConfigured(true);
        if (user.gender === 'male') setPartnerHasCycle(true);
      } else {
        setCycleConfigured(false);
        setPartnerHasCycle(false);
      }
      
      const fertility = await cycleAPI.getFertility(user.id);
      setFertilityData(fertility);

      // Load intimacy entries
      if (user.couple_code) {
        const entries = await intimacyAPI.getAll(user.couple_code);
        setIntimacyEntries(entries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveCycleData = async () => {
    if (!lastPeriodDate || !user) {
      Alert.alert('Errore', 'Seleziona la data dell\'ultima mestruazione');
      return;
    }
    
    setIsLoading(true);
    try {
      await cycleAPI.save(user.id, lastPeriodDate, parseInt(cycleLength) || 28, parseInt(periodLength) || 5);
      const fertility = await cycleAPI.getFertility(user.id);
      setFertilityData(fertility);
      setCycleConfigured(true);
      setCycleModalVisible(false);
      Alert.alert('Salvato', 'Dati del ciclo aggiornati');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare i dati');
    } finally {
      setIsLoading(false);
    }
  };

  const logIntimacy = async () => {
    if (!selectedDate || !user?.couple_code) return;
    
    setIsLoading(true);
    try {
      await intimacyAPI.log(
        user.couple_code,
        selectedDate,
        qualityRating,
        user.id,
        selectedPositions,
        duration ? parseInt(duration) : undefined,
        selectedLocation || undefined,
        notes || undefined
      );
      await loadData();
      resetIntimacyForm();
      setIntimacyModalVisible(false);
      Alert.alert('Registrato!', 'Momento insieme salvato con successo');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile registrare');
    } finally {
      setIsLoading(false);
    }
  };

  const resetIntimacyForm = () => {
    setQualityRating(3);
    setSelectedPositions([]);
    setSelectedLocation(null);
    setDuration('');
    setNotes('');
  };

  const togglePosition = (positionId: string) => {
    setSelectedPositions(prev => 
      prev.includes(positionId) 
        ? prev.filter(p => p !== positionId)
        : [...prev, positionId]
    );
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Mark periods (red)
    if (fertilityData?.periods) {
      fertilityData.periods.forEach((date: string) => {
        marked[date] = { customStyles: { container: { backgroundColor: '#ff4757' }, text: { color: 'white' } } };
      });
    }

    // Mark ovulation days (orange)
    if (fertilityData?.ovulation_days) {
      fertilityData.ovulation_days.forEach((date: string) => {
        marked[date] = { customStyles: { container: { backgroundColor: '#ffa502' }, text: { color: 'white' } } };
      });
    }

    // Mark fertile days (green border)
    if (fertilityData?.fertile_days) {
      fertilityData.fertile_days.forEach((date: string) => {
        if (!marked[date]) {
          marked[date] = { customStyles: { container: { borderWidth: 2, borderColor: '#2ed573' }, text: { color: '#2ed573' } } };
        }
      });
    }

    // Mark intimacy entries (pink)
    if (intimacyEntries) {
      intimacyEntries.forEach((entry: any) => {
        if (marked[entry.date]) {
          marked[entry.date] = { ...marked[entry.date], marked: true, dotColor: '#ff6b8a' };
        } else {
          marked[entry.date] = { marked: true, dotColor: '#ff6b8a', customStyles: { container: { backgroundColor: 'rgba(255, 107, 138, 0.2)' }, text: { color: '#ff6b8a' } } };
        }
      });
    }

    if (selectedDate) {
      marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#ff6b8a' };
    }

    return marked;
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setIntimacyModalVisible(true);
  };

  const handleSelectPeriodDate = (day: any) => {
    setLastPeriodDate(day.dateString);
    setDatePickerVisible(false);
  };

  const getPositionById = (id: string) => positions.find(p => p.id === id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Calendario</Text>
        {user?.gender === 'female' ? (
          <TouchableOpacity onPress={() => setCycleModalVisible(true)}>
            <Ionicons name="options" size={28} color="#ff6b8a" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cycle Setup Banner */}
        {user?.gender === 'female' && !cycleConfigured && (
          <TouchableOpacity style={styles.setupBanner} onPress={() => setCycleModalVisible(true)}>
            <Ionicons name="calendar-outline" size={24} color="#ffa502" />
            <View style={styles.setupBannerContent}>
              <Text style={styles.setupBannerTitle}>Configura il tuo ciclo</Text>
              <Text style={styles.setupBannerText}>Inserisci i dati per vedere i giorni fertili</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ffa502" />
          </TouchableOpacity>
        )}

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
            <Ionicons name="heart" size={16} color="#ff6b8a" />
            <Text style={styles.legendText}>Insieme</Text>
          </View>
        </View>

        <Calendar
          markingType="custom"
          markedDates={getMarkedDates()}
          onDayPress={handleDayPress}
          theme={{
            calendarBackground: '#2a2a4e',
            textSectionTitleColor: '#888',
            selectedDayBackgroundColor: '#ff6b8a',
            selectedDayTextColor: '#fff',
            todayTextColor: '#ff6b8a',
            dayTextColor: '#fff',
            textDisabledColor: '#444',
            monthTextColor: '#fff',
            arrowColor: '#ff6b8a',
          }}
          style={styles.calendar}
        />

        {/* Cycle Info */}
        {cycleConfigured && lastPeriodDate && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {user?.gender === 'male' ? 'Ciclo della Partner' : 'Info Ciclo'}
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ultima mestruazione:</Text>
              <Text style={styles.infoValue}>{format(parseISO(lastPeriodDate), 'd MMMM yyyy', { locale: it })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durata ciclo:</Text>
              <Text style={styles.infoValue}>{cycleLength} giorni</Text>
            </View>
            {user?.gender === 'female' && (
              <TouchableOpacity style={styles.editButton} onPress={() => setCycleModalVisible(true)}>
                <Ionicons name="pencil" size={16} color="#ff6b8a" />
                <Text style={styles.editButtonText}>Modifica</Text>
              </TouchableOpacity>
            )}
            {user?.gender === 'male' && (
              <Text style={styles.syncText}>Sincronizzato automaticamente</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Cycle Settings Modal */}
      <Modal visible={cycleModalVisible} animationType="slide" transparent onRequestClose={() => setCycleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Impostazioni Ciclo</Text>
              <TouchableOpacity onPress={() => setCycleModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Data ultima mestruazione</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar" size={20} color="#ff6b8a" />
              <Text style={styles.datePickerText}>
                {lastPeriodDate ? format(parseISO(lastPeriodDate), 'd MMMM yyyy', { locale: it }) : 'Seleziona data'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Durata ciclo (giorni)</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity style={styles.numberButton} onPress={() => setCycleLength(String(Math.max(21, parseInt(cycleLength) - 1)))}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{cycleLength}</Text>
              <TouchableOpacity style={styles.numberButton} onPress={() => setCycleLength(String(Math.min(35, parseInt(cycleLength) + 1)))}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Durata mestruazioni (giorni)</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity style={styles.numberButton} onPress={() => setPeriodLength(String(Math.max(3, parseInt(periodLength) - 1)))}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{periodLength}</Text>
              <TouchableOpacity style={styles.numberButton} onPress={() => setPeriodLength(String(Math.min(7, parseInt(periodLength) + 1)))}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveButton, (!lastPeriodDate || isLoading) && styles.saveButtonDisabled]} onPress={saveCycleData} disabled={!lastPeriodDate || isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salva</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={datePickerVisible} animationType="slide" transparent onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Data</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleSelectPeriodDate}
              markedDates={lastPeriodDate ? { [lastPeriodDate]: { selected: true, selectedColor: '#ff6b8a' } } : {}}
              maxDate={format(new Date(), 'yyyy-MM-dd')}
              theme={{ calendarBackground: '#2a2a4e', selectedDayBackgroundColor: '#ff6b8a', selectedDayTextColor: '#fff', todayTextColor: '#ff6b8a', dayTextColor: '#fff', textDisabledColor: '#444', monthTextColor: '#fff', arrowColor: '#ff6b8a' }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>

      {/* Log Intimacy Modal - ENHANCED */}
      <Modal visible={intimacyModalVisible} animationType="slide" transparent onRequestClose={() => setIntimacyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.intimacyModalScroll}>
            <View style={styles.intimacyModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registra Momento</Text>
                <TouchableOpacity onPress={() => { setIntimacyModalVisible(false); resetIntimacyForm(); }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.selectedDateText}>
                {selectedDate && format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
              </Text>

              {/* Quality Rating */}
              <Text style={styles.inputLabel}>Come è stato? (1-5)</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity key={num} style={[styles.ratingButton, qualityRating === num && styles.ratingButtonActive]} onPress={() => setQualityRating(num)}>
                    <Ionicons name={qualityRating >= num ? 'heart' : 'heart-outline'} size={28} color={qualityRating >= num ? '#ff6b8a' : '#888'} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Positions Selection */}
              <Text style={styles.inputLabel}>Posizioni provate</Text>
              <TouchableOpacity style={styles.positionsButton} onPress={() => setPositionsModalVisible(true)}>
                <Ionicons name="body" size={20} color="#ff6b8a" />
                <Text style={styles.positionsButtonText}>
                  {selectedPositions.length > 0 
                    ? `${selectedPositions.length} posizioni selezionate`
                    : 'Seleziona posizioni'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>

              {/* Selected positions preview */}
              {selectedPositions.length > 0 && (
                <View style={styles.selectedPositionsPreview}>
                  {selectedPositions.map(posId => {
                    const pos = getPositionById(posId);
                    return pos ? (
                      <View key={posId} style={styles.selectedPositionChip}>
                        <Text style={styles.selectedPositionEmoji}>{pos.emoji}</Text>
                        <Text style={styles.selectedPositionName}>{pos.name}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              )}

              {/* Location */}
              <Text style={styles.inputLabel}>Dove?</Text>
              <View style={styles.locationsGrid}>
                {LOCATIONS.map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.locationButton, selectedLocation === loc.id && styles.locationButtonActive]}
                    onPress={() => setSelectedLocation(selectedLocation === loc.id ? null : loc.id)}
                  >
                    <Ionicons name={loc.icon as any} size={20} color={selectedLocation === loc.id ? '#fff' : '#888'} />
                    <Text style={[styles.locationText, selectedLocation === loc.id && styles.locationTextActive]}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={styles.inputLabel}>Durata (minuti)</Text>
              <TextInput
                style={styles.input}
                placeholder="es. 30"
                placeholderTextColor="#888"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />

              {/* Notes */}
              <Text style={styles.inputLabel}>Note (opzionale)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Qualcosa di speciale?"
                placeholderTextColor="#888"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity style={styles.saveButton} onPress={logIntimacy} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Registra</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Positions Selection Modal */}
      <Modal visible={positionsModalVisible} animationType="slide" transparent onRequestClose={() => setPositionsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.positionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Posizioni</Text>
              <TouchableOpacity onPress={() => setPositionsModalVisible(false)}>
                <Ionicons name="checkmark" size={28} color="#2ed573" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.positionsList}>
              {positions.map((position) => (
                <TouchableOpacity
                  key={position.id}
                  style={[styles.positionCard, selectedPositions.includes(position.id) && styles.positionCardSelected]}
                  onPress={() => togglePosition(position.id)}
                >
                  <View style={styles.positionHeader}>
                    <Text style={styles.positionEmoji}>{position.emoji}</Text>
                    <View style={styles.positionInfo}>
                      <Text style={styles.positionName}>{position.name}</Text>
                      <Text style={styles.positionDifficulty}>{position.difficulty}</Text>
                    </View>
                    {selectedPositions.includes(position.id) && (
                      <Ionicons name="checkmark-circle" size={24} color="#2ed573" />
                    )}
                  </View>
                  <Text style={styles.positionDescription}>{position.description}</Text>
                  
                  {/* Pleasure meters */}
                  <View style={styles.pleasureMeters}>
                    <View style={styles.pleasureMeter}>
                      <Text style={styles.pleasureLabel}>Lei</Text>
                      <View style={styles.pleasureBar}>
                        <View style={[styles.pleasureFill, { width: `${(position.pleasure_her / 5) * 100}%` }]} />
                      </View>
                    </View>
                    <View style={styles.pleasureMeter}>
                      <Text style={styles.pleasureLabel}>Lui</Text>
                      <View style={styles.pleasureBar}>
                        <View style={[styles.pleasureFill, styles.pleasureFillHim, { width: `${(position.pleasure_him / 5) * 100}%` }]} />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.positionTips}>💡 {position.tips}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  setupBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 165, 2, 0.15)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 165, 2, 0.3)' },
  setupBannerContent: { flex: 1, marginHorizontal: 12 },
  setupBannerTitle: { fontSize: 16, fontWeight: '600', color: '#ffa502' },
  setupBannerText: { fontSize: 12, color: '#888', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 16, height: 16, borderRadius: 8 },
  legendText: { color: '#888', fontSize: 12 },
  calendar: { borderRadius: 16, overflow: 'hidden' },
  infoCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginTop: 20 },
  infoTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#3a3a5e', gap: 6 },
  editButtonText: { color: '#ff6b8a', fontSize: 14 },
  syncText: { color: '#2ed573', fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  intimacyModalScroll: { maxHeight: '90%' },
  intimacyModalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  datePickerModal: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  positionsModal: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  selectedDateText: { fontSize: 18, color: '#ff6b8a', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  inputLabel: { color: '#888', fontSize: 14, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 8, borderWidth: 1, borderColor: '#3a3a5e' },
  notesInput: { height: 80, textAlignVertical: 'top' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e', gap: 12 },
  datePickerText: { color: '#fff', fontSize: 16 },
  numberInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e' },
  numberButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff6b8a', justifyContent: 'center', alignItems: 'center' },
  numberValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginHorizontal: 32 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  ratingButton: { padding: 8 },
  ratingButtonActive: { transform: [{ scale: 1.2 }] },
  positionsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#3a3a5e', gap: 12 },
  positionsButtonText: { flex: 1, color: '#fff', fontSize: 16 },
  selectedPositionsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  selectedPositionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 107, 138, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  selectedPositionEmoji: { fontSize: 16 },
  selectedPositionName: { color: '#ff6b8a', fontSize: 12 },
  locationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#3a3a5e' },
  locationButtonActive: { backgroundColor: '#ff6b8a', borderColor: '#ff6b8a' },
  locationText: { color: '#888', fontSize: 12 },
  locationTextActive: { color: '#fff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', paddingVertical: 16, borderRadius: 12, gap: 8, marginTop: 20 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  positionsList: { maxHeight: 500 },
  positionCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#3a3a5e' },
  positionCardSelected: { borderColor: '#ff6b8a', backgroundColor: 'rgba(255, 107, 138, 0.1)' },
  positionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  positionEmoji: { fontSize: 32, marginRight: 12 },
  positionInfo: { flex: 1 },
  positionName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  positionDifficulty: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  positionDescription: { color: '#aaa', fontSize: 13, marginBottom: 12 },
  pleasureMeters: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  pleasureMeter: { flex: 1 },
  pleasureLabel: { color: '#888', fontSize: 11, marginBottom: 4 },
  pleasureBar: { height: 6, backgroundColor: '#3a3a5e', borderRadius: 3, overflow: 'hidden' },
  pleasureFill: { height: '100%', backgroundColor: '#ff6b8a', borderRadius: 3 },
  pleasureFillHim: { backgroundColor: '#70a1ff' },
  positionTips: { color: '#ffa502', fontSize: 12, fontStyle: 'italic' },
});
