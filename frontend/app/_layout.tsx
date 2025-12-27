import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Platform } from 'react-native';
import { 
  registerForPushNotificationsAsync, 
  scheduleMoodReminder,
  addNotificationListener,
  addNotificationResponseListener 
} from '../services/notifications';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const { loadUser, user } = useStore();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadUser();
    
    // Setup notifications (only on device, not web)
    if (Platform.OS !== 'web') {
      setupNotifications();
    }
    
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      console.log('Push notification token:', token);
      
      // Schedule daily mood reminder
      await scheduleMoodReminder();
      
      // Listen for incoming notifications
      notificationListener.current = addNotificationListener(notification => {
        console.log('Notification received:', notification);
      });

      // Listen for notification responses (when user taps)
      responseListener.current = addNotificationResponseListener(response => {
        console.log('Notification tapped:', response);
        // Handle navigation based on notification type
        const data = response.notification.request.content.data;
        // Can navigate to specific screens based on data.type
      });
    } catch (error) {
      console.log('Notification setup error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
