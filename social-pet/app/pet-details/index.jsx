import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PetInfo from '../../components/PetDetails/PetInfo';
import PetSubInfo from '../../components/PetDetails/PetSubInfo';
import AboutPet from '../../components/PetDetails/AboutPet';
import OwnerInfo from '../../components/PetDetails/OwnerInfo';
import { ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';


export default function PetDetails() {
    const pet = useLocalSearchParams();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerTransparent:true,
            headerTitle:''

        })
    }, [])

  return (

    <View>
        <ScrollView>
        {/* Pet Info (Hayvan Bilgileri) */}
            <PetInfo pet={pet}/>

        {/* Pet Properties (Hayvan Özellikleri) */}
            <PetSubInfo pet={pet}/>

        {/* About (Hayvan Açıklaması) */}
            <AboutPet pet={pet}/>

        {/* Owner Details (Sahip Bilgileri) */}
            <OwnerInfo pet={pet}/>  

            <View style={{
                height:70,
            }}>

            </View>

        </ScrollView>

        {/* Friendship Button (Arkadaş Ol Butonu) */}
        <View style={styles?.bottomContainer}>
            <TouchableOpacity style={styles.friendButton}>
                <Text style={{
                    textAlign:'center',
                    fontFamily:'outfit-medium',
                    fontSize:20,
                }}>Arkadaş Ol</Text>
            </TouchableOpacity>
            </View>    
        
    </View>
  )
}

const styles = StyleSheet.create({
    friendButton:{
        padding:15,
        backgroundColor:'#E8B20E',


    },
    bottomContainer:{
        position:'absolute',
        width:'100%',
        bottom:0,
        
    }

})

