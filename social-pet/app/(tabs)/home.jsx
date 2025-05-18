import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../../components/Home/header';
import Slider from '../../components/Home/Slider';
import PetListByCategory from '../../components/Home/PetListByCategory';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';
import { Link, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';

function useEvents() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCol = collection(db, 'Events');
        const eventSnapshot = await getDocs(eventsCol);
        const now = new Date();
        const events = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const upcomingEvents = [];
        const pastEvents = [];
        events.forEach(event => {
          const eventDate = new Date(event.date);
          if (eventDate >= now) {
            upcomingEvents.push(event);
          } else {
            pastEvents.push(event);
          }
        });
        setUpcoming(upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
        setPast(pastEvents.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        setUpcoming([]);
        setPast([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);
  return { upcoming, past, loading };
}

export default function Home() {
  const { upcoming, past, loading } = useEvents();
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding:20, paddingBottom:40 }}>
      {/* Header */}
      <Header />
      {/* Slider */}
      <Slider/>
      {/* PetList + Kategori */}
      <PetListByCategory/>
      {/* Etkinlikler */}
      <View style={{marginTop:20}}>
        <Text style={{fontFamily:'outfit-bold', fontSize:18, marginBottom:5}}>Yaklaşan Etkinlikler</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : upcoming.length === 0 ? (
          <Text style={{color:'#888'}}>Yaklaşan etkinlik yok.</Text>
        ) : (
          upcoming.map(event => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, styles.upcomingEventCard]}
              onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}
            >
              <Text style={[styles.eventTitle, styles.upcomingEventTitle]}>{event.title}</Text>
              <Text style={[styles.eventInfo, styles.upcomingEventInfo]}>{event.date} - {event.city}, {event.district}</Text>
            </TouchableOpacity>
          ))
        )}
        <Text style={{fontFamily:'outfit-bold', fontSize:18, marginTop:20, marginBottom:5}}>Geçmiş Etkinlikler</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : past.length === 0 ? (
          <Text style={{color:'#888'}}>Geçmiş etkinlik yok.</Text>
        ) : (
          past.map(event => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, styles.pastEventCard]}
              onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}
            >
              <Text style={[styles.eventTitle, styles.pastEventTitle]}>{event.title}</Text>
              <Text style={[styles.eventInfo, styles.pastEventInfo]}>{event.date} - {event.city}, {event.district}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      {/* Yeni Fonksiyonler Ekleme*/}
      <Link href={'/add-new-pet'} style={styles.addNewPetContainer}>
        <MaterialIcons name="pets" size={24} color="white" />
        <Text style={{ color:'#fff', fontFamily:'outfit-medium', fontSize:20 }}>Yeni Hayvan Ekle</Text>
      </Link>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  addNewPetContainer:{
    display:'flex',
    flexDirection:'row',
    gap:10,
    alignItems:'center',
    padding:20,
    marginTop:20,
    textAlign:'center',
    backgroundColor:'rgba(232, 178, 14, 0.84)',
    borderRadius:10,
    borderWidth:1,
    borderColor:'rgb(202, 154, 11)',
    borderRadius:15,
    borderStyle:'dashed',
    justifyContent:'center'
  },
  eventCard: {
    backgroundColor:'#fff',
    borderRadius:10,
    padding:12,
    marginVertical:5,
    shadowColor:'#000',
    shadowOpacity:0.05,
    shadowRadius:2,
    elevation:1
  },
  eventTitle: {
    fontFamily:'outfit-medium',
    fontSize:16
  },
  eventInfo: {
    color:'#888',
    fontSize:13
  },
  pastEventCard: {
    backgroundColor:'#ffe6ec', // soft pembe/kırmızı
    borderColor:'#ffb3c6',
    borderWidth:1,
  },
  pastEventTitle: {
    color:'#d72660', // koyu pembe/kırmızı
  },
  pastEventInfo: {
    color:'#b23a48',
  },
  upcomingEventCard: {
    backgroundColor:'#e6fff7', // mint yeşili
    borderColor:'#7de2c3',
    borderWidth:1,
  },
  upcomingEventTitle: {
    color:'#1abc9c',
  },
  upcomingEventInfo: {
    color:'#159c88',
  },
});

