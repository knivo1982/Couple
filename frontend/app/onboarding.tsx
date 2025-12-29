import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    emoji: '💖',
    title: 'Rafforza il vostro legame',
    description: 'Couple Bliss ti aiuta a vivere la relazione con più complicità, intimità e divertimento.',
    backgroundColor: '#ff6b8a',
  },
  {
    id: 2,
    emoji: '🔐',
    title: 'Solo voi due, sempre sincronizzati',
    description: 'Condividi emozioni, desideri, momenti speciali e giochi di coppia in uno spazio privato e sicuro.',
    backgroundColor: '#9b59b6',
  },
  {
    id: 3,
    emoji: '✨',
    title: 'Scopri il meglio di Couple Bliss',
    description: 'Sblocca sfide esclusive, statistiche di coppia e funzionalità avanzate con Premium.',
    backgroundColor: '#f39c12',
    isPremiumSlide: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setHasSeenOnboarding } = usePremiumStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<any>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    router.replace('/');
  };

  const handleGetStarted = () => {
    setHasSeenOnboarding(true);
    router.replace('/');
  };

  const handleDiscoverPremium = () => {
    setHasSeenOnboarding(true);
    router.replace('/paywall');
  };

  const currentSlide = ONBOARDING_DATA[currentIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentSlide.backgroundColor }]}>
      {/* Skip button */}
      {currentIndex < ONBOARDING_DATA.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Salta</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{currentSlide.emoji}</Text>
        </View>
        
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {currentSlide.isPremiumSlide ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Inizia Gratis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDiscoverPremium}>
              <Ionicons name="diamond" size={18} color="#f39c12" />
              <Text style={styles.secondaryButtonText}>Scopri Premium</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Avanti</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 30,
  },
  buttonsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -50,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
