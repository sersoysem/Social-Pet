import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/Home/Header';
import Slider from '../../components/Home/Slider';
import PetListByCategory from '../../components/Home/PetListByCategory';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';
import { Link, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Events from '../Events';
import PetShopStack from '../petshop/PetShopStack';
import LostPets from '../lost-pets/index';
import VetIndex from '../vet/vet-index';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Social Pet</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('PetShop')}
      >
        <MaterialIcons name="pets" size={24} color="#ff6B35" />
        <Text style={styles.drawerItemText}>PetShop</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('Veteriner')}
      >
        <MaterialIcons name="medical-services" size={24} color="#ff6B35" />
        <Text style={styles.drawerItemText}>Veteriner</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('Etkinlikler')}
      >
        <MaterialIcons name="event" size={24} color="#ff6B35" />
        <Text style={styles.drawerItemText}>Etkinlikler</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('Kayıp İlanları')}
        >
        <MaterialIcons name="search" size={24} color="#ff6B35" />
        <Text style={styles.drawerItemText}>Kayıp İlanları</Text>
      </TouchableOpacity>
      
    </View>
  );
}

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
  // const { upcoming, past, loading } = useEvents(); // Artık gerek yok
  const router = useRouter();
  const scrollViewRef = useRef(null);
  
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 240,
        },
      }}
    >
      <Drawer.Screen name="HomeScreen">
        {() => (
          <>
            <ScrollView 
              ref={scrollViewRef}
              style={{ flex: 1, backgroundColor: '#fff' }} 
              contentContainerStyle={{ padding:20, paddingBottom:100, }}
            >
              {/* Header */}
              <Header />
              {/* Slider */}
              
              {/* PetList + Kategori */}
              <View style={{ flex: 1, minHeight: 400 }}>
                <PetListByCategory/>
              </View>
            </ScrollView>
            {/* Scroll to Top Button */}
            <TouchableOpacity 
              style={styles.scrollToTopButton}
              onPress={scrollToTop}
            >
              <MaterialIcons name="arrow-upward" size={24} color="white"/>
            </TouchableOpacity>
            {/* Yeni Fonksiyonlar Ekleme*/}
            <Link href={'/add-new-pet'} style={styles.addNewPetContainer}>
              <View style={styles.addNewPetContent}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="pets" size={28} color="white"/>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.addNewPetTitle}>Yeni Hayvan Ekle</Text>
                  <Text style={styles.addNewPetSubtitle}>Arkadaşlık için yeni bir dost</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={20} color="white" style={styles.arrowIcon}/>
              </View>
            </Link>
          </>
        )}
      </Drawer.Screen>
      <Drawer.Screen name="PetShop" component={PetShopStack} />
      <Drawer.Screen name="Veteriner" component={VetIndex} />
      <Drawer.Screen name="Etkinlikler" component={Events} />
      <Drawer.Screen name="Kayıp İlanları" component={LostPets}/>
      </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  addNewPetContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: '#ff7e4f',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addNewPetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  addNewPetTitle: {
    color: '#fff',
    fontFamily: 'outfit-bold',
    fontSize: 18,
    marginBottom: 2,
  },
  addNewPetSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'outfit-regular',
    fontSize: 12,
  },
  arrowIcon: {
    opacity: 0.8,
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
  drawerContainer: {
    flex: 1,
    paddingTop: 20,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerHeaderText: {
    fontSize: 24,
    fontFamily: 'outfit-bold',
    color: '#FF6B35',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: '#333',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#ff6b35',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

