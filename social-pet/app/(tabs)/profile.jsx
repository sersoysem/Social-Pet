import { View, Text,Image,FlatList,TouchableOpacity } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';

export default function Profile() {
  const Menu=[
    {
      id:1,
      name:'Yeni Evcil Hayvan Ekle',
      icon:'add-circle',
      path:'/add-new-pet'
    },
    {
      id:2,
      name:'Evcil Hayvanlarım',
      icon:'bookmarks',
      path:'/user-post'
    },
    {
      id:3,
      name:'Favorilerim',
      icon:'heart',
      path:'/(tabs)/favorite'
    },
    {
      id:4,
      name:'Mesajlar',
      icon:'chatbubble',
      path:'/(tabs)/inbox'
    },
    {
      id:5,
      name:'Çıkış Yap',
      icon:'exit',
      path:'logout'
    }
  ]
  const {user}= useUser();

  const router=useRouter();

  const {signOut}=useAuth();

  const onPressMenu = (menu) => {
    if (menu.path === 'logout') {
      signOut().then(() => {
        router.replace('/login'); // login klasöründeki index'e yönlendirme
      });
      return;
    }
    router.push(menu.path);
  };
  
  
  
  
  return (
    <View style={{
      padding:20,
      marginTop:20,
    }}>
      <Text style={{
        fontSize:20,
        fontFamily:'outfit-medium',
      }}>Profile</Text>


    <View style={{
      display:'flex',
      alignItems:'center',
      marginVertical:25,
    }}>
      <Image
        source={{uri:user?.imageUrl}}
        style={{
          width:100,
          height:100,
          borderRadius:99,
        }}
      />
      <Text style={{
        fontSize:20,
        fontFamily:'outfit-bold',
        marginTop:10,
      }}>{user?.fullName}</Text>
      <Text style={{
        fontFamily:'outfit',
        fontSize:14,
        color:'#64748b',
        marginTop:10,
      }}>{user?.primaryEmailAddress?.emailAddress}</Text>
    </View>

    <FlatList
      data={Menu}
      renderItem={({item,index})=>(
        <TouchableOpacity
        onPress={()=>onPressMenu(item)}
        key={index}
        style={{
          marginVertical:10,
          display:'flex',
          flexDirection:'row',
          alignItems:'center',
          gap:10,
          backgroundColor:'#fff',
          padding:10,
          borderRadius:10,
        }}
        >
          <Ionicons name={item?.icon} size={35} 
          color="#E8B20E" 
          style={{
            padding:10,
            backgroundColor:'#faeedc',
            borderRadius:10,
          }}
          />


          <Text style={{
            fontFamily:'outfit',
            fontSize:20,
          }}>{item.name}</Text>
        </TouchableOpacity>
        )}
    />

    </View>
  )
}