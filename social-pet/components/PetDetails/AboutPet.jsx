import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'

export default function AboutPet({pet}) {
    const [readMore, setReadMore] = useState(true);
  return (
    <View style={{
        padding:20,
        }}>
      
      <Text style={{
        fontSize:20,
        fontFamily:'outfit-medium',
      }}>{pet?.name} Hakkında, </Text>

      <Text numberOfLines={readMore?3:20} style={{
        fontSize:15,
        fontFamily:'outfit-regular',
        marginTop:5
      }}>{pet?.about}</Text>

      {readMore&& 
      <Pressable onPress={()=>setReadMore(false)}>
        <Text style={{
            fontFamily:'outfit-medium',
            fontSize:15,
            color:'#ff6b35',
        }}>Daha Fazla Oku</Text>
      </Pressable>}
    </View>
  )
}