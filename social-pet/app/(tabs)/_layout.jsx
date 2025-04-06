import {View, Text} from 'react-native'
import React from 'react'
import {Tabs} from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../constants/Colors'


export default function TabLayout(){
    return(
        <Tabs
        
        screenOptions={{
            tabBarActiveTintColor:Colors.PRIMARY
        }}
        
        >
            <Tabs.Screen name='home' 
            options={{
                title:'Ana Sayfa',
                headerShown:false,
                tabBarIcon:({color})=> (
                <Ionicons name="home-sharp" size={24} color={color} />
                ),
            }}
            />
            <Tabs.Screen name='favorite' 
            options={{
                title:'Favoriler',
                headerShown:false,
                tabBarIcon:({color})=> (
                    <Ionicons name="heart-sharp" size={24} color={color} />
                ),
            }}
            />
            <Tabs.Screen name='inbox' 
            options={{
                title:'Mesajlar',
                headerShown:false,
                tabBarIcon:({color})=> (
                    <Ionicons name="chatbubbles" size={24} color={color} />
                ),
            }}
            />
            <Tabs.Screen name='profile' 
            options={{
                title:'Profil',
                headerShown:false,
                tabBarIcon:({color})=> (
                    <Ionicons name="person-circle" size={24} color={color} />
                ),
            }}
            />
        </Tabs>

    )
}