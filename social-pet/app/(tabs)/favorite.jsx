import { View, Text, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Shared from '../../Shared/Shared';
import { useUser } from '@clerk/clerk-expo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import PetListItem from '../../components/Home/PetListItem';

export default function Favorite() {
  const {user} = useUser();
  const [favIds, setFavIds] = useState([]);
  const [favPetList, setFavPetList] = useState([]);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    if (user) {
      GetFavPetIds();
    }
  }, [user]);

  const GetFavPetIds = async () => {
    setLoader(true);
    try {
      const result = await Shared.GetFavList(user);
      console.log('Favorites result:', result);
      if (result?.favorites) {
        setFavIds(result.favorites);
        await GetFavPetList(result.favorites);
        setLoader(false);
      }
    } catch (error) {
      console.error('Error getting favorites:', error);
    }
  }

  const GetFavPetList = async (ids) => {
    setLoader(true);
    try {
      if (!ids || ids.length === 0) {
        setFavPetList([]);
        return;
      }

      console.log('Fetching pets for IDs:', ids);
      const q = query(collection(db, 'Pets'), where('id', 'in', ids));
      const querySnapshot = await getDocs(q);
      
      const pets = [];
      querySnapshot.forEach((doc) => {
        pets.push(doc.data());
      });
      
      console.log('Fetched pets:', pets);
      setFavPetList(pets);
      setLoader(false);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  }

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
        onRefresh={GetFavPetIds}
        refreshing={loader}
        renderItem={({item, index}) => (
          <View style={{ marginBottom: 10 }}>
            <PetListItem pet={item}/>
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}