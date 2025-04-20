import { View, Text, FlatList, Image } from 'react-native'
import React, { useEffect, useState, StyleSheet } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from './../../config/FireBaseConfig'
import  Colors  from './../../constants/Colors'


export default function Category() {
  const[CategoryList, setCategoryList]=useState([]);

  useEffect(()=>{
    GetCategories();
  },[])

/**
 * 
 * DBden Kategori Listesi
 */

  const GetCategories = async () => {
    setCategoryList([]);
    console.log("📡 Veri çekme başlatıldı");
  
    const snapshot = await getDocs(collection(db, 'Category'));
  
    if (snapshot.empty) {
      console.log("⚠️ Category koleksiyonu boş");
      return;
    }
  
    snapshot.forEach((doc) => {
      setCategoryList(CategoryList=>[...CategoryList, doc.data()])
    })
    
  }
  

  return (
    <View style={{
        marginTop:20
    }}>
      <Text style={{
        fontFamily:  "outfit-medium",
        fontSize:20

      }}
      >Kategoriler</Text>

      <FlatList 
      
      data={CategoryList}
      renderItem={({item,index})=> (
          
            <View>
              <View>
                <Image source={{uri:item?.imageUrl}}
                style={{
                    width: 40,
                    height: 40
                }}
                
                />


              </View>
            </View>

      )}  
      
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    backgroundColor:Colors.PRIMARY
  }

})