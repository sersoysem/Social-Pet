import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/FireBaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo'; // Kullanıcıyı almak için
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventDetail() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState(null); // 'yes' | 'no' | null
  const [joining, setJoining] = useState(false);
  
  // Current user info state
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: 'Etkinlik Detayı',
      headerTitleStyle: { fontFamily: 'outfit-bold', color: '#ff6b35' }
    });
  }, [navigation]);

  // Get user info from Clerk or AsyncStorage
  useEffect(() => {
    const getUserInfo = async () => {
      let email = '';
      let name = '';
      
      if (user?.primaryEmailAddress?.emailAddress) {
        // Clerk user (Google login)
        email = user.primaryEmailAddress.emailAddress;
        name = user?.fullName || "";
        console.log('👤 Event-detail Clerk kullanıcısı tespit edildi:', { email, name });
      } else {
        // AsyncStorage user (email/password login)
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsed = JSON.parse(userData);
            email = parsed.email || '';
            name = parsed.name || "";
            console.log('💾 Event-detail AsyncStorage kullanıcısı tespit edildi:', { email, name });
          }
        } catch (error) {
          console.error('❌ Event-detail AsyncStorage kullanıcı bilgisi alınırken hata:', error);
        }
      }
      
      setCurrentUserEmail(email);
      setCurrentUserName(name);
      
      console.log('✅ Event-detail final kullanıcı bilgileri:', { email, name });
    };
    
    getUserInfo();
  }, [user]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'Events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          setEvent(null);
        }
      } catch (e) {
        setEvent(null);
      }
      setLoading(false);
    };
    if (id) fetchEvent();
  }, [id, joining]);

  if (loading) {
    return <ActivityIndicator style={{marginTop: 40}} size="large" color="#ff6b35" />;
  }
  if (!event) {
    return <Text style={{margin: 40, color: 'red'}}>Etkinlik bulunamadı.</Text>;
  }

  // Katılımcı sayısı ve kontenjan
  const participants = Array.isArray(event.participants) ? event.participants : [];
  const maxParticipants = event.capacity || null;
  const isFull = maxParticipants ? participants.length >= maxParticipants : false;
  const alreadyJoined = currentUserEmail && participants.includes(currentUserEmail);

  // Etkinlik tarihi geçmiş mi?
  const isPast = new Date(event.date) < new Date();

  // Oluşturan kişi adı/soyadı gösterimi
  let creatorDisplay = event.created_by;
  if (event.created_by === currentUserEmail && currentUserName) {
    creatorDisplay = currentUserName;
  }

  // Katılacağım butonuna basınca
  const handleJoin = async () => {
    if (!currentUserEmail) {
      Alert.alert('Giriş gerekli', 'Etkinliğe katılmak için giriş yapmalısınız.');
      return;
    }
    if (alreadyJoined) {
      Alert.alert('Zaten katıldınız', 'Bu etkinliğe zaten katıldınız.');
      return;
    }
    if (isFull) {
      Alert.alert('Kontenjan dolu', 'Bu etkinliğin kontenjanı dolmuştur.');
      return;
    }
    setJoining(true);
    try {
      const docRef = doc(db, 'Events', id);
      await updateDoc(docRef, {
        participants: arrayUnion(currentUserEmail)
      });
      setParticipation('yes');
    } catch (e) {
      Alert.alert('Hata', 'Katılım sırasında bir hata oluştu.');
    }
    setJoining(false);
  };

  // Katılmayacağım butonuna basınca
  const handleLeave = async () => {
    if (!currentUserEmail) {
      Alert.alert('Giriş gerekli', 'Bu işlem için giriş yapmalısınız.');
      return;
    }
    if (!alreadyJoined) {
      Alert.alert('Katılımcı değilsiniz', 'Zaten bu etkinlikte katılımcı değilsiniz.');
      return;
    }
    setJoining(true);
    try {
      const docRef = doc(db, 'Events', id);
      await updateDoc(docRef, {
        participants: arrayRemove(currentUserEmail)
      });
      setParticipation('no');
    } catch (e) {
      Alert.alert('Hata', 'Çıkış sırasında bir hata oluştu.');
    }
    setJoining(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }} contentContainerStyle={{ padding: 0 }}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="calendar-star" size={36} color="#ff6b35" style={styles.headerIcon} />
            <Text style={styles.title}>{event.title}</Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeBox}>
              <Ionicons name="calendar" size={20} color="#ff6b35" style={styles.icon} />
              <Text style={styles.dateTimeText}>{event.date}</Text>
            </View>
            {event.time && (
              <View style={styles.dateTimeBox}>
                <Ionicons name="time" size={20} color="#ff6b35" style={styles.icon} />
                <Text style={styles.dateTimeText}>{event.time}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Ionicons name="location" size={22} color="#ff6b35" style={styles.icon} />
            <Text style={styles.infoText}>{event.city} / {event.district}</Text>
          </View>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="dog" size={22} color="#ff6b35" style={styles.icon} />
            <Text style={styles.infoText}>{event.pet_type}</Text>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="person" size={22} color="#ff6b35" style={styles.icon} />
            <Text style={styles.infoText}>{creatorDisplay}</Text>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="people" size={22} color="#ff6b35" style={styles.icon} />
            <Text style={styles.infoText}>
              Katılımcı: {participants.length}
              {maxParticipants && ` / ${maxParticipants}`}
              {isFull && ' (Kontenjan dolu)'}
            </Text>
          </View>
        </View>

        <View style={styles.descBox}>
          <Text style={styles.descTitle}>Etkinlik Açıklaması</Text>
          <Text style={styles.desc}>{event.description}</Text>
        </View>

        {!isPast && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.participateBtn, (participation === 'yes' || alreadyJoined) && styles.selectedBtn, (isFull || alreadyJoined) && styles.disabledBtn]}
              onPress={handleJoin}
              disabled={isFull || alreadyJoined || joining}
            >
              <Ionicons name="checkmark-circle" size={24} color={(participation === 'yes' || alreadyJoined) ? '#fff' : '#2ecc71'} />
              <Text style={[styles.btnText, (participation === 'yes' || alreadyJoined) && styles.selectedBtnText]}>
                {alreadyJoined ? 'Katıldınız' : 'Katılacağım'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.participateBtn, (participation === 'no' || !alreadyJoined) && styles.selectedBtnNo, (!alreadyJoined) && styles.disabledBtn]}
              onPress={handleLeave}
              disabled={!alreadyJoined || joining}
            >
              <Ionicons name="close-circle" size={24} color={(participation === 'no' && alreadyJoined) ? '#fff' : '#e74c3c'} />
              <Text style={[styles.btnText, (participation === 'no' && alreadyJoined) && styles.selectedBtnText]}>
                Katılmayacağım
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isPast && (
          <View style={styles.pastEventContainer}>
            <Text style={styles.pastEventText}>Bu etkinliğin tarihi geçti.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 26,
    color: '#ff6b35',
    flexShrink: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateTimeText: {
    fontFamily: 'outfit-medium',
    fontSize: 15,
    color: '#ff6b35',
    marginLeft: 6,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#2c3e50',
  },
  descBox: {
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  descTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 8,
  },
  desc: {
    fontFamily: 'outfit',
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  participateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedBtn: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  selectedBtnNo: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedBtnText: {
    color: '#fff',
  },
  pastEventContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pastEventText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#e74c3c',
  },
}); 