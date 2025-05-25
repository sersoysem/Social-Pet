import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Dimensions } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { normalizeStorageURL } from '../../utils/StorageUtils';

export default function Slider() {
  console.log("🔄 Slider render edildi");

  const [sliderList, setSliderList] = useState([]);

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
    
    const slidersWithNormalizedUrls = [];
    
    for (const doc of snapshot.docs) {
      const sliderData = doc.data();
      console.log("📄 Veri:", doc.id, sliderData);
      
      // URL'i normalize et
      let normalizedImageUrl = sliderData.imageUrl;
      if (sliderData.imageUrl) {
        try {
          normalizedImageUrl = await normalizeStorageURL(sliderData.imageUrl);
          console.log("✅ Slider URL normalize edildi:", { 
            original: sliderData.imageUrl, 
            normalized: normalizedImageUrl 
          });
        } catch (error) {
          console.warn("❌ Slider URL normalize hatası:", error);
        }
      }
      
      slidersWithNormalizedUrls.push({
        ...sliderData,
        imageUrl: normalizedImageUrl
      });
    }
    
    setSliderList(slidersWithNormalizedUrls);
  };

  return (
    <View style={{
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
                        onError={(error) => {
                          console.warn('⚠️ Slider Image load warning:', error.nativeEvent.error);
                          console.warn('🔄 Problematic Slider URL:', item?.imageUrl);
                        }}
                        onLoad={() => {
                          console.log('✅ Slider Image loaded successfully:', item?.imageUrl);
                        }}
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