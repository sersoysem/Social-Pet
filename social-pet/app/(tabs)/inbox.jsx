import { View, Text, FlatList } from 'react-native'
import React from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import UserItem from '../../components/Inbox/UserItem';
export default function Inbox() {

  const {user}=useUser();
  const [userList,setUserList]=useState([]);
  const [loader,setLoader]=useState(false);
  useEffect(()=>{
    user&&GetUserList();
  },[user]);


  //Kullanıcı listesini emaile göre alma

  const GetUserList = async () => {
    setLoader(true);
    setUserList([]);
  
    const q = query(
      collection(db, 'Chat'),
      where('userIds', 'array-contains', user?.primaryEmailAddress?.emailAddress)
    );
    const querySnapshot = await getDocs(q);
  
    const validChats = [];
  
    for (const docSnap of querySnapshot.docs) {
      const messagesRef = collection(db, 'Chat', docSnap.id, 'Messages');
      const messagesSnapshot = await getDocs(messagesRef);
  
      // Eğer en az bir mesaj varsa bu sohbeti listeye ekle
      if (!messagesSnapshot.empty) {
        const data = docSnap.data();
        const lastMessageData = messagesSnapshot.docs[0].data();
        validChats.push({ 
          ...data, 
          docId: docSnap.id,
          lastMessage: lastMessageData.text,
          lastMessageTime: lastMessageData.createdAt?.toDate?.()
        
        });
      }
    }
  
    setUserList(validChats);
    setLoader(false);
  };
  

  //Geri kalan kullanıcıları filtreleme
  const MapOtherUserList = () => {
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
  const list = [];

  userList.forEach((record) => {
    // Kendi emailini çıkart
    const otherUser = record.users?.filter(u => u?.email !== currentUserEmail);

    if (otherUser && otherUser.length > 0) {
      list.push({
        docId: record.docId,         // Chat döküman ID'si
        name: otherUser[0].name,     // Karşı tarafın adı
        pp: otherUser[0].pp || otherUser[0].imageUrl, // pp veya imageUrl varsa
        email: otherUser[0].email, 
        lastMessage: record.lastMessage,
        lastMessageTime: record.lastMessageTime, // Karşı tarafın maili
      });
    }
  });


  return list;
};

const formatTime = (date) => {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Dün';
  } else {
    return date.toLocaleDateString('tr-TR');
  }
};





  return (
    <View style={{
      padding:20,
      marginTop:20,
    }}>
      <Text style={{
        fontFamily:'outfit-medium',
        fontSize:30,
      }}>Mesajlarım</Text>

      <FlatList
        data={MapOtherUserList()}
        refreshing={loader}
        contentContainerStyle={{ paddingBottom: 50 }}
        onRefresh={GetUserList}
        style={{
          marginTop:20,
        }}
        renderItem={({item,index})=>(
          <UserItem userInfo={item} key={index}/>
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
      />
    </View>
  );
}