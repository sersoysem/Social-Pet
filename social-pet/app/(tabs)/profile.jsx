import { View, Text, Image, FlatList, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
    }
  };

  const Menu = [
    {
      id: 1,
      name: 'Yeni Evcil Hayvan Ekle',
      icon: 'add-circle',
      path: '/add-new-pet'
    },
    {
      id: 2,
      name: 'Evcil Hayvanlarım',
      icon: 'bookmarks',
      path: '/user-post'
    },
    {
      id: 3,
      name: 'Favorilerim',
      icon: 'heart',
      path: '/(tabs)/favorite'
    },
    {
      id: 4,
      name: 'Mesajlar',
      icon: 'chatbubble',
      path: '/(tabs)/inbox'
    },
    {
      id: 5,
      name: 'AI Pet Asistanı',
      icon: 'chatbubble-ellipses',
      path: '/ai-assistant'
    },
    {
      id: 6,
      name: 'Çıkış Yap',
      icon: 'exit',
      path: 'logout'
    }
  ];

  const onPressMenu = async (menu) => {
    if (menu.path === 'logout') {
      try {
        // Clerk oturumunu kapat
        await signOut();
        // AsyncStorage'dan kullanıcı bilgilerini temizle
        await AsyncStorage.removeItem('userData');
        // Login sayfasına yönlendir
        router.replace('/login');
      } catch (error) {
        console.error('Çıkış yapılırken hata:', error);
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
      }
      return;
    }
    router.push(menu.path);
  };

  return (
    <View style={{
      padding: 20,
      marginTop: 20,
      flex: 1,
    }}>
      <Text style={{
        fontSize: 20,
        fontFamily: 'outfit-medium',
      }}>Profile</Text>

      <View style={{
        display: 'flex',
        alignItems: 'center',
        marginVertical: 25,
      }}>
        <Image
          source={{ uri: userData?.imageUrl || user?.imageUrl }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 99,
          }}
        />
        <Text style={{
          fontSize: 20,
          fontFamily: 'outfit-bold',
          marginTop: 10,
        }}>{userData?.name || user?.fullName}</Text>
        <Text style={{
          fontFamily: 'outfit',
          fontSize: 14,
          color: '#64748b',
          marginTop: 10,
        }}>{userData?.email || user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <FlatList
        data={Menu}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => onPressMenu(item)}
            key={index}
            style={{
              marginVertical: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: item.name === 'Çıkış Yap' ? '#fff1f1' : '#fff',
              padding: 10,
              borderRadius: 10,
              borderWidth: item.name === 'Çıkış Yap' ? 1 : 0,
              borderColor: '#ff4d4d',
            }}
          >
            <Ionicons
              name={item?.icon}
              size={35}
              color={item.name === 'Çıkış Yap' ? '#ff4d4d' : '#E8B20E'}
              style={{
                padding: 10,
                backgroundColor: item.name === 'Çıkış Yap' ? '#ffe6e6' : '#faeedc',
                borderRadius: 10,
              }}
            />

            <Text style={{
              fontFamily: 'outfit',
              fontSize: 20,
              color: item.name === 'Çıkış Yap' ? '#ff4d4d' : '#000',
            }}>{item.name}</Text>
          </TouchableOpacity>
        )}
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}