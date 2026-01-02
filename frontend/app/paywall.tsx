import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  { icon: 'eye', text: 'Calendario Fertilità', desc: 'Vedi giorni sicuri e pericolosi', highlight: true },
  { icon: 'chatbubbles', text: 'Desideri Segreti', desc: 'Scopri le fantasie in comune', highlight: true },
  { icon: 'time', text: 'Statistiche Storiche', desc: 'Naviga tra tutti i mesi passati', highlight: true },
  { icon: 'flame', text: 'Calorie Bruciate', desc: 'Traccia il consumo calorico', highlight: false },
  { icon: 'trophy', text: 'Traguardi & Badge', desc: 'Sblocca achievement esclusivi', highlight: false },
  { icon: 'bulb', text: 'AI Coach Completo', desc: 'Consigli personalizzati avanzati', highlight: false },
  { icon: 'calendar', text: 'Missioni Giornaliere', desc: 'Sfide quotidiane per la coppia', highlight: false },
  { icon: 'heart', text: 'Date Night Ideas', desc: 'Idee romantiche personalizzate', highlight: false },
  { icon: 'infinite', text: 'Zero Limiti', desc: 'Tutte le funzionalità sbloccate', highlight: false },
];

const PLANS = [
  {
    id: 'yearly',
    name: 'Annuale',
    price: '€29,99',
    period: '/anno',
    pricePerMonth: '€2,50/mese',
    savings: 'Risparmi il 35%',
    popular: true,
    productId: 'couple_bliss_yearly',
  },
  {
    id: 'monthly',
    name: 'Mensile',
    price: '€3,99',
    period: '/mese',
    pricePerMonth: null,
    savings: null,
    popular: false,
    productId: 'couple_bliss_monthly',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { setPurchaseInfo, setHasSeenPaywall } = usePremiumStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setHasSeenPaywall(true);
    // Vai sempre alla schermata di login/registrazione
    router.replace('/');
  };

  const handleContinueFree = () => {
    setHasSeenPaywall(true);
    // Continua gratis -> vai a registrazione
    router.replace('/');
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const purchaseDate = new Date().toISOString();
      setPurchaseInfo(selectedPlan as 'monthly' | 'yearly', purchaseDate);
      
      Alert.alert(
        '🎉 Benvenuto in Premium!',
        "Hai sbloccato tutte le funzionalità di Couple Bliss. Goditi l'esperienza completa con il tuo partner!",
        [{ text: 'Inizia', onPress: () => router.replace('/') }]
      );
    } catch (error) {
      Alert.alert('Errore', "Impossibile completare l'acquisto. Riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Info', 'Nessun acquisto precedente trovato.');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile ripristinare gli acquisti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleClose}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="close-circle" size={32} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={32} color="#f39c12" />
          </View>
          <Text style={styles.title}>💖 Couple Bliss Premium</Text>
          <Text style={styles.subtitle}>
            Sblocca tutte le funzionalità esclusive per vivere la vostra relazione al massimo!
          </Text>
        </View>

        {/* Highlight Features */}
        <View style={styles.highlightSection}>
          <Text style={styles.highlightTitle}>🔥 Funzionalità Esclusive</Text>
          {PREMIUM_FEATURES.filter(f => f.highlight).map((feature, index) => (
            <View key={index} style={styles.highlightCard}>
              <View style={styles.highlightIcon}>
                <Ionicons name={feature.icon as any} size={28} color="#fff" />
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightText}>{feature.text}</Text>
                <Text style={styles.highlightDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* All Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>✨ Tutto incluso nel Premium</Text>
          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.filter(f => !f.highlight).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconSmall}>
                  <Ionicons name={feature.icon as any} size={18} color="#ff6b8a" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureText}>{feature.text}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>⭐ PIÙ POPOLARE</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === plan.id && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
              
              {plan.pricePerMonth && (
                <Text style={styles.pricePerMonth}>{plan.pricePerMonth}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.trialInfo}>
          <Ionicons name="shield-checkmark" size={20} color="#2ed573" />
          <Text style={styles.trialText}>7 giorni di prova gratuita</Text>
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="diamond" size={22} color="#fff" />
              <Text style={styles.purchaseButtonText}>Attiva Premium</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Ripristina acquisti</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          L'abbonamento si rinnova automaticamente. Puoi annullare in qualsiasi momento dalle impostazioni del tuo account Apple.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Highlight Section
  highlightSection: {
    marginBottom: 24,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 138, 0.3)',
  },
  highlightIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff6b8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  highlightContent: {
    flex: 1,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  highlightDesc: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 4,
  },
  featuresContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5e',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3a3a5e',
  },
  planCardSelected: {
    borderColor: '#ff6b8a',
    backgroundColor: 'rgba(255, 107, 138, 0.1)',
  },
  planCardPopular: {
    borderColor: '#f39c12',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#ff6b8a',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b8a',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  planPeriod: {
    fontSize: 16,
    color: '#888',
    marginLeft: 4,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ed573',
  },
  pricePerMonth: {
    fontSize: 14,
    color: '#888',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  trialText: {
    fontSize: 14,
    color: '#2ed573',
    fontWeight: '500',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
