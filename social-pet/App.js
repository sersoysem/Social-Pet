import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { setupNotificationListeners, registerForPushNotificationsAsync } from './config/NotificationConfig';

export default function App() {
  useEffect(() => {
    // Bildirim izinlerini iste
    registerForPushNotificationsAsync();
    
    // Bildirim dinleyicilerini ayarla (navigation'sız)
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // ... existing code ...
} 