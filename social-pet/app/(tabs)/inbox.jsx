import { View, Text, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserItem from '../../components/Inbox/UserItem';
import { setGlobalUnreadCount } from '../../hooks/useGlobalUnread';

export default function Inbox() {
  const { user } = useUser();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loader, setLoader] = useState(false);

  // Login tipi fark etmeksizin mail çek
  useEffect(() => {
    const getUserEmail = async () => {
      if (user?.primaryEmailAddress?.emailAddress) {
        setCurrentUserEmail(user.primaryEmailAddress.emailAddress);
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          setCurrentUserEmail(parsed.email);
        }
      }
    };
    getUserEmail();
  }, [user]);

  // Gerçek zamanlı chat takibi ve unread badge hesaplama
  useEffect(() => {
    if (!currentUserEmail) return;

    setLoader(true);

    const chatQuery = query(
      collection(db, 'Chat'),
      where('userIds', 'array-contains', currentUserEmail),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const chats = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // unread badge: son mesajda kendi mailin yoksa göster
        const unread = data.lastMessage &&
          Array.isArray(data.lastMessageSeenBy) &&
          !data.lastMessageSeenBy.includes(currentUserEmail);
        chats.push({
          ...data,
          docId: docSnap.id,
          unread,
        });
      });
      setUserList(chats);
      setLoader(false);
    });

    return () => unsubscribe();
  }, [currentUserEmail]);

  // Karşı kullanıcıyı filtrele, chatte sadece diğer kullanıcıyı göster
  const MapOtherUserList = () => {
    if (!currentUserEmail) return [];
    const list = [];
    
    // Sabit avatar linki
    const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pp.jpg?alt=media&token=7d56de3b-741f-4bd7-882e-9cca500a9902";
    
    userList.forEach((record) => {
      const otherUser = record.users?.filter(u => u?.email !== currentUserEmail);
      if (otherUser && otherUser.length > 0) {
        list.push({
          docId: record.docId,
          name: otherUser[0].name,
          pp: defaultAvatar,
          email: otherUser[0].email,
          lastMessage: record.lastMessage,
          lastMessageTime: record.lastMessageTime?.toDate ? record.lastMessageTime.toDate() : record.lastMessageTime,
          unread: record.unread,
        });
      }
      console.log("USERLIST BADGE STATE:", list);
    });
    return list;
  };

  useEffect(() => {
      const unread = MapOtherUserList().filter(item => item.unread).length;
      setGlobalUnreadCount(unread);
  }, [userList]);
  
  return (
    <View style={{
      padding: 20,
      marginTop: 20,
    }}>
      <Text style={{
        fontFamily: 'outfit-medium',
        fontSize: 30,
      }}>Mesajlarım</Text>

      <FlatList
        data={MapOtherUserList()}
        refreshing={loader}
        contentContainerStyle={{ paddingBottom: 50 }}
        style={{
          marginTop: 20,
        }}
        renderItem={({ item, index }) => (
          <UserItem userInfo={item} key={index} />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 50, justifyContent: 'center' }}>
            <View style={{
              height: 1,
              backgroundColor: '#E8E8E8',
              marginHorizontal: 10
            }} />
          </View>
        )}
        ListEmptyComponent={() => (
          !loader ? <Text style={{ textAlign: 'center', marginTop: 50, color: 'gray' }}>
            Hiç sohbetiniz yok.
          </Text> : null
        )}
      />
    </View>
  );
}
