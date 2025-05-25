import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from '../config/FireBaseConfig';

/**
 * Firebase Storage URL'ini normalize eder
 * @param {string} url - Normalize edilecek URL
 * @returns {Promise<string>} - Düzeltilmiş public access URL
 */
export const normalizeStorageURL = async (url) => {
  if (!url) return null;
  
  try {
    console.log('🔄 URL normalize başlıyor:', url);
    
    // URL tipini doğru bir şekilde belirle
    const isDirectStorageURL = url.includes('storage.googleapis.com') && !url.includes('/v0/b/') && !url.includes('alt=media');
    const isDownloadURL = url.includes('firebasestorage.googleapis.com') && url.includes('/v0/b/') && url.includes('alt=media') && url.includes('token=');
    
    console.log('🔍 URL Tipi:', {
      isDirectStorageURL,
      isDownloadURL,
      url: url.substring(0, 100) + '...'
    });
    
    // Direct storage URL'ini test et
    if (isDirectStorageURL) {
      console.log('📋 Direct storage URL tespit edildi');
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Direct storage URL çalışıyor:', url);
          return url;
        } else {
          console.warn('⚠️ Direct storage URL çalışmıyor, download URL deneniyor...');
        }
      } catch (e) {
        console.warn('⚠️ Direct storage URL test hatası:', e.message);
      }
    }
    
    // Download URL'ini test et
    if (isDownloadURL) {
      console.log('📋 Download URL tespit edildi, test ediliyor...');
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Download URL çalışıyor:', url);
          return url;
        } else {
          console.warn('⚠️ Download URL token geçersiz, yeniden oluşturuluyor...');
        }
      } catch (e) {
        console.warn('⚠️ Download URL test hatası:', e.message);
      }
    }
    
    // URL'den file path'i doğru şekilde çıkar
    let filePath = '';
    
    if (isDirectStorageURL) {
      // Format: https://storage.googleapis.com/socialpet-b392b.firebasestorage.app/pets/filename
      const parts = url.split('socialpet-b392b.firebasestorage.app/');
      if (parts.length > 1) {
        filePath = parts[1];
      }
    } else if (isDownloadURL) {
      // Format: https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pets%2Ffilename?alt=media&token=xxx
      try {
        const urlObj = new URL(url);
        const pathPart = urlObj.pathname.split('/o/')[1];
        if (pathPart) {
          // URL decode yapıp query parametrelerini kaldır
          const decodedPath = decodeURIComponent(pathPart.split('?')[0]);
          filePath = decodedPath;
        }
      } catch (urlError) {
        console.error('❌ URL parsing hatası:', urlError);
      }
    } else {
      // Diğer URL formatları için genel parsing
      console.log('🔍 Bilinmeyen URL formatı, genel parsing deneniyor...');
      if (url.includes('socialpet-b392b.firebasestorage.app/')) {
        const parts = url.split('socialpet-b392b.firebasestorage.app/');
        if (parts.length > 1) {
          filePath = parts[1].split('?')[0]; // Query parametrelerini kaldır
        }
      }
    }
    
    if (!filePath) {
      console.warn('⚠️ Storage URL path bulunamadı:', url);
      return url; // Orijinal URL'i döndür
    }
    
    console.log('📁 Çıkarılan file path:', filePath);
    
    // Storage reference oluştur
    const storageRef = ref(storage, filePath);
    
    // Önce direct storage URL'i deneyelim
    const directUrl = `https://storage.googleapis.com/socialpet-b392b.firebasestorage.app/${filePath}`;
    console.log('🧪 Direct URL test ediliyor:', directUrl);
    
    try {
      const directResponse = await fetch(directUrl, { method: 'HEAD' });
      if (directResponse.ok) {
        console.log('✅ Direct URL çalışıyor, kullanılıyor:', directUrl);
        return directUrl;
      } else {
        console.log('⚠️ Direct URL çalışmıyor, download URL deneniyor...');
      }
    } catch (directError) {
      console.log('⚠️ Direct URL test hatası, download URL deneniyor...');
    }
    
    // Direct URL çalışmazsa download URL oluştur
    let newDownloadURL = null;
    try {
      newDownloadURL = await getDownloadURL(storageRef);
      console.log('🔄 Yeni download URL oluşturuldu:', newDownloadURL);
      
      // Yeni URL'i test et
      const testResponse = await fetch(newDownloadURL, { method: 'HEAD' });
      if (testResponse.ok) {
        console.log('✅ Yeni download URL çalışıyor:', newDownloadURL);
        return newDownloadURL;
      } else {
        console.error('❌ Yeni download URL da çalışmıyor');
      }
    } catch (downloadError) {
      console.error('❌ Download URL oluşturma hatası:', downloadError);
    }
    
    console.log('✅ Storage URL düzeltildi:', { old: url, new: newDownloadURL || url });
    return newDownloadURL || url;
    
  } catch (error) {
    console.error('❌ Storage URL normalize hatası:', error);
    return url; // Hata durumunda orijinal URL'i döndür
  }
};

