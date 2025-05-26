import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import PetInfo from '../../components/PetDetails/PetInfo';
import PetSubInfo from '../../components/PetDetails/PetSubInfo';
import AboutPet from '../../components/PetDetails/AboutPet';
import OwnerInfo from '../../components/PetDetails/OwnerInfo';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../config/FireBaseConfig';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getChatId(email1, email2) {
  return [email1, email2].sort().join("_");
}

export default function PetDetails() {
  const navigation = useNavigation();
  const { pet: petString } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  // Hem Clerk hem email/password login için isim ve foto kaynağı!
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  useEffect(() => {
    const getUserInfo = async () => {
      // Sabit avatar linki
      const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pp.jpg?alt=media&token=7d56de3b-741f-4bd7-882e-9cca500a9902";
      
      if (user?.primaryEmailAddress?.emailAddress) {
        setCurrentUserEmail(user.primaryEmailAddress.emailAddress);
        setCurrentUserName(user?.fullName || "");
        setCurrentUserAvatar(defaultAvatar);
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          setCurrentUserEmail(parsed.email);
          setCurrentUserName(parsed.name || "");
          setCurrentUserAvatar(defaultAvatar);
        }
      }
    };
    getUserInfo();
  }, [user]);

  // Pet detayını parse et
  let pet = {};
  try {
    pet = JSON.parse(petString);
  } catch (err) {
    pet = {};
  }

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
    });
  }, []);

  // Arkadaş ol (chat başlat) butonu
  const InitiateChat = async () => {
    if (!currentUserEmail || !pet?.email) {
      alert("Kullanıcı veya karşı tarafın maili eksik!");
      return;
    }
    const chatId = getChatId(currentUserEmail, pet.email);

    // Sabit avatar linki
    const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pp.jpg?alt=media&token=7d56de3b-741f-4bd7-882e-9cca500a9902";

    // Zaten bir chat var mı kontrol et
    const q = query(collection(db, 'Chat'), where('id', '==', chatId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Chat varsa oraya yönlendir
      router.push({
        pathname: '/chat',
        params: { id: chatId }
      });
      return;
    }

    // Chat yoksa oluştur, isim ve fotoğrafı düzgün kaydet!
    await setDoc(doc(db, 'Chat', chatId), {
      id: chatId,
      users: [
        {
          email: currentUserEmail,
          name: currentUserName,
          pp: defaultAvatar
        },
        {
          email: pet?.email,
          name: pet?.uname,
          pp: defaultAvatar,
        }
      ],
      userIds: [currentUserEmail, pet?.email],
      lastMessage: "",
      lastMessageTime: null,
      lastMessageSeenBy: [] // ← Bu alan sayesinde unread badge mantığı kurulacak
    });
    router.push({
      pathname: '/chat',
      params: { id: chatId }
    });
  };

  return (
    <View>
      <ScrollView>
        <PetInfo pet={pet} />
        <PetSubInfo pet={pet} />
        <AboutPet pet={pet} />
        <OwnerInfo pet={pet} />
        <View style={{ height: 70 }} />
      </ScrollView>
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={InitiateChat} style={styles.friendButton}>
          <Text style={{ textAlign: 'center', fontFamily: 'outfit-medium', fontSize: 20, color: 'white' }}>Arkadaş Ol</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  friendButton: { padding: 15, backgroundColor: '#ff6b35' },
  bottomContainer: { position: 'absolute', width: '100%', bottom: 0 }
});
