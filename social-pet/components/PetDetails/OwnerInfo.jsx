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
                color:"#ff6b35",
                marginTop:5,
            }}>Ailesi</Text>
        </View>
        </View>
        <FontAwesome name="send" size={24} color="#ff6b35" />
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
        borderColor:"#ff6b35",
        backgroundColor:'#fff',
        justifyContent:'space-between',

    }
})