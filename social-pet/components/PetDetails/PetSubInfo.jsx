import { View, Text, Image } from 'react-native'
import React from 'react'
import PetSubInfoCard from './PetSubInfoCard'

export default function PetSubInfo({pet}) {
  return (
    <View style={{
        paddingHorizontal:2,
    }}>
      <View style={{
        display:'flex',
        flexDirection:'row',
      }}>
         <PetSubInfoCard 
         icon={require('../../assets/images/calendar.png')} 
         title='Yaş' 
         value={pet?.age + ' yaşında'}
         />
         
         <PetSubInfoCard 
         icon={require('../../assets/images/bone.png')} 
         title='Irk' 
         value={pet?.breed}
         />
      </View>


      <View style={{
        display:'flex',
        flexDirection:'row',
      }}>
         <PetSubInfoCard 
         icon={require('../../assets/images/sex.png')} 
         title='Cinsiyet' 
         value={pet?.sex}
         />
         
         <PetSubInfoCard 
         icon={require('../../assets/images/weight.png')} 
         title='Kilo' 
         value={pet?.weight+' kg'}
         />

         
      </View>
    </View>
  )
}