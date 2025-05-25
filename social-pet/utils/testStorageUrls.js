import { normalizeStorageURL } from './StorageUtils';

/**
 * Verilen URL'leri test eder ve sonuçları rapor eder
 */
export const testStorageUrls = async (urls) => {
  console.log('🧪 Storage URL Test Başlıyor...');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n📋 Test ${i + 1}/${urls.length}:`);
    console.log(`URL: ${url}`);
    
    const result = {
      originalUrl: url,
      originalWorking: false,
      normalizedUrl: null,
      normalizedWorking: false,
      error: null
    };
    
    // Orijinal URL'i test et
    try {
      console.log('🔍 Orijinal URL test ediliyor...');
      const response = await fetch(url, { method: 'HEAD' });
      result.originalWorking = response.ok;
      console.log(`${response.ok ? '✅' : '❌'} Orijinal URL: ${response.status} ${response.statusText}`);
    } catch (error) {
      result.error = error.message;
      console.log(`❌ Orijinal URL test hatası: ${error.message}`);
    }
    
    // URL'i normalize et
    try {
      console.log('🔄 URL normalize ediliyor...');
      result.normalizedUrl = await normalizeStorageURL(url);
      
      if (result.normalizedUrl && result.normalizedUrl !== url) {
        console.log(`🔄 Normalize edildi: ${result.normalizedUrl}`);
        
        // Normalize edilmiş URL'i test et
        const normalizedResponse = await fetch(result.normalizedUrl, { method: 'HEAD' });
        result.normalizedWorking = normalizedResponse.ok;
        console.log(`${normalizedResponse.ok ? '✅' : '❌'} Normalize URL: ${normalizedResponse.status} ${normalizedResponse.statusText}`);
      } else {
        console.log('ℹ️ URL değişmedi veya null döndü');
        result.normalizedWorking = result.originalWorking;
      }
    } catch (error) {
      result.error = error.message;
      console.log(`❌ Normalize hatası: ${error.message}`);
    }
    
    results.push(result);
    console.log('-'.repeat(30));
  }
  
  // Özet rapor
  console.log('\n📊 TEST ÖZET RAPORU:');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. URL Test Sonucu:`);
    console.log(`   Orijinal: ${result.originalWorking ? '✅ ÇALIŞIYOR' : '❌ ÇALIŞMIYOR'}`);
    console.log(`   Normalize: ${result.normalizedWorking ? '✅ ÇALIŞIYOR' : '❌ ÇALIŞMIYOR'}`);
    if (result.error) {
      console.log(`   Hata: ${result.error}`);
    }
    if (result.normalizedUrl && result.normalizedUrl !== result.originalUrl) {
      console.log(`   URL Değişti: EVET`);
    }
  });
  
  const totalWorking = results.filter(r => r.normalizedWorking).length;
  console.log(`\n🎯 SONUÇ: ${totalWorking}/${results.length} URL çalışıyor`);
  
  return results;
};

/**
 * Problematik URL'leri test etmek için hazır fonksiyon
 */
export const testProblematicUrls = async () => {
  const testUrls = [
    // ✅ Çalışan direct storage URL
    'https://storage.googleapis.com/socialpet-b392b.firebasestorage.app/pets/4417f0fb-3a9d-483f-94cc-5dea06f025bc_IMG-20250428-WA0007.jpg',
    
    // ❌ Çalışmayan download URL (token problemi)
    'https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pets/1748169698045.jpg?alt=media&token=435036c3-ef90-433f-ba68-7e2d623a3133',
    
    // ✅ Çalışan download URL (loglardan)
    'https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pets%2F1746456786061.jpg?alt=media&token=3f588cc3-8452-4c59-8784-d3d619c8dc8c',
    
    // ✅ Çalışan direct storage URL (encoded)
    'https://storage.googleapis.com/socialpet-b392b.firebasestorage.app/pets/465d21e2-7bcf-46e3-b5b0-187a16a17d8b_Foto%C4%9Fraf.jpg'
  ];
  
  console.log('🧪 Test edilecek URLler:');
  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url.substring(0, 80)}...`);
  });
  
  return await testStorageUrls(testUrls);
};

export default {
  testStorageUrls,
  testProblematicUrls
}; 