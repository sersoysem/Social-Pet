import { View, Text, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Shared from '../../Shared/Shared';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import PetListItem from '../../components/Home/PetListItem';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Favorite() {
  const { user: clerkUser } = useUser();
  const [favIds, setFavIds] = useState([]);
  const [favPetList, setFavPetList] = useState([]);
  const [loader, setLoader] = useState(false);
  const [favList, setFavList] = useState([]);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        // Önce Clerk'ten email'i kontrol et
        if (clerkUser?.primaryEmailAddress?.emailAddress) {
          console.log("Clerk email bulundu:", clerkUser.primaryEmailAddress.emailAddress);
          setUserEmail(clerkUser.primaryEmailAddress.emailAddress);
          return;
        }

        // Clerk email yoksa AsyncStorage'dan kontrol et
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log("AsyncStorage email bulundu:", parsed.email);
          if (parsed.email) {
            setUserEmail(parsed.email);
            return;
          }
        }
      } catch (error) {
        console.error("Email alma hatası:", error);
      }
    };

    getUserEmail();
  }, [clerkUser]);

  useEffect(() => {
    if (userEmail) {
      console.log("Favoriler için kullanılacak email:", userEmail);
      GetFavPetIds(userEmail);
    }
  }, [userEmail]);

  const GetFavPetIds = async (email) => {
    setLoader(true);
    try {
      console.log("GetFavPetIds çağrıldı, email:", email);
      const result = await Shared.GetFavList(email);
      console.log("GetFavList sonucu:", result);
      const favorites = Array.isArray(result?.favorites) ? result.favorites : [];
      setFavIds(favorites);
      setFavList(favorites);
      await GetFavPetList(favorites);
    } catch (error) {
      console.error('Error getting favorites:', error);
      setFavIds([]);
      setFavList([]);
    } finally {
      setLoader(false);
    }
  };

  const GetFavPetList = async (ids) => {
    setLoader(true);
    try {
      if (!ids || ids.length === 0) {
        setFavPetList([]);
        return;
      }
      const q = query(collection(db, 'Pets'), where('id', 'in', ids));
      const querySnapshot = await getDocs(q);

      const pets = [];
      querySnapshot.forEach((doc) => {
        pets.push(doc.data());
      });

      setFavPetList(pets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoader(false);
    }
  };

  const ToggleFav = async (petId) => {
    try {
      if (!userEmail) {
        console.warn("Email boş! ToggleFav iptal.");
        return;
      }

      const currentFavList = Array.isArray(favList) ? favList : [];
      let updatedFavList;

      if (currentFavList.includes(petId)) {
        updatedFavList = currentFavList.filter(id => id !== petId);
      } else {
        updatedFavList = [...currentFavList, petId];
      }

      await Shared.UpdateFav(userEmail, updatedFavList);
      setFavList(updatedFavList);
    } catch (error) {
      console.error('Favori güncelleme hatası:', error);
    }
  };

  const isFavorite = (petId) => favList && favList.includes(petId);

  return (
    <View style={{
      padding: 20,
      marginTop: 20,
      flex: 1
    }}>
      <Text style={{
        fontSize: 25,
        fontFamily: 'outfit-medium',
        marginBottom: 20
      }}>Favorilerim</Text>

      <FlatList
        data={favPetList}
        numColumns={2}
        onRefresh={() => userEmail && GetFavPetIds(userEmail)}
        refreshing={loader}
        renderItem={({item}) => (
          <View style={{ marginBottom: 10 }}>
            <PetListItem
              pet={item}
              isFavorite={isFavorite(item.id)}
              onToggleFav={() => ToggleFav(item.id)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
