import { View, Text, Image } from 'react-native'
import React from 'react'
import { Colors } from '../../constants/Colors'
import { StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function OwnerInfo({pet}) {
    return (
    <View style={styles.container}>
        <View style={{
            display:'flex',
            flexDirection:'row',
            gap:20,
        }}>
      <Image source={{uri:pet?.pp}} 
      style={{
        width:55, 
        height:55, 
        borderRadius:99
        }}
        />
        <View>
            <Text style={{
                fontFamily:'outfit-medium',
                fontSize:20,
            }}
            >{pet?.uname}</Text>
            <Text style={{
                fontFamily:'outfit',
                fontSize:16,
                color:"#E8B20E",
                marginTop:5,
            }}>Ailesi</Text>
        </View>
        </View>
        <FontAwesome name="send" size={24} color="#E8B20E" />
    </View>
  )
}
const styles = StyleSheet.create({
    container:{
        marginHorizontal:20,
        paddingHorizontal:20,
        flexDirection:'row',
        alignItems:'center',
        gap:20,
        borderWidth:1,
        borderRadius:15,
        padding:20,
        borderColor:"#E8B20E",
        backgroundColor:'#fff',
        justifyContent:'space-between',

    }
})