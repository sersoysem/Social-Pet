import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PetInfo from '../../components/PetDetails/PetInfo';
import PetSubInfo from '../../components/PetDetails/PetSubInfo';
import AboutPet from '../../components/PetDetails/AboutPet';
import OwnerInfo from '../../components/PetDetails/OwnerInfo';
import { ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../config/FireBaseConfig';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';


export default function PetDetails() {
    
    const navigation = useNavigation();

    const { pet: petString } = useLocalSearchParams();
    console.log("Alınan petString:", petString); // ✅ BURAYA EKLE

    let pet = {};
    try {
        pet = JSON.parse(petString);
        console.log("✅ Çözümlenen PET objesi:", pet);
        console.log("📷 Pet imageUrl:", pet.imageUrl);
      } catch (err) {
        console.error("🐞 JSON.parse hatası:", err);
      }

    useEffect(() => {
        navigation.setOptions({
            headerTransparent:true,
            headerTitle:''

        })
    }, [])

    const {user}=useUser();
    const router=useRouter();

    /**
     * Kullanıcılar arasında chat oluşturma işlemi için InitiateChat fonksiyonu
     */
    
    const InitiateChat = async() => {
        const docId1=user?.primaryEmailAddress?.emailAddress+'_'+pet?.email;
        const docId2=pet?.email+'__'+user?.primaryEmailAddress?.emailAddress;
        
        const q=query(collection(db,'Chat'),where('id','in',[docId1,docId2]));
        const querySnapshot=await getDocs(q);

        querySnapshot.forEach(doc=>{
            console.log(doc.data());
            router.push({
                pathname:'/chat',
                params:{id:doc.id}
            })
        })
        if(querySnapshot.docs?.length==0){
            await setDoc(doc(db,'Chat',docId1),{
                id:docId1,
                users:[{
                    email:user?.primaryEmailAddress?.emailAddress,
                    name:user?.fullName,
                    pp:user?.imageUrl,
                },{
                    email:pet?.email,
                    name:pet?.uname,
                    imageUrl:pet?.pp,
                    
                }
            ],
            userIds:[user?.primaryEmailAddress?.emailAddress,pet?.email]

    });
    router.push({
        pathname:'/chat',
        params:{id:docId1}
    })
}
};

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
            <TouchableOpacity 
            onPress={InitiateChat}
            style={styles.friendButton}>
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

