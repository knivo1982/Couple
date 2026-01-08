import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // Animazioni
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const heart1 = useRef(new Animated.Value(0)).current;
  const heart2 = useRef(new Animated.Value(0)).current;
  const heart3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequenza animazioni
    Animated.sequence([
      // 1. Logo appare con scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Testo principale
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      
      // 3. Sottotitolo
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      
      // 4. Cuoricini fluttuanti
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(heart1, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heart2, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heart3, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Pulse animation continua
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Completa dopo 3 secondi
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Interpolazioni per i cuori fluttuanti
  const heart1TranslateY = heart1.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });
  const heart2TranslateY = heart2.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });
  const heart3TranslateY = heart3.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Particelle di sfondo */}
      <View style={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.3 + 0.1,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
              },
            ]}
          />
        ))}
      </View>

      {/* Logo principale */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
            ],
            opacity: logoOpacity,
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>💕</Text>
        </View>
      </Animated.View>

      {/* Titolo */}
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        Couple Bliss
      </Animated.Text>

      {/* Sottotitolo */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        L'app per coppie felici
      </Animated.Text>

      {/* Cuoricini fluttuanti */}
      <View style={styles.heartsContainer}>
        <Animated.Text
          style={[
            styles.floatingHeart,
            styles.heart1,
            {
              opacity: heart1,
              transform: [{ translateY: heart1TranslateY }],
            },
          ]}
        >
          💗
        </Animated.Text>
        <Animated.Text
          style={[
            styles.floatingHeart,
            styles.heart2,
            {
              opacity: heart2,
              transform: [{ translateY: heart2TranslateY }],
            },
          ]}
        >
          💖
        </Animated.Text>
        <Animated.Text
          style={[
            styles.floatingHeart,
            styles.heart3,
            {
              opacity: heart3,
              transform: [{ translateY: heart3TranslateY }],
            },
          ]}
        >
          💝
        </Animated.Text>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

// Componente per i dots di caricamento
function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ff6b8a',
    borderRadius: 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 138, 0.5)',
    shadowColor: '#ff6b8a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textShadowColor: 'rgba(255, 107, 138, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  heartsContainer: {
    flexDirection: 'row',
    marginTop: 40,
    width: 200,
    justifyContent: 'space-around',
  },
  floatingHeart: {
    fontSize: 28,
  },
  heart1: {
    marginTop: 10,
  },
  heart2: {
    marginTop: -10,
  },
  heart3: {
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b8a',
    marginHorizontal: 4,
  },
});
