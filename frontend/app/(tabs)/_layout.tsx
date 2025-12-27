import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Alert } from 'react-native';
import { useStore } from '../../store/useStore';

export default function TabLayout() {
  const { user } = useStore();
  
  // Check if user is paired (has a partner)
  const isPaired = !!user?.partner_id;

  const handleDisabledPress = () => {
    Alert.alert(
      '🔒 Funzione Bloccata',
      'Per usare questa funzione devi prima collegarti con il tuo partner!\n\nCondividi il tuo codice coppia per iniziare.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#ff6b8a',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="happy" size={size} color={isPaired ? color : '#444'} />
              {!isPaired && <View style={styles.lockBadgeSmall}><Ionicons name="lock-closed" size={8} color="#fff" /></View>}
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isPaired) {
              e.preventDefault();
              handleDisabledPress();
            }
          },
        }}
      />
      <Tabs.Screen
        name="spicy"
        options={{
          title: 'Piccante',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="flame" size={size} color={isPaired ? color : '#444'} />
              {!isPaired && <View style={styles.lockBadgeSmall}><Ionicons name="lock-closed" size={8} color="#fff" /></View>}
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isPaired) {
              e.preventDefault();
              handleDisabledPress();
            }
          },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="stats-chart" size={size} color={isPaired ? color : '#444'} />
              {!isPaired && <View style={styles.lockBadgeSmall}><Ionicons name="lock-closed" size={8} color="#fff" /></View>}
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isPaired) {
              e.preventDefault();
              handleDisabledPress();
            }
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a2e',
    borderTopColor: '#2a2a4e',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  lockBadgeSmall: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
