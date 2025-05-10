import { View, Text, Image } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function UserItem({userInfo}) {

      // Tarihi formatlayan yardımcı fonksiyon
  const formatTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const msgDate = new Date(date);

    const isToday = now.toDateString() === msgDate.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === msgDate.toDateString();

    if (isToday) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Dün';
    } else {
      return msgDate.toLocaleDateString('tr-TR');
    }
  };

  return (
    <Link href={`/chat?id=${userInfo.docId}`}>
      <View style={{ marginVertical: 7, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Sol kısım: Profil ve isim + mesaj */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Image
              source={{ uri: userInfo?.pp }}
              style={{ width: 40, height: 40, borderRadius: 99 }}
            />
            <View>
              <Text style={{ fontFamily: 'outfit-medium', fontSize: 16 }}>
                {userInfo?.name}
              </Text>
              {userInfo?.lastMessage && (
                <Text style={{ fontSize: 14, color: 'gray', maxWidth: 250 ,marginTop:3}} numberOfLines={1}>
                  {userInfo?.lastMessage}
                </Text>
              )}
            </View>
          </View>

          {/* Sağ üst köşe: Zaman */}
          {userInfo?.lastMessageTime && (
            <Text style={{ 
              fontSize: 12, 
              color: 'gray', 
              width: 215, 
              textAlign: 'right',
              marginRight: 5
            }}>
              {formatTime(userInfo.lastMessageTime)}
            </Text>
          )}
        </View>

        {/* Alt çizgi */}
        <View style={{ borderWidth: 1, marginTop: 15, borderColor: '#E8E8E8' }} />
      </View>
    </Link>
  );
}