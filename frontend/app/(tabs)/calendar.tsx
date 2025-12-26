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
  const [positions, setPositions] = useState<any[]>([]);

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
      } else {
        setCycleConfigured(false);
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
      Alert.alert('Registrato!', 'Momento insieme salvato con successo 💕');
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

    if (fertilityData?.periods) {
      fertilityData.periods.forEach((date: string) => {
        marked[date] = { customStyles: { container: { backgroundColor: '#ff4757' }, text: { color: 'white' } } };
      });
    }

    if (fertilityData?.ovulation_days) {
      fertilityData.ovulation_days.forEach((date: string) => {
        marked[date] = { customStyles: { container: { backgroundColor: '#ffa502' }, text: { color: 'white' } } };
      });
    }

    if (fertilityData?.fertile_days) {
      fertilityData.fertile_days.forEach((date: string) => {
        if (!marked[date]) {
          marked[date] = { customStyles: { container: { borderWidth: 2, borderColor: '#2ed573' }, text: { color: '#2ed573' } } };
        }
      });
    }

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
            <View style={[styles.legendDot, { backgroundColor: '#ff6b8a' }]} />
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
      </ScrollView>

      {/* Cycle Settings Modal */}
      <Modal visible={cycleModalVisible} animationType="slide" transparent>
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
      <Modal visible={datePickerVisible} animationType="slide" transparent>
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

      {/* Log Intimacy Modal */}
      <Modal visible={intimacyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.intimacyModalScroll}>
            <View style={styles.intimacyModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registra Momento 💕</Text>
                <TouchableOpacity onPress={() => { setIntimacyModalVisible(false); resetIntimacyForm(); }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.selectedDateText}>
                {selectedDate && format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
              </Text>

              <Text style={styles.inputLabel}>Come è stato?</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity key={num} style={[styles.ratingButton, qualityRating === num && styles.ratingButtonActive]} onPress={() => setQualityRating(num)}>
                    <Ionicons name={qualityRating >= num ? 'heart' : 'heart-outline'} size={32} color={qualityRating >= num ? '#ff6b8a' : '#666'} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Dove?</Text>
              <View style={styles.locationsGrid}>
                {LOCATIONS.map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.locationButton, selectedLocation === loc.id && styles.locationButtonActive]}
                    onPress={() => setSelectedLocation(selectedLocation === loc.id ? null : loc.id)}
                  >
                    <Ionicons name={loc.icon as any} size={18} color={selectedLocation === loc.id ? '#fff' : '#888'} />
                    <Text style={[styles.locationText, selectedLocation === loc.id && styles.locationTextActive]}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  configButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendText: { color: '#888', fontSize: 12 },
  calendar: { borderRadius: 16, overflow: 'hidden' },
  setupBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 165, 2, 0.15)', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255, 165, 2, 0.3)' },
  setupBannerContent: { flex: 1, marginHorizontal: 12 },
  setupBannerTitle: { fontSize: 15, fontWeight: '600', color: '#ffa502' },
  setupBannerText: { fontSize: 12, color: '#888', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  intimacyModalScroll: { maxHeight: '90%' },
  intimacyModalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  datePickerModal: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  selectedDateText: { fontSize: 18, color: '#ff6b8a', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  inputLabel: { color: '#888', fontSize: 14, marginBottom: 10, marginTop: 12 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 8, borderWidth: 1, borderColor: '#3a3a5e' },
  notesInput: { height: 80, textAlignVertical: 'top' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e', gap: 12 },
  datePickerText: { color: '#fff', fontSize: 16 },
  numberInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a5e' },
  numberButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff6b8a', justifyContent: 'center', alignItems: 'center' },
  numberValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginHorizontal: 32 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  ratingButton: { padding: 8 },
  ratingButtonActive: { transform: [{ scale: 1.15 }] },
  locationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#3a3a5e' },
  locationButtonActive: { backgroundColor: '#ff6b8a', borderColor: '#ff6b8a' },
  locationText: { color: '#888', fontSize: 13 },
  locationTextActive: { color: '#fff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', paddingVertical: 16, borderRadius: 14, gap: 8, marginTop: 20 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
