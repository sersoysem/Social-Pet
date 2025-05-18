import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/FireBaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function EventDetail() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState(null); // 'yes' | 'no' | null

  useEffect(() => {
    navigation.setOptions({
      title: 'Etkinlik Detayı',
      headerTitleStyle: { fontFamily: 'outfit-bold', color: '#E8B20E' }
    });
  }, [navigation]);

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
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={{marginTop: 40}} size="large" color="#E8B20E" />;
  }
  if (!event) {
    return <Text style={{margin: 40, color: 'red'}}>Etkinlik bulunamadı.</Text>;
  }

  // Etkinlik tarihi geçmiş mi?
  const isPast = new Date(event.date) < new Date();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 0 }}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="calendar-star" size={32} color="#E8B20E" style={{marginRight: 10}} />
          <Text style={styles.title}>{event.title}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color="#E8B20E" style={{marginRight: 6}} />
          <Text style={styles.value}>{event.date} {event.time && `- ${event.time}`}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#E8B20E" style={{marginRight: 6}} />
          <Text style={styles.value}>{event.city} / {event.district}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="dog" size={20} color="#E8B20E" style={{marginRight: 6}} />
          <Text style={styles.value}>{event.pet_type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#E8B20E" style={{marginRight: 6}} />
          <Text style={styles.value}>{event.created_by} ({event.email})</Text>
        </View>
        <View style={styles.descBox}>
          <Text style={styles.label}>Açıklama</Text>
          <Text style={styles.desc}>{event.description}</Text>
        </View>
        {/* Katılım Butonları */}
        {!isPast && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.participateBtn, participation === 'yes' && styles.selectedBtn]}
              onPress={() => setParticipation('yes')}
            >
              <Ionicons name="checkmark-circle" size={22} color={participation === 'yes' ? '#fff' : '#2ecc71'} />
              <Text style={[styles.btnText, participation === 'yes' && {color:'#fff'}]}>Katılacağım</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.participateBtn, participation === 'no' && styles.selectedBtnNo]}
              onPress={() => setParticipation('no')}
            >
              <Ionicons name="close-circle" size={22} color={participation === 'no' ? '#fff' : '#e74c3c'} />
              <Text style={[styles.btnText, participation === 'no' && {color:'#fff'}]}>Katılmayacağım</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPast && (
          <Text style={{color:'#d72660', marginTop:18, textAlign:'center', fontFamily:'outfit-medium'}}>Bu etkinliğin tarihi geçti.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    margin: 18,
    marginTop: 30,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 24,
    color: '#E8B20E',
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#444',
    marginBottom: 2,
  },
  value: {
    fontFamily: 'outfit',
    fontSize: 15,
    color: '#222',
  },
  descBox: {
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 10,
  },
  desc: {
    fontFamily: 'outfit',
    fontSize: 15,
    color: '#444',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  participateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 2,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedBtn: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  selectedBtnNo: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  btnText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#222',
  },
}); 