import { View, Text, FlatList, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import Category from './Category'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './../../config/FireBaseConfig';
import PetListItem from './PetListItem';

const { width } = Dimensions.get('window');
const numColumns = 2;
const tileSize = width / numColumns -15;

export default function PetListByCategory() {
  const [petList, setPetList] = useState([]);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    GetPetList('Dogs');
  }, [])

  const GetPetList = async (category) => {
    setLoader(true);
    setPetList([]);
    const q = query(collection(db, 'Pets'), where('category', '==', category));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      setPetList(petList => [...petList, doc.data()]);
    })
    setLoader(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <Category category={(value) => GetPetList(value)} />
      <FlatList
        data={petList}
        style={{
          marginTop: 10,
        }}
        numColumns={numColumns}
        refreshing={loader}
        onRefresh={() => GetPetList('Dogs')}
        renderItem={({ item, index }) => (
          <View style={{ width: tileSize, padding: 5 }}>
            <PetListItem pet={item} />
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}