import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-expo' 
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Header() {
    const {user}=useUser();
    const navigation = useNavigation();
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserEmail, setCurrentUserEmail] = useState(null);
    const [readNotifications, setReadNotifications] = useState(new Set());
    const [clearedNotifications, setClearedNotifications] = useState(new Set());

    // Get user email from either Clerk or AsyncStorage
    const getUserEmail = async () => {
      try {
        if (user?.primaryEmailAddress?.emailAddress) {
          return user.primaryEmailAddress.emailAddress;
        } else {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsed = JSON.parse(userData);
            return parsed.email;
          }
        }
      } catch (error) {
        console.error("Kullanıcı email'i alınamadı:", error);
      }
      return null;
    };

    useEffect(() => {
      const initializeUser = async () => {
        const email = await getUserEmail();
        setCurrentUserEmail(email);
        // Okunan bildirimleri yükle
        await loadReadNotifications(email);
      };
      
      initializeUser();
    }, [user]);

    useEffect(() => {
      if (currentUserEmail) {
        setupRealTimeNotifications();
      }
    }, [currentUserEmail]);

    const setupRealTimeNotifications = () => {
      if (!currentUserEmail) return;
      
      const unsubscribers = [];
      
      try {
        // 1. Real-time Matches dinleme
        const matchesQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', currentUserEmail)
        );
        
        const matchesUnsubscribe = onSnapshot(matchesQuery, () => {
          try {
            loadNotifications();
          } catch (error) {
            console.error('Matches notification hatası:', error);
          }
        });
        unsubscribers.push(matchesUnsubscribe);

        // 2. Real-time Chat dinleme
        const chatsQuery = query(
          collection(db, 'Chat'),
          where('userIds', 'array-contains', currentUserEmail)
        );
        
        const chatsUnsubscribe = onSnapshot(chatsQuery, () => {
          try {
            loadNotifications();
          } catch (error) {
            console.error('Chat notification hatası:', error);
          }
        });
        unsubscribers.push(chatsUnsubscribe);

        // 3. Real-time Appointments dinleme
        const appointmentsQuery = query(
          collection(db, 'Appointments'),
          where('userEmail', '==', currentUserEmail)
        );
        
        const appointmentsUnsubscribe = onSnapshot(appointmentsQuery, () => {
          try {
            loadNotifications();
          } catch (error) {
            console.error('Appointments notification hatası:', error);
          }
        });
        unsubscribers.push(appointmentsUnsubscribe);

        // İlk yükleme
        try {
          loadNotifications();
        } catch (error) {
          console.error('İlk notification yükleme hatası:', error);
        }

        // Cleanup function
        return () => {
          try {
            unsubscribers.forEach(unsubscribe => {
              if (typeof unsubscribe === 'function') {
                unsubscribe();
              }
            });
          } catch (error) {
            console.error('Notification cleanup hatası:', error);
          }
        };
        
      } catch (error) {
        console.error('Real-time notification setup hatası:', error);
      }
    };

    const loadNotifications = async () => {
      if (!currentUserEmail) return;
      
      console.log('🔔 Bildirimler yükleniyor, currentUserEmail:', currentUserEmail);
      
      try {
        const allNotifications = [];
        
        // 1. TÜM Koleksiyonları Kontrol Et
        console.log('📊 Firestore koleksiyonları kontrol ediliyor...');
        
        // Pets koleksiyonunda kaç pet var?
        const petsSnapshot = await getDocs(collection(db, 'Pets'));
        console.log('🐕 Toplam Pet sayısı:', petsSnapshot.docs.length);
        
        // Users koleksiyonunda kaç user var?
        const usersSnapshot = await getDocs(collection(db, 'Users'));
        console.log('👤 Toplam User sayısı:', usersSnapshot.docs.length);
        
        // 2. Yaklaşan Randevular - Öncelikle bunu düzelt
        console.log('⏰ Randevular kontrol ediliyor...');
        console.log('⏰ Aranan kullanıcı email:', currentUserEmail);
        const appointmentsQuery = query(
          collection(db, 'Appointments'),
          where('userEmail', '==', currentUserEmail)
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        console.log('⏰ Kullanıcının randevu sayısı:', appointmentsSnapshot.docs.length);
        
        appointmentsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('⏰ Randevu RAW verisi:', data);
          
          // Tarih formatını kontrol et ve düzelt
          let appointmentDate;
          if (data.date) {
            console.log('⏰ Randevu date string:', data.date, typeof data.date);
            
            // Farklı tarih formatlarını dene (hem / hem . karakteri)
            if (data.date.includes('/') || data.date.includes('.')) {
              // DD/MM/YYYY veya DD.MM.YYYY formatı
              const dateParts = data.date.split(/[/.]/); // Hem / hem . karakterini böl
              console.log('⏰ Date parts:', dateParts);
              
              if (dateParts.length === 3) {
                // DD/MM/YYYY veya DD.MM.YYYY formatı varsay
                const day = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1; // JS'de ay 0-based
                const year = parseInt(dateParts[2]);
                appointmentDate = new Date(year, month, day);
                console.log('⏰ Parse edilen tarih:', appointmentDate);
                console.log('⏰ Parse başarılı mı?', !isNaN(appointmentDate.getTime()));
              }
            } else {
              // Direk tarih parse et
              appointmentDate = new Date(data.date);
              console.log('⏰ Direkt parse edilen tarih:', appointmentDate);
            }
          }
          
          if (appointmentDate && !isNaN(appointmentDate.getTime())) {
            const now = new Date();
            const timeDiff = appointmentDate.getTime() - now.getTime();
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            
            console.log('⏰ Bugün:', now);
            console.log('⏰ Randevu tarihi:', appointmentDate);
            console.log('⏰ Zaman farkı (ms):', timeDiff);
            console.log('⏰ Bugünden gün farkı:', daysDiff);
            console.log('⏰ Gün farkı koşulu (> -1 && <= 30):', daysDiff > -1 && daysDiff <= 30);
            
            // 30 günden az kaldıysa ve henüz geçmemişse
            if (daysDiff > -1 && daysDiff <= 30) {
              console.log('⏰ ✅ Randevu bildirimi ekleniyor:', data.vetName);
              
              allNotifications.push({
                id: `appointment_${doc.id}`,
                title: `Randevu ${daysDiff <= 1 ? 'Bugün/Yarın' : 'Yaklaşıyor'} ⏰`,
                message: `${data.vetName} ile ${data.date} ${data.time}'da randevunuz var (${data.petName})`,
                time: new Date(),
                type: 'appointment',
                read: false
              });
            } else {
              console.log('⏰ ❌ Randevu çok uzak veya geçmiş, eklenmedi. Gün farkı:', daysDiff);
            }
          } else {
            console.log('❌ Tarih parse edilemedi:', data.date);
          }
        });

        // 3. Eşleşmeler - Daha basit kontrol
        console.log('📍 Eşleşmeler kontrol ediliyor...');
        const allMatches = await getDocs(collection(db, 'matches'));
        console.log('📍 Toplam match sayısı (tüm users):', allMatches.docs.length);
        
        const myMatches = [];
        allMatches.forEach(doc => {
          const data = doc.data();
          if (data.users && data.users.includes(currentUserEmail)) {
            myMatches.push({ id: doc.id, ...data });
          }
        });
        
        console.log('📍 Benim match sayım:', myMatches.length);
        
        myMatches.forEach(match => {
          console.log('📍 Match verisi:', match);
          const createdAt = match.createdAt?.toDate ? match.createdAt.toDate() : new Date(match.createdAt);
          const timeDiff = Date.now() - createdAt.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          console.log('📍 Match yaşı (gün):', daysDiff);
          
          // Son 7 gün içindeki eşleşmeler
          if (daysDiff <= 7) {
            const otherUserEmail = match.users.find(email => email !== currentUserEmail);
            const petName = match.pets?.find(p => p.owner !== currentUserEmail)?.name || 'Eşleşen Pet';
            
            allNotifications.push({
              id: `match_${match.id}`,
              title: 'Yeni Eşleşme! 🐕',
              message: `${petName} ile eşleşme oldu!`,
              time: new Date(),
              type: 'match',
              read: false
            });
          }
        });

        // 4. Mesajlar - Daha basit kontrol
        console.log('💬 Mesajlar kontrol ediliyor...');
        const allChats = await getDocs(collection(db, 'Chat'));
        console.log('💬 Toplam chat sayısı:', allChats.docs.length);
        
        const myChats = [];
        allChats.forEach(doc => {
          const data = doc.data();
          if (data.userIds && data.userIds.includes(currentUserEmail)) {
            myChats.push({ id: doc.id, ...data });
          }
        });
        
        console.log('💬 Benim chat sayım:', myChats.length);
        
        myChats.forEach(chat => {
          console.log('💬 Chat verisi:', chat);
          
          const unread = chat.lastMessage &&
            Array.isArray(chat.lastMessageSeenBy) &&
            !chat.lastMessageSeenBy.includes(currentUserEmail);
            
          console.log('💬 Okunmamış durumu:', unread);
          
          if (unread) {
            const otherUser = chat.users?.find(u => u?.email !== currentUserEmail);
            const lastMessageTime = chat.lastMessageTime?.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime);
            
            allNotifications.push({
              id: `message_${chat.id}`,
              title: 'Yeni Mesaj 💬',
              message: `${otherUser?.name || 'Bilinmeyen'}: "${chat.lastMessage?.slice(0, 50)}..."`,
              time: lastMessageTime,
              type: 'message',
              read: false
            });
          }
        });

        // Zamana göre sırala (en yeni en üstte)
        allNotifications.sort((a, b) => b.time - a.time);
        
        // Okunan ve silinmiş bildirimleri filtrele
        const filteredNotifications = allNotifications
          .filter(notif => !clearedNotifications.has(notif.id)) // Silinmiş olanları çıkar
          .map(notif => ({
            ...notif,
            read: readNotifications.has(notif.id)
          }));
        
        console.log('🔔 Toplam gerçek bildirim sayısı:', filteredNotifications.length);
        console.log('🔔 Gerçek bildirimler:', filteredNotifications);
        
        // Test bildirimi sadece hiç veri yoksa ekle
        if (filteredNotifications.length === 0) {
          console.log('🧪 Hiç gerçek veri yok, test bildirimi ekleniyor...');
          const testNotif = {
            id: 'test_1',
            title: 'Test Bildirimi 🧪',
            message: 'Henüz gerçek bildiriminiz yok. Sistem çalışıyor!',
            time: new Date(),
            type: 'match',
            read: readNotifications.has('test_1')
          };
          filteredNotifications.push(testNotif);
        }
        
        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter(n => !n.read).length);
        
        console.log('🔔 Final badge sayısı:', filteredNotifications.filter(n => !n.read).length);
        
      } catch (error) {
        console.error('Bildirimler yüklenirken hata:', error);
        // Hata durumunda test bildirimi göster
        const testNotification = [{
          id: 'error_test',
          title: 'Sistem Aktif ✅',
          message: 'Bildirim sistemi çalışıyor. Veri yüklenmeyi bekliyor...',
          time: new Date(),
          type: 'match',
          read: false
        }];
        setNotifications(testNotification);
        setUnreadCount(1);
      }
    };

    // Okunan ve silinmiş bildirimleri AsyncStorage'dan yükle
    const loadReadNotifications = async (email) => {
      if (!email) return;
      try {
        // Okunan bildirimler
        const readKey = `readNotifications_${email}`;
        const storedRead = await AsyncStorage.getItem(readKey);
        if (storedRead) {
          const readIds = JSON.parse(storedRead);
          setReadNotifications(new Set(readIds));
        }

        // Silinmiş bildirimler
        const clearedKey = `clearedNotifications_${email}`;
        const storedCleared = await AsyncStorage.getItem(clearedKey);
        if (storedCleared) {
          const clearedIds = JSON.parse(storedCleared);
          setClearedNotifications(new Set(clearedIds));
        }
      } catch (error) {
        console.error('Bildirim verileri yüklenemedi:', error);
      }
    };

    // Okunan bildirimleri AsyncStorage'a kaydet
    const saveReadNotifications = async (readIds) => {
      if (!currentUserEmail) return;
      try {
        const key = `readNotifications_${currentUserEmail}`;
        await AsyncStorage.setItem(key, JSON.stringify(Array.from(readIds)));
      } catch (error) {
        console.error('Okunan bildirimler kaydedilemedi:', error);
      }
    };

    // Silinmiş bildirimleri AsyncStorage'a kaydet
    const saveClearedNotifications = async (clearedIds) => {
      if (!currentUserEmail) return;
      try {
        const key = `clearedNotifications_${currentUserEmail}`;
        await AsyncStorage.setItem(key, JSON.stringify(Array.from(clearedIds)));
      } catch (error) {
        console.error('Silinmiş bildirimler kaydedilemedi:', error);
      }
    };

    const formatTime = (date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'appointment': return 'medical-services';
        case 'order': return 'shopping-cart';
        case 'event': return 'event';
        case 'match': return 'favorite';
        case 'message': return 'chat';
        case 'lost_pet': return 'pets';
        default: return 'notifications';
      }
    };

    const markAsRead = async (notificationId) => {
      // State'i güncelle
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
      
      // AsyncStorage'a kaydet
      const newReadIds = new Set([...readNotifications, notificationId]);
      setReadNotifications(newReadIds);
      await saveReadNotifications(newReadIds);
    };

    // Tüm bildirimleri tamamen sil
    const clearAllNotifications = async () => {
      const allIds = new Set(notifications.map(n => n.id));
      setClearedNotifications(prev => new Set([...prev, ...allIds]));
      await saveClearedNotifications(new Set([...clearedNotifications, ...allIds]));
      
      // Bildirimleri görüntüden tamamen kaldır
      setNotifications([]);
      setUnreadCount(0);
    };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <MaterialIcons name="menu" size={28} color="#ff6b35" />
      </TouchableOpacity>
      <Text style={styles.title}>Social Pet</Text>
      
      <TouchableOpacity 
        style={styles.notificationContainer}
        onPress={() => setNotificationModalVisible(true)}
      >
        <MaterialIcons name="notifications" size={28} color="#ff6b35" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bildirim Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bildirimler</Text>
              <View style={styles.headerButtons}>
                {notifications.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={clearAllNotifications}
                  >
                    <Text style={styles.clearButtonText}>Tümünü Temizle</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={styles.notificationsList}
              contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : null}
              renderItem={({ item: notification }) => (
                <TouchableOpacity 
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => markAsRead(notification.id)}
                >
                  <View style={styles.notificationIconContainer}>
                    <MaterialIcons 
                      name={getNotificationIcon(notification.type)} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.time)}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="notifications-none" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontFamily: 'outfit-bold',
    color: '#ff6b35',
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ff6b35',
    borderRadius: 15,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  closeButton: {
    padding: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  notificationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'outfit-regular',
    color: '#999',
  },
  unreadNotification: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  unreadTitle: {
    color: '#FF6B35',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    marginLeft: 10,
  },
  notificationsList: {
    maxHeight: '80%',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'outfit-regular',
    color: '#666',
    marginTop: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 10,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
});