import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import Colors from '../../constants/Colors'
import { useRouter } from 'expo-router';
import MarkFav from '../MarkFav';

export default function PetListItem({pet}) {

    const router = useRouter();

  return (
    <TouchableOpacity  
    
    onPress={() => router.push({
        pathname: '/pet-details',
        params:pet
    })}
    
    style={{
        padding:10,
        marginRight:30,
        backgroundColor:'#FFF',
        borderRadius:10,
        
    }}
    >

        <View style={{
            position:'absolute',
            zIndex:10,
            right:10,
            top:10,
        }}>
            <MarkFav pet={pet} color='white' size={20}/>
        </View>

        <Image source={{uri:pet.imageUrl}}  
        style={{
            width:150,
            height:135,
            borderRadius:10,
            objectFit:'cover'
        
        }}
        />
        <Text style={{
            fontFamily:'outfit-medium',
            fontSize:20,
            color:'#000',
        }}>{pet.name}</Text>

        <View style={{
            display:'flex',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center',
            marginTop:5,
            alignItems:'center'
        }}>
           
            <Text style={{
                color:'#808080',
                fontFamily:'outfit-regular',
            }}>{pet?.breed}
            </Text>
            
            <Text style={{
                color:'#000',
                backgroundColor:'rgba(232, 178, 14, 0.57)',
                paddingHorizontal:7,
                borderRadius:10,
                fontFamily:'outfit-regular',
                fontSize:15,
            }}>{pet.age} Y
            </Text>

        </View>
    </TouchableOpacity>
  )
}