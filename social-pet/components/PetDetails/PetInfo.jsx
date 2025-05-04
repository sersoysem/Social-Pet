import { View, Text, Image } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import MarkFav from '../MarkFav';

export default function PetInfo({pet}) {
  return (
    <View>
      <Image source={{uri:pet.imageUrl}} 
      style={{
        width:'100%', 
        height:400, 
        objectFit:'cover'
        }}
        />
        <View style={{
            padding:20,
            display:'flex',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center'
        }}>
            <View>
                <Text style={{
                    fontSize:30,
                    fontFamily:'outfit-bold',
                }}
                >{pet?.name}</Text>

                <Text style={{
                    fontSize:16,
                    fontFamily:'outfit-regular',
                    color:'#666'
                }}
                >{pet?.address}</Text>
            </View>
            <MarkFav pet={pet} />
        </View>
    </View>
  )
}