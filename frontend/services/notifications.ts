import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Couple Bliss',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6b8a',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
    } catch (e) {
      console.log('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Schedule daily mood reminder at 9 PM
export async function scheduleMoodReminder() {
  // Cancel existing reminders first
  await cancelMoodReminder();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💕 Come stai oggi?',
      body: 'Registra il tuo mood e condividilo con il partner!',
      data: { type: 'mood_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
  
  console.log('Mood reminder scheduled for 9 PM daily');
}

// Cancel mood reminder
export async function cancelMoodReminder() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of notifications) {
    if (notification.content.data?.type === 'mood_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Schedule special date reminder (3 days before)
export async function scheduleSpecialDateReminder(title: string, date: string) {
  const eventDate = new Date(date);
  const reminderDate = new Date(eventDate);
  reminderDate.setDate(reminderDate.getDate() - 3);
  reminderDate.setHours(10, 0, 0, 0);
  
  // Only schedule if the reminder date is in the future
  if (reminderDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Data speciale in arrivo!',
        body: `"${title}" tra 3 giorni! Non dimenticare!`,
        data: { type: 'special_date', date },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    
    console.log(`Special date reminder scheduled for ${reminderDate}`);
  }
}

// Send immediate notification (for partner actions)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // Immediate
  });
}

// Notification types for partner actions
export const NOTIFICATION_TYPES = {
  PARTNER_MOOD: 'partner_mood',
  PARTNER_INTIMACY: 'partner_intimacy',
  PARTNER_NOTE: 'partner_note',
  SPECIAL_DATE: 'special_date',
  MOOD_REMINDER: 'mood_reminder',
};

// Listen for notifications
export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

// Listen for notification responses (when user taps)
export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
