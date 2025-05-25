import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/FireBaseConfig';
import { normalizeStorageURL } from '../utils/StorageUtils';

/**
 * Pets koleksiyonundaki tum bozuk imageUrl'leri duzeltir
 */
export const fixPetsImageUrls = async () => {
  try {
    console.log('🔄 Pets koleksiyonundaki URL\'leri duzeltiliyor...');
    
    const petsCollection = collection(db, 'Pets');
    const petsSnapshot = await getDocs(petsCollection);
    
    let fixedCount = 0;
    let totalCount = petsSnapshot.size;
    
    for (const petDoc of petsSnapshot.docs) {
      const petData = petDoc.data();
      const petId = petDoc.id;
      
      try {
        // imageUrl'i duzelt
        if (petData.imageUrl) {
          const normalizedImageUrl = await normalizeStorageURL(petData.imageUrl);
          
          if (normalizedImageUrl !== petData.imageUrl) {
            await updateDoc(doc(db, 'Pets', petId), {
              imageUrl: normalizedImageUrl
            });
            
            console.log(`✅ Pet ${petId} URL duzeltildi:`, {
              old: petData.imageUrl,
              new: normalizedImageUrl
            });
            fixedCount++;
          }
        }
        
        // Vaccination card URL'ini duzelt
        if (petData.vaccinationCardUrl) {
          const normalizedVaccinationUrl = await normalizeStorageURL(petData.vaccinationCardUrl);
          
          if (normalizedVaccinationUrl !== petData.vaccinationCardUrl) {
            await updateDoc(doc(db, 'Pets', petId), {
              vaccinationCardUrl: normalizedVaccinationUrl
            });
          }
        }
        
        // Veterinary report URL'ini duzelt
        if (petData.veterinaryReportUrl) {
          const normalizedVeterinaryUrl = await normalizeStorageURL(petData.veterinaryReportUrl);
          
          if (normalizedVeterinaryUrl !== petData.veterinaryReportUrl) {
            await updateDoc(doc(db, 'Pets', petId), {
              veterinaryReportUrl: normalizedVeterinaryUrl
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Pet ${petId} URL duzeltme hatasi:`, error);
      }
    }
    
    console.log(`🎉 Islem tamamlandi! ${fixedCount}/${totalCount} URL duzeltildi.`);
    return { fixedCount, totalCount };
    
  } catch (error) {
    console.error('❌ Pets URL duzeltme islemi basarisiz:', error);
    throw error;
  }
};

/**
 * LostPets koleksiyonundaki tum bozuk image_url'leri duzeltir
 */
export const fixLostPetsImageUrls = async () => {
  try {
    console.log('🔄 LostPets koleksiyonundaki URL\'leri duzeltiliyor...');
    
    const lostPetsCollection = collection(db, 'LostPets');
    const lostPetsSnapshot = await getDocs(lostPetsCollection);
    
    let fixedCount = 0;
    let totalCount = lostPetsSnapshot.size;
    
    for (const petDoc of lostPetsSnapshot.docs) {
      const petData = petDoc.data();
      const petId = petDoc.id;
      
      try {
        if (petData.image_url) {
          const normalizedImageUrl = await normalizeStorageURL(petData.image_url);
          
          if (normalizedImageUrl !== petData.image_url) {
            await updateDoc(doc(db, 'LostPets', petId), {
              image_url: normalizedImageUrl
            });
            
            console.log(`✅ LostPet ${petId} URL duzeltildi:`, {
              old: petData.image_url,
              new: normalizedImageUrl
            });
            fixedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ LostPet ${petId} URL duzeltme hatasi:`, error);
      }
    }
    
    console.log(`🎉 LostPets islemi tamamlandi! ${fixedCount}/${totalCount} URL duzeltildi.`);
    return { fixedCount, totalCount };
    
  } catch (error) {
    console.error('❌ LostPets URL duzeltme islemi basarisiz:', error);
    throw error;
  }
};

/**
 * Sliders koleksiyonundaki tum bozuk imageUrl'leri duzeltir
 */
export const fixSlidersImageUrls = async () => {
  try {
    console.log('🔄 Sliders koleksiyonundaki URL\'leri duzeltiliyor...');
    
    const slidersCollection = collection(db, 'Sliders');
    const slidersSnapshot = await getDocs(slidersCollection);
    
    let fixedCount = 0;
    let totalCount = slidersSnapshot.size;
    
    for (const sliderDoc of slidersSnapshot.docs) {
      const sliderData = sliderDoc.data();
      const sliderId = sliderDoc.id;
      
      try {
        if (sliderData.imageUrl) {
          const normalizedImageUrl = await normalizeStorageURL(sliderData.imageUrl);
          
          if (normalizedImageUrl !== sliderData.imageUrl) {
            await updateDoc(doc(db, 'Sliders', sliderId), {
              imageUrl: normalizedImageUrl
            });
            
            console.log(`✅ Slider ${sliderId} URL duzeltildi:`, {
              old: sliderData.imageUrl,
              new: normalizedImageUrl
            });
            fixedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Slider ${sliderId} URL duzeltme hatasi:`, error);
      }
    }
    
    console.log(`🎉 Sliders islemi tamamlandi! ${fixedCount}/${totalCount} URL duzeltildi.`);
    return { fixedCount, totalCount };
    
  } catch (error) {
    console.error('❌ Sliders URL duzeltme islemi basarisiz:', error);
    throw error;
  }
};

/**
 * Tum koleksiyonlardaki Storage URL'lerini duzeltir
 */
export const fixAllStorageUrls = async () => {
  console.log('🚀 Tum Firebase Storage URL\'leri duzeltiliyor...');
  
  try {
    const petsResult = await fixPetsImageUrls();
    const lostPetsResult = await fixLostPetsImageUrls();
    const slidersResult = await fixSlidersImageUrls();
    
    const totalFixed = petsResult.fixedCount + lostPetsResult.fixedCount + slidersResult.fixedCount;
    const totalProcessed = petsResult.totalCount + lostPetsResult.totalCount + slidersResult.totalCount;
    
    console.log(`🎉 Tum islemler tamamlandi! Toplam ${totalFixed}/${totalProcessed} URL duzeltildi.`);
    
    return {
      pets: petsResult,
      lostPets: lostPetsResult,
      sliders: slidersResult,
      total: { fixedCount: totalFixed, totalCount: totalProcessed }
    };
    
  } catch (error) {
    console.error('❌ Storage URL duzeltme islemi genel hatasi:', error);
    throw error;
  }
};

export default {
  fixPetsImageUrls,
  fixLostPetsImageUrls,
  fixSlidersImageUrls,
  fixAllStorageUrls
}; 