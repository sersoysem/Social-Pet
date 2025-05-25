import { View, SafeAreaView, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { db } from '../../config/FireBaseConfig';
import { addDoc, doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, arrayUnion, getDocs, query as fsQuery, collection as fsCollection, where as fsWhere } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

// Kullanıcı adı ve fotoğrafı için fallback fonksiyonu
async function getUserDisplayInfo(email) {
  // Önce Users koleksiyonunda ara
  const userDoc = await getDoc(doc(db, 'Users', email));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      name: data.name || data.uname || email.split('@')[0],
      pp: data.pp || data.imageUrl || ''
    };
  }
  // Yoksa, Pets koleksiyonunda bu email'e sahip ilk peti bul
  const petsQuery = fsQuery(fsCollection(db, 'Pets'), fsWhere('email', '==', email));
  const petsSnap = await getDocs(petsQuery);
  if (!petsSnap.empty) {
    const petData = petsSnap.docs[0].data();
    return {
      name: petData.uname || petData.name || email.split('@')[0],
      pp: petData.pp || petData.imageUrl || ''
    };
  }
  // Hiçbiri yoksa
  return {
    name: email.split('@')[0],
    pp: ''
  };
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  // Kullanıcı bilgisi
  useEffect(() => {
    const getUserInfo = async () => {
      if (user?.primaryEmailAddress?.emailAddress) {
        setCurrentUserEmail(user.primaryEmailAddress.emailAddress);
        setCurrentUserName(user?.fullName || "");
        setCurrentUserAvatar(user?.imageUrl || "");
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          setCurrentUserEmail(parsed.email);
          setCurrentUserName(parsed.name || "");
          setCurrentUserAvatar(parsed.imageUrl || "");
        }
      }
    };
    getUserInfo();
  }, [user]);

  // Mesajlar listener + okuma takibi
  useEffect(() => {
    if (!params?.id || !currentUserEmail) return;

    const q = query(
      collection(db, 'Chat', params.id, 'Messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setMessages(messageData);

      // Gelen tüm mesajlardan kendi mailin seenBy'da yoksa, ekle (okundu yap)
      const unread = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.seenBy && !data.seenBy.includes(currentUserEmail);
      });
      unread.forEach(async (docSnap) => {
        await updateDoc(doc(collection(db, 'Chat', params.id, 'Messages'), docSnap.id), {
          seenBy: arrayUnion(currentUserEmail)
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [params?.id, currentUserEmail]);

  // Karşı taraf başlık
  useEffect(() => {
    if (!params?.id || !currentUserEmail) return;
    const GetUserDetails = async () => {
      const docRef = doc(db, 'Chat', params.id);
      const docSnap = await getDoc(docRef);

      const result = docSnap.data();
      const otherUser = result?.users?.filter(
        (item) => item.email !== currentUserEmail
      );
      const otherEmail = otherUser?.[0]?.email;
      const displayInfo = await getUserDisplayInfo(otherEmail);
      navigation.setOptions({
        headerTitle: displayInfo.name,
      });
    };
    GetUserDetails();
  }, [params?.id, currentUserEmail]);

  // Mesaj gönderimi — seenBy alanı otomatik!
  const onSend = async (newMessages = []) => {
    const messageToSave = {
      ...newMessages[0],
      createdAt: new Date(),
      seenBy: [currentUserEmail], // Gönderen zaten okudu!
      user: {
        _id: currentUserEmail,
        name: currentUserName,
        avatar: currentUserAvatar
      }
    };

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    await addDoc(collection(db, 'Chat', params?.id, 'Messages'), messageToSave);

    // Chat dokümanını da güncelle — Inbox için (son mesaj, zaman, okunanlar, kullanıcılar)
    const chatRef = doc(db, 'Chat', params?.id);

    // Karşı tarafın emailini bul
    const docSnap = await getDoc(chatRef);
    const result = docSnap.data();
    const otherUser = result?.users?.filter(
      (item) => item.email !== currentUserEmail
    );
    const otherEmail = otherUser?.[0]?.email;

    // Güncel kullanıcı bilgilerini çek
    const myInfo = await getUserDisplayInfo(currentUserEmail);
    const otherInfo = await getUserDisplayInfo(otherEmail);

    await updateDoc(chatRef, {
      lastMessage: messageToSave.text || '',
      lastMessageTime: messageToSave.createdAt,
      lastMessageSeenBy: [currentUserEmail], // Sadece gönderen okumuş olur
      users: [
        {
          email: currentUserEmail,
          name: myInfo.name,
          pp: myInfo.pp
        },
        {
          email: otherEmail,
          name: otherInfo.name,
          pp: otherInfo.pp
        }
      ]
    });
  };

  useEffect(() => {
    if (!params?.id || !currentUserEmail || messages.length === 0) return;
  
    // Sadece son mesajı kontrol et
    const lastMsg = messages[0];
    if (!lastMsg) return;
  
    const markLastMessageAsSeen = async () => {
      // Son mesajda kendi mailin yoksa, seenBy'a ekle
      if (!lastMsg.seenBy?.includes(currentUserEmail)) {
        await updateDoc(
          doc(db, 'Chat', params.id, 'Messages', lastMsg._id),
          { seenBy: arrayUnion(currentUserEmail) }
        );
      }
  
      // --- ÖNEMLİ KISIM! ---
      // Chat dokümanındaki lastMessageSeenBy'ya da ekle!
      const chatRef = doc(db, 'Chat', params.id);
      const chatDoc = await getDoc(chatRef);
      const seenArray = chatDoc.data()?.lastMessageSeenBy || [];
      if (!seenArray.includes(currentUserEmail)) {
        await updateDoc(chatRef, {
          lastMessageSeenBy: arrayUnion(currentUserEmail)
        });
      }
    };
  
    markLastMessageAsSeen();
  }, [messages, params?.id, currentUserEmail]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 40 }}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          showUserAvatar={true}
          user={{
            _id: currentUserEmail,
            name: currentUserName,
            avatar: currentUserAvatar,
          }}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: { backgroundColor: '#FEF3E2' },
                right: { backgroundColor: '#FF6B35' }
              }}
              textStyle={{
                left: { color: '#0E0E0E' },
                right: { color: '#FFFFFF' }
              }}
            />
          )}
          listViewProps={{
            style: { flex: 1 },
            contentContainerStyle: { 
              flexGrow: 1,
              paddingBottom: 10,
              paddingTop: 10
            },
            keyboardShouldPersistTaps: 'handled',
          }}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={{
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#e8e8e8',
                paddingHorizontal: 8,
                marginBottom: 20,
                marginTop: 10
              }}
            />
          )}
          alwaysShowSend
          scrollToBottom
          scrollToBottomComponent={() => (
            <View style={{ padding: 8 }}>
              <Ionicons name="chevron-down" size={24} color="#FF6B35" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.95,
  },
});
