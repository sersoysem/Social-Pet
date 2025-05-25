import { View, Text, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import MarkFav from '../MarkFav';
import { normalizeStorageURL } from '../../utils/StorageUtils';

export default function PetInfo({pet}) {
  const [normalizedImageUrl, setNormalizedImageUrl] = useState(pet?.imageUrl);
  
  console.log('📷 PetInfo render - Orijinal URL:', pet?.imageUrl);
  console.log('📷 PetInfo render - Current normalized URL:', normalizedImageUrl);
  
  useEffect(() => {
    const normalizeImageURL = async () => {
      if (pet?.imageUrl) {
        try {
          console.log('🔄 PetInfo URL normalization başlıyor:', pet.imageUrl);
          const normalizedUrl = await normalizeStorageURL(pet.imageUrl);
          setNormalizedImageUrl(normalizedUrl);
          console.log('✅ PetInfo URL normalize tamamlandı:', {
            original: pet.imageUrl,
            normalized: normalizedUrl,
            changed: normalizedUrl !== pet.imageUrl
          });
        } catch (error) {
          console.warn('❌ PetInfo URL normalize hatası:', error);
          setNormalizedImageUrl(pet.imageUrl); // Fallback to original
        }
      }
    };
    
    normalizeImageURL();
  }, [pet?.imageUrl]);
  
  return (
    <View>
      <Image source={{uri: normalizedImageUrl}} 
      style={{
        width:'100%', 
        height:400, 
        }}
        resizeMode="cover" 
        onError={(error) => {
          console.warn('⚠️ Image load warning:', error.nativeEvent.error);
          console.warn('🔄 Problematic URL:', normalizedImageUrl);
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', normalizedImageUrl);
        }}
        />
        <View style={{
            padding:20,
            display:'flex',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center'
        }}>
            <View>
                <Text style={{
                    fontSize:30,
                    fontFamily:'outfit-bold',
                }}
                >{pet?.name}</Text>

                <Text style={{
                    fontSize:16,
                    fontFamily:'outfit-regular',
                    color:'#666'
                }}
                >{pet?.address}</Text>
            </View>
            <MarkFav pet={pet} />
        </View>
    </View>
  )
}