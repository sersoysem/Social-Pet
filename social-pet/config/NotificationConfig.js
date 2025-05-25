import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Bildirim ayarlarını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Bildirim izinlerini iste
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni alınamadı!');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
      console.log('Push token:', token);
    } catch (error) {
      console.log('Push token alınamadı:', error);
    }
  } else {
    console.log('Fiziksel cihaz gerekli');
  }

  return token;
}

// Yerel bildirim gönder
export async function sendLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Hemen göster
    });
    console.log('Bildirim gönderildi:', { title, body });
  } catch (error) {
    console.log('Bildirim gönderilemedi:', error);
  }
}

// Bildirim dinleyicilerini ayarla
export function setupNotificationListeners(navigation) {
  // Uygulama açıkken gelen bildirimler
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Bildirim alındı:', notification);
  });

  // Bildirime tıklandığında
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Bildirime tıklandı:', response);
    const data = response.notification.request.content.data;
    
    // Bildirim tipine göre yönlendirme
    if (data.type === 'match') {
      navigation.navigate('discover');
    } else if (data.type === 'message') {
      navigation.navigate('chat', { id: data.chatId });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
} 