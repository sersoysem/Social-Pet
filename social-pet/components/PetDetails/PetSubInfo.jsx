import { View, Text } from 'react-native'
import React from 'react'
import PetSubInfoCard from './PetSubInfoCard'
import { MaterialIcons } from '@expo/vector-icons'

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
         icon={<MaterialIcons name="cake" size={24} color="#ff6b35" />}
         title='Yaş' 
         value={pet?.age + ' yaşında'}
         />
         
         <PetSubInfoCard 
         icon={<MaterialIcons name="pets" size={24} color="#ff6b35" />}
         title='Irk' 
         value={pet?.breed}
         />
      </View>

      <View style={{
        display:'flex',
        flexDirection:'row',
      }}>
         <PetSubInfoCard 
         icon={<MaterialIcons name="wc" size={24} color="#ff6b35" />}
         title='Cinsiyet' 
         value={pet?.sex === 'Male' ? 'Erkek' : pet?.sex === 'Female' ? 'Dişi' : 'Diğer'}
         />
         
         <PetSubInfoCard 
         icon={<MaterialIcons name="monitor-weight" size={24} color="#ff6b35" />}
         title='Kilo' 
         value={pet?.weight+' kg'}
         />
      </View>
    </View>
  )
}