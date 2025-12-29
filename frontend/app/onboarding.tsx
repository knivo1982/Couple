import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SCREENS = [
  {
    icon: 'heart',
    title: 'Rafforza la Connessione',
    description: 'Couple Bliss ti aiuta a costruire una relazione più profonda con il tuo partner attraverso strumenti pensati per voi.',
    color: '#ff6b8a',
  },
  {
    icon: 'flame',
    title: 'Accendi la Passione',
    description: 'Sfide piccanti, giochi di coppia e suggerimenti per mantenere viva la fiamma del desiderio.',
    color: '#ff4757',
  },
  {
    icon: 'diamond',
    title: 'Esperienza Premium',
    description: 'Sblocca funzionalità esclusive: AI Coach, statistiche avanzate, wishlist segrete e molto altro.',
    color: '#f39c12',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setHasSeenOnboarding } = usePremiumStore();
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      setHasSeenOnboarding(true);
      router.replace('/paywall');
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const screen = ONBOARDING_SCREENS[currentScreen];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Salta</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${screen.color}20` }]}>
          <Ionicons name={screen.icon as any} size={80} color={screen.color} />
        </View>

        <Text style={styles.title}>{screen.title}</Text>
        <Text style={styles.description}>{screen.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ONBOARDING_SCREENS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentScreen && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentScreen === ONBOARDING_SCREENS.length - 1 ? 'Inizia' : 'Avanti'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3a3a5e',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#ff6b8a',
    width: 30,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
