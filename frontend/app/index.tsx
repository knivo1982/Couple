import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { userAPI } from '../services/api';

export default function Index() {
  const { user, isLoading, loadUser, saveUser } = useStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [coupleCode, setCoupleCode] = useState('');
  const [step, setStep] = useState<'name' | 'gender' | 'code'>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [isLoading, user]);

  const handleCreateAccount = async () => {
    if (!name.trim() || !gender) return;
    
    setIsSubmitting(true);
    try {
      const newUser = await userAPI.create(name.trim(), gender);
      await saveUser(newUser);
      router.replace('/home');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Errore', 'Impossibile creare l\'account. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!coupleCode.trim()) {
      Alert.alert('Errore', 'Inserisci il codice coppia');
      return;
    }
    
    if (!name.trim() || !gender) {
      Alert.alert('Errore', 'Completa prima nome e genere');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await userAPI.create(name.trim(), gender);
      await userAPI.joinCouple(newUser.id, coupleCode.trim().toUpperCase());
      const updatedUser = await userAPI.get(newUser.id);
      await saveUser(updatedUser);
      router.replace('/home');
    } catch (error: any) {
      console.error('Error joining couple:', error);
      Alert.alert('Errore', error.response?.data?.detail || 'Codice non valido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b8a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Ionicons name="heart" size={60} color="#ff6b8a" />
            <Text style={styles.title}>Couple Bliss</Text>
            <Text style={styles.subtitle}>Il benessere della coppia</Text>
          </View>

          {step === 'name' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Come ti chiami?</Text>
              <TextInput
                style={styles.input}
                placeholder="Il tuo nome"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.button, !name.trim() && styles.buttonDisabled]}
                onPress={() => name.trim() && setStep('gender')}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonText}>Avanti</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {step === 'gender' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Qual è il tuo genere?</Text>
              
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('male')}
                >
                  <Ionicons
                    name="male"
                    size={40}
                    color={gender === 'male' ? '#fff' : '#4a9eff'}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'male' && styles.genderTextActive,
                    ]}
                  >
                    Uomo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('female')}
                >
                  <Ionicons
                    name="female"
                    size={40}
                    color={gender === 'female' ? '#fff' : '#ff6b8a'}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'female' && styles.genderTextActive,
                    ]}
                  >
                    Donna
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, !gender && styles.buttonDisabled]}
                onPress={() => gender && setStep('code')}
                disabled={!gender}
              >
                <Text style={styles.buttonText}>Avanti</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('name')}
              >
                <Ionicons name="arrow-back" size={20} color="#888" />
                <Text style={styles.backButtonText}>Indietro</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'code' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Collega la coppia</Text>
              <Text style={styles.stepDescription}>
                Hai un codice coppia? Inseriscilo qui.
                Altrimenti crea un nuovo account.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Codice coppia (opzionale)"
                placeholderTextColor="#888"
                value={coupleCode}
                onChangeText={(text) => setCoupleCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={coupleCode.trim() ? handleJoinCouple : handleCreateAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {coupleCode.trim() ? 'Unisciti alla coppia' : 'Crea Account'}
                    </Text>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('gender')}
              >
                <Ionicons name="arrow-back" size={20} color="#888" />
                <Text style={styles.backButtonText}>Indietro</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  genderButton: {
    width: 120,
    height: 120,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a5e',
  },
  genderButtonActive: {
    backgroundColor: '#ff6b8a',
    borderColor: '#ff6b8a',
  },
  genderText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  genderTextActive: {
    color: '#fff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
