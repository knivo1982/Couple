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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { usePremiumStore } from '../store/premiumStore';
import { userAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const { user, isLoading, loadUser, saveUser } = useStore();
  const { hasSeenOnboarding, loadOnboardingState } = usePremiumStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [coupleCode, setCoupleCode] = useState('');
  const [step, setStep] = useState<'welcome' | 'name' | 'gender' | 'code'>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadOnboardingState();
      setIsInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    // Only navigate when fully initialized
    if (!isInitialized || isLoading) return;
    
    if (user) {
      // User già esistente - vai direttamente alla home
      // L'onboarding è solo per NUOVI utenti (dopo registrazione)
      router.replace('/(tabs)');
    }
    // If no user, show registration form (don't navigate)
  }, [isInitialized, isLoading, user]);

  const handleCreateAccount = async () => {
    if (!name.trim() || !gender) return;
    
    setIsSubmitting(true);
    try {
      const newUser = await userAPI.create(name.trim(), gender);
      await saveUser(newUser);
      router.replace('/onboarding');
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
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('Error joining couple:', error);
      Alert.alert('Errore', error.response?.data?.detail || 'Codice non valido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingEmoji}>💕</Text>
        </View>
        <ActivityIndicator size="large" color="#ff6b8a" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  // Step progress indicator
  const getProgress = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'name': return 1;
      case 'gender': return 2;
      case 'code': return 3;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Bar */}
          {step !== 'welcome' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(getProgress() / 3) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>Passo {getProgress()} di 3</Text>
            </View>
          )}

          {/* WELCOME SCREEN */}
          {step === 'welcome' && (
            <View style={styles.welcomeContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoEmoji}>💕</Text>
                </View>
                <View style={styles.logoGlow} />
              </View>
              
              <Text style={styles.welcomeTitle}>Couple Bliss</Text>
              <Text style={styles.welcomeSubtitle}>
                L'app che rafforza il legame{'\n'}con il tuo partner
              </Text>

              <View style={styles.featuresPreview}>
                <View style={styles.featurePreviewItem}>
                  <Text style={styles.featurePreviewEmoji}>📅</Text>
                  <Text style={styles.featurePreviewText}>Calendario Intimità</Text>
                </View>
                <View style={styles.featurePreviewItem}>
                  <Text style={styles.featurePreviewEmoji}>💭</Text>
                  <Text style={styles.featurePreviewText}>Desideri Segreti</Text>
                </View>
                <View style={styles.featurePreviewItem}>
                  <Text style={styles.featurePreviewEmoji}>🧠</Text>
                  <Text style={styles.featurePreviewText}>AI Coach</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setStep('name')}
              >
                <Text style={styles.startButtonText}>Inizia Ora</Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.privacyText}>
                🔒 I tuoi dati sono privati e sicuri
              </Text>
            </View>
          )}

          {/* NAME STEP */}
          {step === 'name' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepEmoji}>👋</Text>
              </View>
              
              <Text style={styles.stepTitle}>Ciao!</Text>
              <Text style={styles.stepSubtitle}>Come ti chiami?</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Il tuo nome"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.nextButton, !name.trim() && styles.buttonDisabled]}
                onPress={() => name.trim() && setStep('gender')}
                disabled={!name.trim()}
              >
                <Text style={styles.nextButtonText}>Continua</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* GENDER STEP */}
          {step === 'gender' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepEmoji}>💫</Text>
              </View>
              
              <Text style={styles.stepTitle}>Piacere {name}!</Text>
              <Text style={styles.stepSubtitle}>Qual è il tuo genere?</Text>

              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'male' && styles.genderCardMaleActive,
                  ]}
                  onPress={() => setGender('male')}
                >
                  <View style={[styles.genderIconCircle, gender === 'male' && styles.genderIconCircleMale]}>
                    <Ionicons
                      name="male"
                      size={36}
                      color={gender === 'male' ? '#fff' : '#4a9eff'}
                    />
                  </View>
                  <Text style={[styles.genderLabel, gender === 'male' && styles.genderLabelActive]}>
                    Uomo
                  </Text>
                  {gender === 'male' && (
                    <View style={styles.genderCheck}>
                      <Ionicons name="checkmark-circle" size={24} color="#4a9eff" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'female' && styles.genderCardFemaleActive,
                  ]}
                  onPress={() => setGender('female')}
                >
                  <View style={[styles.genderIconCircle, gender === 'female' && styles.genderIconCircleFemale]}>
                    <Ionicons
                      name="female"
                      size={36}
                      color={gender === 'female' ? '#fff' : '#ff6b8a'}
                    />
                  </View>
                  <Text style={[styles.genderLabel, gender === 'female' && styles.genderLabelActive]}>
                    Donna
                  </Text>
                  {gender === 'female' && (
                    <View style={styles.genderCheck}>
                      <Ionicons name="checkmark-circle" size={24} color="#ff6b8a" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.nextButton, !gender && styles.buttonDisabled]}
                onPress={() => gender && setStep('code')}
                disabled={!gender}
              >
                <Text style={styles.nextButtonText}>Continua</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('name')}
              >
                <Ionicons name="arrow-back" size={18} color="#888" />
                <Text style={styles.backButtonText}>Indietro</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* COUPLE CODE STEP */}
          {step === 'code' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepEmoji}>💑</Text>
              </View>
              
              <Text style={styles.stepTitle}>Collega la coppia</Text>
              <Text style={styles.stepSubtitle}>
                Il tuo partner ha già un account?{'\n'}Inserisci il suo codice per connettervi!
              </Text>

              <View style={styles.codeInputContainer}>
                <Ionicons name="link-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.codeInput}
                  placeholder="Codice coppia (es. ABC123)"
                  placeholderTextColor="#666"
                  value={coupleCode}
                  onChangeText={(text) => setCoupleCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>oppure</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity
                style={[styles.createButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleCreateAccount}
                disabled={isSubmitting}
              >
                {isSubmitting && !coupleCode.trim() ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={22} color="#fff" />
                    <Text style={styles.createButtonText}>Crea nuovo account</Text>
                  </>
                )}
              </TouchableOpacity>

              {coupleCode.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.joinButton, isSubmitting && styles.buttonDisabled]}
                  onPress={handleJoinCouple}
                  disabled={isSubmitting}
                >
                  {isSubmitting && coupleCode.trim() ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="people-outline" size={22} color="#fff" />
                      <Text style={styles.joinButtonText}>Unisciti con codice</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('gender')}
              >
                <Ionicons name="arrow-back" size={18} color="#888" />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 50,
  },
  loadingText: {
    marginTop: 16,
    color: '#888',
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  // Progress Bar
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b8a',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    color: '#888',
    fontSize: 13,
  },
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 138, 0.3)',
  },
  logoEmoji: {
    fontSize: 60,
  },
  logoGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 107, 138, 0.1)',
    top: -15,
    left: -15,
    zIndex: -1,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 20,
  },
  featurePreviewItem: {
    alignItems: 'center',
    width: 90,
  },
  featurePreviewEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featurePreviewText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#ff6b8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyText: {
    marginTop: 30,
    color: '#666',
    fontSize: 13,
  },
  // Steps
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  stepIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepEmoji: {
    fontSize: 50,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    padding: 18,
  },
  // Buttons
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    gap: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#444',
    opacity: 0.7,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 6,
  },
  backButtonText: {
    color: '#888',
    fontSize: 15,
  },
  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  genderCardMaleActive: {
    borderColor: '#4a9eff',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
  },
  genderCardFemaleActive: {
    borderColor: '#ff6b8a',
    backgroundColor: 'rgba(255, 107, 138, 0.1)',
  },
  genderIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderIconCircleMale: {
    backgroundColor: '#4a9eff',
  },
  genderIconCircleFemale: {
    backgroundColor: '#ff6b8a',
  },
  genderLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  genderLabelActive: {
    color: '#fff',
  },
  genderCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  // Code Input
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 138, 0.3)',
  },
  codeInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    padding: 18,
    letterSpacing: 4,
    textAlign: 'center',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a5e',
  },
  orText: {
    color: '#888',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ed573',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    gap: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
