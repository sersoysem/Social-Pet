import { View, Text, Image } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function UserItem({userInfo}) {
  console.log("UserItem userInfo:", userInfo);

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
      <View style={{ marginVertical: 7, paddingHorizontal: 10 , width: '95%', justifyContent: 'space-between', flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          {/* Sol kısım: Profil ve isim + mesaj */}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Image
              source={{ uri: userInfo?.pp }}
              style={{ width: 40, height: 40, borderRadius: 99 }}
            />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'outfit-medium', fontSize: 16 }}>
                  {userInfo?.name}
                </Text>
                {userInfo?.unread && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#FF4C29',
                      marginLeft: 6,
                      marginTop: 2
                    }}
                  />
                )}
              </View>
              {userInfo?.lastMessage && (
                <Text style={{
                  fontSize: 14,
                  color: userInfo?.unread ? '#222' : 'gray',
                  fontWeight: userInfo?.unread ? 'bold' : 'normal',
                  marginTop: 3
                }} numberOfLines={1}>
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
