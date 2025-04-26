import { View, Text } from 'react-native'
import React from 'react'
import Category from './Category'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './../../config/FireBaseConfig';

export default function PetListByCategory() {

const GetPetList=async(Category)=>{
  const q=query(collection(db,'Pets'),where('category','==',Category.trim()));
  const querySnapShot=await getDocs(q);

  querySnapShot.forEach(doc=>{
    console.log(doc.data());
  })

}

  return (
    <View>
      <Category Category={(value)=>GetPetList(value)}/>
    </View>
  )
}