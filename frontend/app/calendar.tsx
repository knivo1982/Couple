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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../store/useStore';
import { cycleAPI, intimacyAPI } from '../services/api';
import { format, addDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

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
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [qualityRating, setQualityRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cycleConfigured, setCycleConfigured] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load cycle data for females
      if (user.gender === 'female') {
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
    if (!lastPeriodDate || !user) {
      Alert.alert('Errore', 'Seleziona la data dell\'ultima mestruazione');
      return;
    }
    
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
      setCycleConfigured(true);
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
    if (fertilityData?.periods) {
      fertilityData.periods.forEach((date) => {
        marked[date] = {
          ...marked[date],
          customStyles: {
            container: { backgroundColor: '#ff4757' },
            text: { color: 'white' },
          },
        };
      });
    }

    // Mark ovulation days (orange)
    if (fertilityData?.ovulation_days) {
      fertilityData.ovulation_days.forEach((date) => {
        marked[date] = {
          customStyles: {
            container: { backgroundColor: '#ffa502' },
            text: { color: 'white' },
          },
        };
      });
    }

    // Mark fertile days (green border)
    if (fertilityData?.fertile_days) {
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
    }

    // Mark intimacy entries (pink heart)
    if (intimacyEntries) {
      intimacyEntries.forEach((entry: any) => {
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
    }

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

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setIntimacyModalVisible(true);
  };

  const handleSelectPeriodDate = (day: any) => {
    setLastPeriodDate(day.dateString);
    setDatePickerVisible(false);
  };

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
        {/* Cycle Setup Banner for Women */}
        {user?.gender === 'female' && !cycleConfigured && (
          <TouchableOpacity 
            style={styles.setupBanner}
            onPress={() => setCycleModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#ffa502" />
            <View style={styles.setupBannerContent}>
              <Text style={styles.setupBannerTitle}>Configura il tuo ciclo</Text>
              <Text style={styles.setupBannerText}>
                Inserisci i dati per vedere i giorni fertili
              </Text>
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

        {/* Quick Info */}
        {user?.gender === 'female' && cycleConfigured && lastPeriodDate && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Info Ciclo</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ultima mestruazione:</Text>
              <Text style={styles.infoValue}>
                {format(parseISO(lastPeriodDate), 'd MMMM yyyy', { locale: it })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durata ciclo:</Text>
              <Text style={styles.infoValue}>{cycleLength} giorni</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durata mestruazioni:</Text>
              <Text style={styles.infoValue}>{periodLength} giorni</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setCycleModalVisible(true)}
            >
              <Ionicons name="pencil" size={16} color="#ff6b8a" />
              <Text style={styles.editButtonText}>Modifica</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tip for men */}
        {user?.gender === 'male' && (
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={24} color="#70a1ff" />
            <Text style={styles.tipText}>
              Tocca un giorno per registrare un momento insieme con la tua partner
            </Text>
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
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setDatePickerVisible(true)}
            >
              <Ionicons name="calendar" size={20} color="#ff6b8a" />
              <Text style={styles.datePickerText}>
                {lastPeriodDate 
                  ? format(parseISO(lastPeriodDate), 'd MMMM yyyy', { locale: it })
                  : 'Seleziona data'
                }
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Durata ciclo (giorni)</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setCycleLength(String(Math.max(21, parseInt(cycleLength) - 1)))}
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{cycleLength}</Text>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setCycleLength(String(Math.min(35, parseInt(cycleLength) + 1)))}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Durata mestruazioni (giorni)</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setPeriodLength(String(Math.max(3, parseInt(periodLength) - 1)))}
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{periodLength}</Text>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setPeriodLength(String(Math.min(7, parseInt(periodLength) + 1)))}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (!lastPeriodDate || isLoading) && styles.saveButtonDisabled]}
              onPress={saveCycleData}
              disabled={!lastPeriodDate || isLoading}
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

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDatePickerVisible(false)}
      >
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

            <Text style={styles.selectedDateText}>
              {selectedDate && format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
            </Text>

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
                    size={28}
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
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 2, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 2, 0.3)',
  },
  setupBannerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  setupBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffa502',
  },
  setupBannerText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
    gap: 6,
  },
  editButtonText: {
    color: '#ff6b8a',
    fontSize: 14,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 161, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  tipText: {
    flex: 1,
    color: '#70a1ff',
    fontSize: 14,
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
  datePickerModal: {
    backgroundColor: '#2a2a4e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
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
    fontSize: 18,
    color: '#ff6b8a',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    gap: 12,
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff6b8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
