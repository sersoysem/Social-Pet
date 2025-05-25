import { View, Text } from 'react-native'
import React from 'react'

export default function PetSubInfoCard({icon, title, value}) {
  return (
      <View style={{
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
            backgroundColor:'#FFF',
            padding:10,
            margin:5,
            borderRadius:10,
            gap:10,
            flex:1
         }}>
            <View style={{
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderRadius: 20,
            }}>
                {icon}
            </View>
            <View style={{
                flex:1
            }}>
                <Text style={{
                    fontFamily:'outfit',
                    fontSize:16,
                    color:'#666'
                }}>{title}</Text>
                <Text style={{
                    fontFamily:'outfit-medium',
                    fontSize:16,
                }}>{value}</Text>
            </View>
         </View>
  )
}