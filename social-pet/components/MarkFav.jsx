import { View, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import Shared from '../Shared/Shared';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MarkFav({ pet, size, color = 'black' }) {
  const { user } = useUser();
  const [favList, setFavList] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    getUserEmailAndFavList();
  }, [user]);

  useEffect(() => {
    setIsFavorite(favList.includes(pet?.id));
  }, [favList, pet]);

  const getUserEmailAndFavList = async () => {
    try {
      if (user && user?.primaryEmailAddress?.emailAddress) {
        // Google kullanıcıları
        setUserEmail(user.primaryEmailAddress.emailAddress);
        const result = await Shared.GetFavList(user.primaryEmailAddress.emailAddress);
        setFavList(Array.isArray(result?.favorites) ? result.favorites : []);
      } else {
        // E-posta/şifre ile giriş yapan kullanıcılar
        const localData = await AsyncStorage.getItem('userData');
        if (localData) {
          const parsed = JSON.parse(localData);
          setUserEmail(parsed.email);
          const result = await Shared.GetFavList(parsed.email);
          setFavList(Array.isArray(result?.favorites) ? result.favorites : []);
        }
      }
    } catch (error) {
      console.error('Favoriler alınamadı:', error);
    }
  };

  const ToggleFav = async () => {
    try {
      if (!userEmail) {
        console.warn("userEmail null, ToggleFav iptal.");
        return;
      }

      let updatedFavList;
      if (isFavorite) {
        updatedFavList = favList.filter(id => id !== pet?.id);
      } else {
        updatedFavList = [...favList, pet?.id];
      }

      await Shared.UpdateFav(userEmail, updatedFavList);
      setFavList(updatedFavList);
    } catch (error) {
      console.error('Favori güncelleme hatası:', error);
    }
  };

  return (
    <View>
      <Pressable onPress={ToggleFav}>
        <AntDesign
          name={isFavorite ? "heart" : "hearto"}
          size={size || 30}
          color={isFavorite ? "red" : color}
        />
      </Pressable>
    </View>
  );
}
