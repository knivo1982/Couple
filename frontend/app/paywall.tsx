import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';
import Purchases, { PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';

const { width } = Dimensions.get('window');

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = 'test_AneLYuVCDeRAsvrgPBxeJFaFdjt';
const REVENUECAT_API_KEY_ANDROID = 'goog_INSERISCI_LA_TUA_API_KEY_QUI';

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

interface PlanInfo {
  id: string;
  name: string;
  price: string;
  period: string;
  pricePerMonth: string | null;
  savings: string | null;
  popular: boolean;
  package: PurchasesPackage | null;
}

export default function PaywallScreen() {
  const router = useRouter();
  const { setPurchaseInfo, setHasSeenPaywall, setIsPremium } = usePremiumStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [plans, setPlans] = useState<PlanInfo[]>([
    {
      id: 'yearly',
      name: 'Annuale',
      price: '€29,99',
      period: '/anno',
      pricePerMonth: '€2,50/mese',
      savings: 'Risparmi il 35%',
      popular: true,
      package: null,
    },
    {
      id: 'monthly',
      name: 'Mensile',
      price: '€3,99',
      period: '/mese',
      pricePerMonth: null,
      savings: null,
      popular: false,
      package: null,
    },
  ]);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // Configura RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      
      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_API_KEY_IOS 
        : REVENUECAT_API_KEY_ANDROID;
      
      // Skip se API key non configurata
      if (apiKey.includes('INSERISCI')) {
        console.log('RevenueCat API key not configured');
        return;
      }

      await Purchases.configure({ apiKey });
      setIsConfigured(true);
      console.log('RevenueCat configured');

      // Carica le offerte disponibili
      const offerings = await Purchases.getOfferings();
      console.log('Offerings:', offerings);
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const availablePackages = offerings.current.availablePackages;
        
        // Aggiorna i prezzi con quelli reali
        const updatedPlans = plans.map(plan => {
          const pkg = availablePackages.find(p => 
            (plan.id === 'yearly' && (p.packageType === 'ANNUAL' || p.identifier.includes('yearly'))) ||
            (plan.id === 'monthly' && (p.packageType === 'MONTHLY' || p.identifier.includes('monthly')))
          );
          
          if (pkg) {
            return {
              ...plan,
              price: pkg.product.priceString,
              package: pkg,
            };
          }
          return plan;
        });
        
        setPlans(updatedPlans);
      }
    } catch (error) {
      console.log('RevenueCat init error:', error);
    }
  };

  const handleClose = () => {
    setHasSeenPaywall(true);
    router.replace('/');
  };

  const handleContinueFree = () => {
    setHasSeenPaywall(true);
    router.replace('/');
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    
    const selectedPlanInfo = plans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanInfo?.package || !isConfigured) {
      // Se RevenueCat non è configurato
      Alert.alert(
        'Configurazione Richiesta',
        'Gli acquisti in-app richiedono la configurazione di RevenueCat. Contatta lo sviluppatore.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
      return;
    }

    try {
      // Effettua l'acquisto tramite RevenueCat/StoreKit
      const { customerInfo } = await Purchases.purchasePackage(selectedPlanInfo.package);
      
      // Verifica se l'utente ha accesso premium
      if (customerInfo.entitlements.active['premium'] || 
          customerInfo.entitlements.active['Premium'] ||
          Object.keys(customerInfo.entitlements.active).length > 0) {
        const purchaseDate = new Date().toISOString();
        setPurchaseInfo(selectedPlan as 'monthly' | 'yearly', purchaseDate);
        setIsPremium(true);
        
        Alert.alert(
          '🎉 Benvenuto in Premium!',
          "Hai sbloccato tutte le funzionalità di Couple Bliss!",
          [{ text: 'Inizia', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      console.log('Purchase error:', error);
      if (!error.userCancelled) {
        Alert.alert('Errore', "Impossibile completare l'acquisto. Riprova più tardi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!isConfigured) {
      Alert.alert('Info', 'RevenueCat non configurato.');
      return;
    }

    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['premium'] || 
          customerInfo.entitlements.active['Premium'] ||
          Object.keys(customerInfo.entitlements.active).length > 0) {
        const purchaseDate = new Date().toISOString();
        setPurchaseInfo('yearly', purchaseDate);
        setIsPremium(true);
        
        Alert.alert(
          '✅ Acquisto Ripristinato',
          'Il tuo abbonamento Premium è stato ripristinato!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Info', 'Nessun acquisto precedente trovato.');
      }
    } catch (error) {
      console.log('Restore error:', error);
      Alert.alert('Errore', 'Impossibile ripristinare gli acquisti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleClose}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="close-circle" size={32} color="#fff" />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Couple Bliss Premium</Text>
          <Text style={styles.subtitle}>Sblocca tutte le funzionalità per la tua relazione</Text>
        </View>

        {/* All Features */}
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureRow, feature.highlight && styles.featureHighlight]}>
              <View style={[styles.featureIconContainer, feature.highlight && styles.featureIconHighlight]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.highlight ? "#ff6b8a" : "#888"} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureText, feature.highlight && styles.featureTextHighlight]}>
                  {feature.text}
                </Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
              {feature.highlight && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>PIÙ POPOLARE</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === plan.id && styles.radioOuterSelected
                ]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              
              {plan.pricePerMonth && (
                <Text style={styles.pricePerMonth}>{plan.pricePerMonth}</Text>
              )}
              
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Attiva Premium
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Ripristina acquisti</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleContinueFree}>
          <Text style={styles.skipText}>Continua gratis →</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          L'abbonamento si rinnova automaticamente. Puoi annullare in qualsiasi momento dalle impostazioni del tuo account Apple. Il pagamento verrà addebitato sul tuo account iTunes.
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    opacity: 0.7,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  crown: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  featureHighlight: {
    backgroundColor: 'rgba(255, 107, 138, 0.1)',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconHighlight: {
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  featureTextHighlight: {
    color: '#ff6b8a',
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#ff6b8a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#ff6b8a',
    backgroundColor: 'rgba(255, 107, 138, 0.1)',
  },
  planCardPopular: {
    borderColor: '#ff6b8a',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#ff6b8a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 32,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  planPeriod: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  pricePerMonth: {
    fontSize: 13,
    color: '#888',
    marginLeft: 32,
    marginTop: 2,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 32,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ed573',
  },
  purchaseButton: {
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ff6b8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#ff6b8a',
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