/**
 * Resim yükleme ve URL oluşturma
 * @param {string} imageUri - Local image URI
 * @param {string} folder - Storage folder (pets, documents, etc.)
 * @param {string} filename - Dosya adı (opsiyonel)
 * @returns {Promise<string>} - Public access URL
 */
export const uploadImageAndGetURL = async (imageUri, folder = 'pets', filename = null) => {
  try {
    console.log('🔄 Resim yükleme başlıyor:', { imageUri, folder, filename });
    
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Dosya adı oluştur
    const finalFilename = filename || `${Date.now()}.jpg`;
    const fullPath = `${folder}/${finalFilename}`;
    
    console.log('📁 Yükleme path:', fullPath);
    
    // Storage'a yükle
    const storageRef = ref(storage, fullPath);
    await uploadBytes(storageRef, blob);
    
    console.log('✅ Dosya yüklendi, URL alınıyor...');
    
    // Public URL al
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('📋 Oluşturulan URL:', downloadURL);
    console.log('🔍 URL Formatı:', {
      isDirect: downloadURL.includes('storage.googleapis.com'),
      isDownload: downloadURL.includes('firebasestorage.googleapis.com'),
      hasToken: downloadURL.includes('token='),
      hasAltMedia: downloadURL.includes('alt=media')
    });
    
    // URL'in çalışıp çalışmadığını test et
    try {
      const testResponse = await fetch(downloadURL, { method: 'HEAD' });
      console.log('🧪 URL Test Sonucu:', {
        status: testResponse.status,
        ok: testResponse.ok,
        url: downloadURL
      });
      
      if (!testResponse.ok) {
        console.warn('⚠️ Oluşturulan URL test başarısız, normalize deneniyor...');
        const normalizedUrl = await normalizeStorageURL(downloadURL);
        console.log('🔄 Normalize edilen URL:', normalizedUrl);
        return normalizedUrl;
      }
    } catch (testError) {
      console.error('❌ URL test hatası:', testError);
    }
    
    console.log('✅ Resim yüklendi:', { path: fullPath, url: downloadURL });
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Resim yükleme hatası:', error);
    throw error;
  }
};

/**
 * Birden fazla URL'i toplu olarak normalize eder
 * @param {string[]} urls - Normalize edilecek URL'ler
 * @returns {Promise<string[]>} - Düzeltilmiş URL'ler
 */
export const normalizeMultipleStorageURLs = async (urls) => {
  if (!Array.isArray(urls)) return [];
  
  const normalizedURLs = await Promise.all(
    urls.map(url => normalizeStorageURL(url))
  );
  
  return normalizedURLs.filter(url => url !== null);
};

export default {
  normalizeStorageURL,
  uploadImageAndGetURL,
  normalizeMultipleStorageURLs
}; 