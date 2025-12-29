import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'medium', 
  showText = true 
}) => {
  const { isPremium } = usePremiumStore();
  
  if (!isPremium) return null;
  
  const sizes = {
    small: { icon: 14, container: 24, fontSize: 10 },
    medium: { icon: 18, container: 32, fontSize: 12 },
    large: { icon: 24, container: 44, fontSize: 14 },
  };
  
  const s = sizes[size];
  
  return (
    <View style={[styles.badge, { height: s.container, paddingHorizontal: showText ? 10 : 0, width: showText ? 'auto' : s.container }]}>
      <Ionicons name="diamond" size={s.icon} color="#f39c12" />
      {showText && <Text style={[styles.badgeText, { fontSize: s.fontSize }]}>PREMIUM</Text>}
    </View>
  );
};

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  feature,
  fallback 
}) => {
  const { isPremium } = usePremiumStore();
  const router = useRouter();
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <TouchableOpacity 
      style={styles.lockedContainer}
      onPress={() => router.push('/paywall')}
    >
      <View style={styles.lockedOverlay}>
        <Ionicons name="lock-closed" size={24} color="#f39c12" />
        <Text style={styles.lockedText}>Funzione Premium</Text>
        <Text style={styles.lockedSubtext}>Tocca per sbloccare</Text>
      </View>
    </TouchableOpacity>
  );
};

interface UpgradeButtonProps {
  style?: any;
  compact?: boolean;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({ style, compact = false }) => {
  const { isPremium } = usePremiumStore();
  const router = useRouter();
  
  if (isPremium) return null;
  
  return (
    <TouchableOpacity 
      style={[compact ? styles.upgradeButtonCompact : styles.upgradeButton, style]}
      onPress={() => router.push('/paywall')}
    >
      <Ionicons name="diamond" size={compact ? 16 : 20} color="#fff" />
      {!compact && <Text style={styles.upgradeText}>Passa a Premium</Text>}
    </TouchableOpacity>
  );
};

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ 
  visible, 
  onClose, 
  feature 
}) => {
  const router = useRouter();
  
  const handleUpgrade = () => {
    onClose();
    router.push('/paywall');
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIcon}>
            <Ionicons name="diamond" size={40} color="#f39c12" />
          </View>
          
          <Text style={styles.modalTitle}>Funzione Premium</Text>
          <Text style={styles.modalMessage}>
            {feature} è disponibile solo con l'abbonamento Premium.
          </Text>
          
          <TouchableOpacity style={styles.modalUpgradeButton} onPress={handleUpgrade}>
            <Ionicons name="diamond" size={20} color="#fff" />
            <Text style={styles.modalUpgradeText}>Sblocca Premium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Non ora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Hook to check premium and show paywall
export const usePremiumFeature = () => {
  const { isPremium, incrementUsage, shouldShowPaywall, setHasSeenPaywall } = usePremiumStore();
  const router = useRouter();
  
  const checkPremiumFeature = (featureName: string, callback: () => void) => {
    incrementUsage();
    
    if (isPremium) {
      callback();
      return;
    }
    
    if (shouldShowPaywall()) {
      setHasSeenPaywall(true);
      router.push('/paywall');
      return;
    }
    
    // Allow limited use
    callback();
  };
  
  const requirePremium = (featureName: string) => {
    if (!isPremium) {
      router.push('/paywall');
      return false;
    }
    return true;
  };
  
  return { checkPremiumFeature, requirePremium, isPremium };
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    borderRadius: 20,
    gap: 4,
    justifyContent: 'center',
  },
  badgeText: {
    color: '#f39c12',
    fontWeight: 'bold',
  },
  lockedContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  lockedOverlay: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  lockedText: {
    color: '#f39c12',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  lockedSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  upgradeButtonCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#2a2a4e',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    gap: 8,
    width: '100%',
  },
  modalUpgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 16,
  },
  modalCloseText: {
    color: '#888',
    fontSize: 14,
  },
});
