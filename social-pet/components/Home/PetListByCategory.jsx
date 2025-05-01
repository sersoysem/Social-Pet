import { View, Text, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import Category from './Category'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './../../config/FireBaseConfig';
import PetListItem from './PetListItem';
export default function PetListByCategory() {

  const [petList,setPetList]=useState([]);
  const [loader,setLoader]=useState(false);

  useEffect(()=>{
    GetPetList('Dogs');
  },[])
/** 
  *
  *@param {*} category
  */


  const GetPetList=async(category)=>{
    setLoader(true);
    setPetList([]);
    const q=query(collection(db,'Pets'),where('category','==',category));
    const querySnapshot=await getDocs(q);

    querySnapshot.forEach(doc=>{
      setPetList(petList=>[...petList,doc.data()]);
    })
    setLoader(false);
  }

  return (
    <View>
      <Category category={(value)=>GetPetList(value)}/>
      <FlatList
        data={petList}
        style={{
          marginTop:10,
        }}
        horizontal={true}
        refreshing={loader}
        onRefresh={()=>GetPetList('Dogs')}
        renderItem={({item,index})=>(
          <PetListItem pet={item}/>
        )}
      />
    </View>
  )
}