import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 1,
    emoji: '💕',
    title: 'Benvenuti in Couple Bliss!',
    description: "L'app che rafforza la vostra relazione giorno dopo giorno",
    features: [
      { icon: 'calendar', text: 'Traccia i momenti intimi' },
      { icon: 'heart', text: 'Monitora il mood di coppia' },
      { icon: 'flame', text: 'Sfide e giochi divertenti' },
    ],
  },
  {
    id: 2,
    emoji: '🔥',
    title: 'Funzionalità Free',
    description: 'Cosa puoi fare con la versione gratuita',
    features: [
      { icon: 'checkmark-circle', text: 'Calendario intimità base', color: '#2ed573' },
      { icon: 'checkmark-circle', text: 'Mood tracker giornaliero', color: '#2ed573' },
      { icon: 'checkmark-circle', text: 'Statistiche mese corrente', color: '#2ed573' },
      { icon: 'checkmark-circle', text: 'AI Coach (domande limitate)', color: '#2ed573' },
    ],
  },
  {
    id: 3,
    emoji: '👑',
    title: 'Passa a Premium',
    description: 'Sblocca il massimo potenziale della vostra relazione',
    features: [
      { icon: 'eye', text: 'Calendario Fertilità (per lui)', color: '#f39c12', premium: true },
      { icon: 'chatbubbles', text: 'Desideri Segreti - Match fantasie', color: '#f39c12', premium: true },
      { icon: 'time', text: 'Statistiche storiche complete', color: '#f39c12', premium: true },
      { icon: 'flame', text: 'Calorie bruciate', color: '#f39c12', premium: true },
      { icon: 'trophy', text: 'Badge e Traguardi', color: '#f39c12', premium: true },
      { icon: 'bulb', text: 'AI Coach illimitato', color: '#f39c12', premium: true },
    ],
  },
];

export default function OnboardingPremiumScreen() {
  const router = useRouter();
  const { setHasSeenOnboarding } = usePremiumStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: width * (currentSlide + 1), animated: true });
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleGetPremium = () => {
    setHasSeenOnboarding(true);
    router.replace('/paywall');
  };

  const handleContinueFree = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      {currentSlide < ONBOARDING_SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Salta</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>

            <View style={styles.featuresContainer}>
              {slide.features.map((feature, fIndex) => (
                <View key={fIndex} style={styles.featureRow}>
                  <View style={[styles.featureIcon, feature.premium && styles.featureIconPremium]}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={20} 
                      color={feature.color || '#ff6b8a'} 
                    />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                  {feature.premium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {currentSlide < ONBOARDING_SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Avanti</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.premiumButton} onPress={handleGetPremium}>
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.premiumButtonText}>Prova Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.freeButton} onPress={handleContinueFree}>
              <Text style={styles.freeButtonText}>Continua Gratis</Text>
            </TouchableOpacity>
          </>
        )}
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
    zIndex: 100,
    padding: 10,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
  },
  slide: {
    width,
    paddingHorizontal: 30,
    paddingTop: 80,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIconPremium: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  premiumBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#ff6b8a',
    width: 24,
  },
  buttonsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
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
    fontSize: 17,
    fontWeight: '600',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  freeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  freeButtonText: {
    color: '#888',
    fontSize: 15,
  },
});
