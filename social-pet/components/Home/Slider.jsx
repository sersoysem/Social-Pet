import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Dimensions } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';

export default function Slider() {
  console.log("🔄 Slider render edildi");

  const [sliderList, setSliderList]=useState([]);

  useEffect(() => {
    console.log("✅ useEffect çalıştı");
    GetSliders();
  }, []);

  const GetSliders = async () => {
    console.log("📡 Firebase sorgusu başladı");
    const snapshot = await getDocs(collection(db, 'Sliders'));
    if (snapshot.empty) {
      console.log("⚠️ Koleksiyon boş");
      return;
    }
    snapshot.forEach((doc) => {
      console.log("📄 Veri:", doc.id, doc.data());
      setSliderList(sliderList=>[...sliderList, doc.data()])
    });
  };

  return (
    <View  style={{
        marginTop:15
    }}>
        <FlatList 
            data={sliderList}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index})=>(
                <View>
                    <Image
                        source={{uri:item?.imageUrl}}
                        style={styles?.sliderImage}
                    />
                </View>
            )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
    sliderImage:{
        width:Dimensions.get('screen').width*0.9,
        height:160,
        borderRadius:15,
        marginRight:15
    }
})