import {View, Text} from 'react-native'
import React from 'react'
import {Tabs} from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../../constants/Colors'
import { useGlobalUnread } from '../../hooks/useGlobalUnread';

// BURAYA EKLE:
import { CartProvider } from '../petshop/CartContext'; // Dizinine göre yolunu ayarla

export default function TabLayout(){
    const unreadCount = useGlobalUnread();

    return(
        <CartProvider>
          <Tabs
            screenOptions={{
                tabBarActiveTintColor:'#ff6b35'
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
              <Tabs.Screen name='discover' 
              options={{
                  title:'Keşfet',
                  headerShown:false,
                  tabBarIcon:({color})=> (
                      <Ionicons name="paw" size={24} color={color} />
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
                      tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
        </CartProvider>
    )
}
