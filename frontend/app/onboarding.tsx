import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
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
    bgColor: '#ff6b8a',
    features: [
      { icon: 'calendar', text: 'Traccia i momenti intimi' },
      { icon: 'heart', text: 'Monitora il mood di coppia' },
      { icon: 'flame', text: 'Sfide e giochi divertenti' },
    ],
  },
  {
    id: 2,
    emoji: '✅',
    title: 'Versione Gratuita',
    description: 'Cosa puoi fare subito, gratis!',
    bgColor: '#2ed573',
    features: [
      { icon: 'calendar-outline', text: 'Calendario intimità', included: true },
      { icon: 'happy-outline', text: 'Mood tracker giornaliero', included: true },
      { icon: 'stats-chart-outline', text: 'Statistiche mese corrente', included: true },
      { icon: 'chatbubble-outline', text: 'AI Coach (base)', included: true },
      { icon: 'game-controller-outline', text: 'Sfide settimanali', included: true },
    ],
  },
  {
    id: 3,
    emoji: '👑',
    title: 'Sblocca Premium',
    description: 'Porta la vostra relazione al livello successivo!',
    bgColor: '#f39c12',
    features: [
      { icon: 'eye', text: 'Fertilità per lui', premium: true, desc: 'Vedi giorni sicuri/pericolo' },
      { icon: 'chatbubbles', text: 'Desideri Segreti', premium: true, desc: 'Match delle fantasie' },
      { icon: 'time', text: 'Storico completo', premium: true, desc: 'Statistiche tutti i mesi' },
      { icon: 'flame', text: 'Calorie bruciate', premium: true, desc: 'Traccia il consumo' },
      { icon: 'trophy', text: 'Badge esclusivi', premium: true, desc: 'Traguardi e sfide' },
      { icon: 'infinite', text: 'AI Coach illimitato', premium: true, desc: 'Consigli personalizzati' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setHasSeenOnboarding } = usePremiumStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const slide = ONBOARDING_SLIDES[currentSlide];

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
        {ONBOARDING_SLIDES.map((slideData, index) => (
          <View key={slideData.id} style={styles.slide}>
            {/* Emoji Circle */}
            <View style={[styles.emojiCircle, { backgroundColor: slideData.bgColor + '20' }]}>
              <Text style={styles.emoji}>{slideData.emoji}</Text>
            </View>
            
            <Text style={styles.title}>{slideData.title}</Text>
            <Text style={styles.description}>{slideData.description}</Text>

            <View style={styles.featuresContainer}>
              {slideData.features.map((feature: any, fIndex) => (
                <View key={fIndex} style={[
                  styles.featureRow,
                  feature.premium && styles.featureRowPremium
                ]}>
                  <View style={[
                    styles.featureIcon,
                    feature.included && styles.featureIconIncluded,
                    feature.premium && styles.featureIconPremium,
                  ]}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={22} 
                      color={feature.included ? '#2ed573' : feature.premium ? '#f39c12' : '#ff6b8a'} 
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureText}>{feature.text}</Text>
                    {feature.desc && (
                      <Text style={styles.featureDesc}>{feature.desc}</Text>
                    )}
                  </View>
                  {feature.included && (
                    <Ionicons name="checkmark-circle" size={22} color="#2ed573" />
                  )}
                  {feature.premium && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
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
              <Text style={styles.premiumButtonText}>Prova Premium Gratis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.freeButton} onPress={handleContinueFree}>
              <Text style={styles.freeButtonText}>Continua con la versione gratuita</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 60,
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
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5e',
  },
  featureRowPremium: {
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIconIncluded: {
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
  },
  featureIconPremium: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  featureContent: {
    flex: 1,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
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
    paddingHorizontal: 24,
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
    gap: 10,
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
