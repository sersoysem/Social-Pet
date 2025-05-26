import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/FireBaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

function useEvents() {
  const [upcoming, setUpcoming] = React.useState([]);
  const [past, setPast] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchEvents = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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
      console.log('✅ Events verisi güncellendi:', { 
        upcoming: upcomingEvents.length, 
        past: pastEvents.length 
      });
    } catch (e) {
      console.error('❌ Events verisi çekilirken hata:', e);
      setUpcoming([]);
      setPast([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // İlk yükleme
  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sayfa odaklandığında yenile
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Events sayfası odaklandı, veriler yenileniyor...');
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = React.useCallback(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  return { upcoming, past, loading, refreshing, onRefresh };
}

export default function Events() {
  const { upcoming, past, loading, refreshing, onRefresh } = useEvents();
  const router = useRouter();
  const navigation = useNavigation();
  
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#fff' }} 
      contentContainerStyle={{ padding:20, paddingBottom:40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#ff6b35']}
          tintColor="#ff6b35"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <MaterialIcons name="arrow-back" size={28} color="#ff6b35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Etkinlikler</Text>
        <View style={{width:28}} />
      </View>
      <TouchableOpacity style={styles.addEventButton} onPress={() => router.push('/add-event')}>
        <MaterialIcons name="add-circle" size={22} color="#fff" />
        <Text style={styles.addEventButtonText}>Etkinlik Oluştur</Text>
      </TouchableOpacity>
      <Text style={{fontFamily:'outfit-bold', fontSize:18, marginBottom:5, marginTop:15}}>Yaklaşan Etkinlikler</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 22,
    color: '#ff6b35',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b35',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 0,
  },
  addEventButtonText: {
    color: '#fff',
    fontFamily: 'outfit-bold',
    fontSize: 16,
    marginLeft: 8,

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
    backgroundColor:'#ffe6ec',
    borderColor:'#ffb3c6',
    borderWidth:1,
  },
  pastEventTitle: {
    color:'#d72660',
  },
  pastEventInfo: {
    color:'#b23a48',
  },
  upcomingEventCard: {
    backgroundColor:'#e6fff7',
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