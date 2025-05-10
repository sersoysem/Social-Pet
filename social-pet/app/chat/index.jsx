import { View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { db } from '../../config/FireBaseConfig';
import { addDoc, doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { GiftedChat } from 'react-native-gifted-chat';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    GetUserDetails();

    const q = query(
      collection(db, 'Chat', params?.id, 'Messages'),
      orderBy('createdAt', 'desc') // Mesajları en son gönderilen en başta olacak şekilde sırala
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(), // Firestore Timestamp düzeltmesi
      }));
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, []);

  const GetUserDetails = async () => {
    const docRef = doc(db, 'Chat', params?.id);
    const docSnap = await getDoc(docRef);

    const result = docSnap.data();
    console.log("Chat document data:", result);

    const otherUser = result?.users?.filter(
      (item) => item.email !== user?.primaryEmailAddress?.emailAddress
    );

    console.log("Other user:", otherUser);

    navigation.setOptions({
      headerTitle: otherUser?.[0]?.name || 'Sohbet',
    });
  };

  const onSend = async (newMessages = []) => {
    const messageToSave = {
      ...newMessages[0],
      createdAt: new Date(), // Firestore için doğru tarih formatı
    };

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    await addDoc(collection(db, 'Chat', params?.id, 'Messages'), messageToSave);
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      showUserAvatar={true}
      user={{
        _id: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        avatar: user?.imageUrl, // Clerk avatar alanı
      }}
    />
  );
}
