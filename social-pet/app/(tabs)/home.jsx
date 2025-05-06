import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import Header from '../../components/Home/Header';
import Slider from '../../components/Home/Slider';
import PetListByCategory from '../../components/Home/PetListByCategory';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={{
      
      padding:20, marginTop:20
      
      }}>

      {/* Header */}
        <Header />

      {/* Slider */}
        <Slider/>

      {/* PetList + Kategori */}
        <PetListByCategory/>

      {/* Hayvan Listesi */}


      {/* Yeni Fonksiyonler Ekleme*/}
      <Link href={'/add-new-pet'}
      style={styles.addNewPetContainer}>
        <MaterialIcons name="pets" size={24} color="white" />
        <Text style={{
          color:'#fff',
          fontFamily:'outfit-medium',
          fontSize:20
        }}>Yeni Hayvan Ekle</Text>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  addNewPetContainer:{
    display:'flex',
        flexDirection:'row',
        gap:10,
        alignItems:'center',
        padding:20,
        marginTop:20,
        textAlign:'center',
        backgroundColor:'rgba(232, 178, 14, 0.84)',
        borderRadius:10,
        borderWidth:1,
        borderColor:'rgb(202, 154, 11)',
        borderRadius:15,
        borderStyle:'dashed',
        justifyContent:'center'
  }
});

