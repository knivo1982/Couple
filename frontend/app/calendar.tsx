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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../store/useStore';
import { cycleAPI, intimacyAPI } from '../services/api';
import { format, addDays } from 'date-fns';

// Configure Italian locale
LocaleConfig.locales['it'] = {
  monthNames: [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ],
  monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
};
LocaleConfig.defaultLocale = 'it';

export default function CalendarScreen() {
  const { user, fertilityData, setFertilityData, intimacyEntries, setIntimacyEntries } = useStore();
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [intimacyModalVisible, setIntimacyModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [qualityRating, setQualityRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load cycle data for females
      if (user.gender === 'female') {
        const cycleData = await cycleAPI.get(user.id);
        if (cycleData) {
          setLastPeriodDate(cycleData.last_period_date);
          setCycleLength(String(cycleData.cycle_length));
          setPeriodLength(String(cycleData.period_length));
        }
        const fertility = await cycleAPI.getFertility(user.id);
        setFertilityData(fertility);
      }

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
    if (!lastPeriodDate || !user) return;
    
    setIsLoading(true);
    try {
      await cycleAPI.save(
        user.id,
        lastPeriodDate,
        parseInt(cycleLength) || 28,
        parseInt(periodLength) || 5
      );
      const fertility = await cycleAPI.getFertility(user.id);
      setFertilityData(fertility);
      setCycleModalVisible(false);
      Alert.alert('Salvato', 'Dati del ciclo aggiornati');
    } catch (error) {
      console.error('Error saving cycle:', error);
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
        notes || undefined
      );
      await loadData();
      setIntimacyModalVisible(false);
      setNotes('');
      setQualityRating(3);
      Alert.alert('Registrato', 'Momento insieme salvato');
    } catch (error) {
      console.error('Error logging intimacy:', error);
      Alert.alert('Errore', 'Impossibile registrare');
    } finally {
      setIsLoading(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Mark periods (red)
    fertilityData.periods.forEach((date) => {
      marked[date] = {
        ...marked[date],
        customStyles: {
          container: { backgroundColor: '#ff4757' },
          text: { color: 'white' },
        },
      };
    });

    // Mark ovulation days (orange)
    fertilityData.ovulation_days.forEach((date) => {
      marked[date] = {
        customStyles: {
          container: { backgroundColor: '#ffa502' },
          text: { color: 'white' },
        },
      };
    });

    // Mark fertile days (green border)
    fertilityData.fertile_days.forEach((date) => {
      if (!marked[date]) {
        marked[date] = {
          customStyles: {
            container: { borderWidth: 2, borderColor: '#2ed573' },
            text: { color: '#2ed573' },
          },
        };
      }
    });

    // Mark intimacy entries (pink heart)
    intimacyEntries.forEach((entry) => {
      if (marked[entry.date]) {
        marked[entry.date] = {
          ...marked[entry.date],
          marked: true,
          dotColor: '#ff6b8a',
        };
      } else {
        marked[entry.date] = {
          marked: true,
          dotColor: '#ff6b8a',
          customStyles: {
            container: { backgroundColor: 'rgba(255, 107, 138, 0.2)' },
            text: { color: '#ff6b8a' },
          },
        };
      }
    });

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#ff6b8a',
      };
    }

    return marked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Calendario</Text>
        {user?.gender === 'female' && (
          <TouchableOpacity onPress={() => setCycleModalVisible(true)}>
            <Ionicons name="options" size={28} color="#ff6b8a" />
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
            <Ionicons name="heart" size={16} color="#ff6b8a" />
            <Text style={styles.legendText}>Insieme</Text>
          </View>
        </View>

        <Calendar
          markingType="custom"
          markedDates={getMarkedDates()}
          onDayPress={(day: any) => {
            setSelectedDate(day.dateString);
            setIntimacyModalVisible(true);
          }}
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

        {/* Quick Info */}
        {user?.gender === 'female' && lastPeriodDate && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Info Ciclo</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ultima mestruazione:</Text>
              <Text style={styles.infoValue}>{lastPeriodDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durata ciclo:</Text>
              <Text style={styles.infoValue}>{cycleLength} giorni</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durata mestruazioni:</Text>
              <Text style={styles.infoValue}>{periodLength} giorni</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cycle Settings Modal */}
      <Modal
        visible={cycleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCycleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Impostazioni Ciclo</Text>
              <TouchableOpacity onPress={() => setCycleModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Data ultima mestruazione</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#888"
              value={lastPeriodDate}
              onChangeText={setLastPeriodDate}
            />

            <Text style={styles.inputLabel}>Durata ciclo (giorni)</Text>
            <TextInput
              style={styles.input}
              placeholder="28"
              placeholderTextColor="#888"
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Durata mestruazioni (giorni)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor="#888"
              value={periodLength}
              onChangeText={setPeriodLength}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveCycleData}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Intimacy Modal */}
      <Modal
        visible={intimacyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIntimacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registra Momento</Text>
              <TouchableOpacity onPress={() => setIntimacyModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectedDateText}>{selectedDate}</Text>

            <Text style={styles.inputLabel}>Qualità (1-5)</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.ratingButton,
                    qualityRating === num && styles.ratingButtonActive,
                  ]}
                  onPress={() => setQualityRating(num)}
                >
                  <Ionicons
                    name={qualityRating >= num ? 'heart' : 'heart-outline'}
                    size={24}
                    color={qualityRating >= num ? '#ff6b8a' : '#888'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Note (opzionale)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Aggiungi una nota..."
              placeholderTextColor="#888"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={logIntimacy}
              disabled={isLoading}
            >
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    color: '#888',
    fontSize: 12,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#ff6b8a',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ratingButton: {
    padding: 8,
  },
  ratingButtonActive: {
    transform: [{ scale: 1.2 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
