import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/FireBaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getDocs, collection, setDoc, doc } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadImageAndGetURL } from '../../utils/StorageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const categoryLabels = {
  Dogs: 'Köpek',
  Cats: 'Kedi',
  Birds: 'Kuş',
  Hamsters: 'Hamster',
  Fishes: 'Balık',
  Others: 'Diğer'
};

const turkishProvinces = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
  'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
  'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
  'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
  'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const breedOptions = {
  'Dogs': [
    'Golden Retriever', 'Labrador', 'Pomeranian', 'Poodle', 'Chihuahua', 'Beagle', 'Cocker Spaniel', 'Doberman', 'Shih Tzu', 'Diğer'
  ],
  'Cats': [
    'British Shorthair', 'Scottish Fold', 'İran Kedisi', 'Van Kedisi', 'Maine Coon', 'Siyam', 'Bengal', 'Sphynx', 'Ragdoll', 'Diğer'
  ],
  'Birds': [
    'Muhabbet Kuşu', 'Sultan Papağanı', 'Kanarya', 'Cennet Papağanı', 'Zebra İspinozu', 'Macaw', 'Afrika Gri Papağanı', 'Diğer'
  ],
  'Hamsters': [
    'Syrian Hamster', 'Winter White', 'Roborovski', 'Campbell Dwarf', 'Chinese Hamster', 'Diğer'
  ],
  'Fishes': [
    'Japon Balığı','Melek Balığı (Angelfish)','Altın Balık (Goldfish)','Zebra Balığı (Danio)','Tetra Türleri','Çöpçü Balığı','Lepistes (Guppy)','Moli (Molly)','Plati (Platy)','Diğer'
  ],
  'Others': ['Belirtilmedi']
};

export default function AddNewPet() {
  const navigation = useNavigation();
  
  // User info states
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    breed: '',
    age: '',
    weight: '',
    sex: '',
    sterilization: '',
    about: '',
    address: ''
  });
  const [gender, setGender] = useState("");
  const [CategoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [selectedSterilization, setSelectedSterilization] = useState("");
  const [image, setImage] = useState(null);
  const [loader, setLoader] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const [vaccinationCard, setVaccinationCard] = useState(null);
  const [veterinaryReport, setVeterinaryReport] = useState(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: 'Yeni Evcil Hayvan Ekleme' });
    GetCategories();
  }, []);

  // Get user info from different sources
  useEffect(() => {
    const getUserInfo = async () => {
      let email = '';
      let name = '';
      
      // Sabit avatar linki
      const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pp.jpg?alt=media&token=7d56de3b-741f-4bd7-882e-9cca500a9902";
      
      // Check Clerk user first (Google login)
      if (user && user.primaryEmailAddress) {
        email = user.primaryEmailAddress.emailAddress;
        name = user.fullName || user.firstName || '';
        console.log('👤 Add-pet Clerk kullanıcısı tespit edildi:', { email, name });
      } 
      // Check AsyncStorage for email/password login
      else {
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            email = parsedUserData.email || '';
            name = parsedUserData.name || '';
            console.log('💾 Add-pet AsyncStorage kullanıcısı tespit edildi:', { email, name, fullData: parsedUserData });
          }
        } catch (error) {
          console.error('❌ Add-pet AsyncStorage kullanıcı bilgisi alınırken hata:', error);
        }
      }
      
      setCurrentUserEmail(email);
      setCurrentUserName(name);
      setCurrentUserAvatar(defaultAvatar);
      console.log('✅ Add-pet final kullanıcı bilgileri:', { email, name, avatar: defaultAvatar });
    };
    
    getUserInfo();
  }, [user]);

  const GetCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Category'));
      if (snapshot.empty) {
        console.log('⚠️ Firestore Category koleksiyonu boş');
        return;
      }
      const categories = [];
      snapshot.forEach((doc) => {
        if (doc.data().name && breedOptions[doc.data().name]) { // SADECE TANIMLI OLANLAR
          categories.push({ id: doc.id, ...doc.data() });
        }
      });
      setCategoryList(categories);
    } catch (error) {
      console.error('🔥 Kategori verisi çekilirken hata:', error);
      ToastAndroid.show('Kategoriler yüklenirken hata oluştu', ToastAndroid.SHORT);
    }
  };

  const imagePicker = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Resim seçme hatası:", error);
      ToastAndroid.show('Resim seçerken hata oluştu', ToastAndroid.SHORT);
    }
  };

  const documentPicker = async (type) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (type === 'vaccination') {
          setVaccinationCard(result.assets[0].uri);
        } else if (type === 'veterinary') {
          setVeterinaryReport(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Dosya seçme hatası:", error);
      ToastAndroid.show('Dosya seçerken hata oluştu', ToastAndroid.SHORT);
    }
  };

  const handleInputChange = (fieldName, fieldValue) => {
    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
  };

  const validateForm = () => {
    const requiredFields = [
      image,
      formData.name,
      selectedCategory,
      selectedBreed === 'Diğer' ? customBreed : selectedBreed,
      formData.age,
      formData.weight,
      gender,
      selectedSterilization,
      formData.about,
      formData.address
    ];

    return requiredFields.every(field => field && field.toString().trim() !== '');
  };

  const onSubmit = () => {
    if (!image) {
      ToastAndroid.show('Lütfen bir resim seçin', ToastAndroid.SHORT);
      return;
    }
    
    if (!currentUserEmail) {
      ToastAndroid.show('Lütfen giriş yapın', ToastAndroid.SHORT);
      return;
    }
    
    if (!validateForm()) {
      ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
      return;
    }

    const finalBreed = selectedBreed === 'Diğer' ? customBreed : selectedBreed;
    setFormData(prev => ({ ...prev, breed: finalBreed }));

    UploadImage();
  };

  const UploadImage = async () => {
    try {
      setLoader(true);
      
      // Ana resmi yükle
      const downloadURL = await uploadImageAndGetURL(image, 'pets');

      // Aşı karnesi varsa yükle
      let vaccinationCardURL = null;
      if (vaccinationCard) {
        vaccinationCardURL = await uploadImageAndGetURL(vaccinationCard, 'documents', `vaccination_${Date.now()}.pdf`);
      }

      // Veteriner raporu varsa yükle
      let veterinaryReportURL = null;
      if (veterinaryReport) {
        veterinaryReportURL = await uploadImageAndGetURL(veterinaryReport, 'documents', `veterinary_${Date.now()}.pdf`);
      }

      await SaveFromData(downloadURL, vaccinationCardURL, veterinaryReportURL);
    } catch (error) {
      console.error("🔥 Dosya yükleme hatası:", error);
      ToastAndroid.show('Dosya yükleme başarısız oldu', ToastAndroid.SHORT);
      setLoader(false);
    }
  };

  const SaveFromData = async (imageURL, vaccinationCardURL, veterinaryReportURL) => {
    try {
      const docId = Date.now().toString();
      
      // PP değerini sabit Firebase Storage linki ile ayarla
      const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/socialpet-b392b.firebasestorage.app/o/pp.jpg?alt=media&token=7d56de3b-741f-4bd7-882e-9cca500a9902";
      
      const petData = {
        ...formData,
        imageUrl: imageURL,
        vaccinationCardUrl: vaccinationCardURL,
        veterinaryReportUrl: veterinaryReportURL,
        uname: currentUserName || "Belirtilmemiş",
        email: currentUserEmail || "Belirtilmemiş", 
        about: formData.about || "Belirtilmemiş",
        id: docId,
        pp: defaultAvatar,
        createdAt: new Date(),
        category: selectedCategory,
        sex: gender,
        sterilization: selectedSterilization
      };

      console.log('📝 Pet kaydediliyor:', {
        email: currentUserEmail,
        name: currentUserName,
        avatar: defaultAvatar,
        petName: formData.name
      });

      await setDoc(doc(db, 'Pets', docId), petData);
      console.log('✅ Pet başarıyla kaydedildi:', docId);
      ToastAndroid.show('Evcil hayvan başarıyla kaydedildi', ToastAndroid.SHORT);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Veri kaydetme hatası:", error);
      ToastAndroid.show('Kayıt sırasında hata oluştu', ToastAndroid.SHORT);
    } finally {
      setLoader(false);
    }
  };

  const handleCategoryChange = (itemValue) => {
    setSelectedCategory(itemValue);
    setSelectedBreed("");
    setCustomBreed("");
    handleInputChange('category', itemValue);
  };

  const handleBreedChange = (itemValue) => {
    setSelectedBreed(itemValue);
    if (itemValue !== 'Diğer') {
      setCustomBreed("");
      handleInputChange('breed', itemValue);
    }
  };

  const handleCustomBreedChange = (value) => {
    setCustomBreed(value);
    if (selectedBreed === 'Diğer') {
      handleInputChange('breed', value);
    }
  };

  // --- EN KRİTİK KISIM BURASI ---
  // Breed picker daima güvenli bir array ile çalışır!
  const breedList = breedOptions[selectedCategory] || [];

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView style={{ padding: 20 }}>
      <View style={styles.imageUploadContainer}>
        <Pressable onPress={imagePicker} style={styles.imageUploadButton}>
          {!image ? (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="add-a-photo" size={35} color="#FF6B35" />
              </View>
              <Text style={styles.uploadText}>Fotoğraf Ekle</Text>
              <Text style={styles.uploadSubText}>PNG, JPG veya JPEG</Text>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: image }}
                style={styles.uploadedImage}
              />
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={imagePicker}>
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.changePhotoText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Evcil Hayvanınızın Adı *</Text>
        <TextInput 
          style={styles.input} 
          placeholder='Ad giriniz' 
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)} 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Türü *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={handleCategoryChange}
          >
            <Picker.Item label="Seçiniz" value="" />
            {CategoryList.map((category, index) => (
              <Picker.Item
                key={index}
                label={categoryLabels[category.name] || category.name}
                value={category.name}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Irkı *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedBreed}
            onValueChange={handleBreedChange}
            style={styles.picker}
            enabled={!!selectedCategory}
          >
            <Picker.Item label={selectedCategory ? "Irk seçiniz" : "Önce Tür Seçiniz"} value="" />
            {breedList.map((breed) => (
              <Picker.Item key={breed} label={breed} value={breed} />
            ))}
          </Picker>
        </View>
        {selectedBreed === 'Diğer' && (
          <View style={styles.customBreedContainer}>
            <TextInput
              style={[styles.input, styles.customBreedInput]}
              placeholder="Irkı giriniz"
              value={customBreed}
              onChangeText={handleCustomBreedChange}
            />
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Yaşı *</Text>
        <TextInput 
          style={styles.input} 
          keyboardType='number-pad'
          placeholder='Yaş giriniz (tam sayı)'
          value={formData.age}
          onChangeText={(value) => handleInputChange('age', value)} 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ağırlığı (kg) *</Text>
        <TextInput 
          style={styles.input} 
          keyboardType='decimal-pad'
          placeholder='Ağırlık giriniz (örn: 5.2)'
          value={formData.weight}
          onChangeText={(value) => handleInputChange('weight', value)} 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cinsiyeti *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => {
              setGender(itemValue);
              handleInputChange('sex', itemValue);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Seçiniz" value="" />
            <Picker.Item label="Dişi" value="Female" />
            <Picker.Item label="Erkek" value="Male" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Kısırlaştırıldı Mı? *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSterilization}
            onValueChange={(itemValue) => {
              setSelectedSterilization(itemValue);
              handleInputChange('sterilization', itemValue);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Seçiniz" value="" />
            <Picker.Item label="Evet" value="Yes" />
            <Picker.Item label="Hayır" value="No" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Hakkında *</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          value={formData.about}
          onChangeText={(value) => handleInputChange('about', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Şehir *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.address}
            onValueChange={(itemValue) => handleInputChange('address', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="İl Seçiniz" value="" />
            {turkishProvinces.map((province) => (
              <Picker.Item key={province} label={province} value={province} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.documentUploadContainer}>
        <Text style={styles.label}>Aşı Karnesi</Text>
        <Text style={styles.infoText}>Daha güvenilir bir profil oluşturmak için aşı karnesini ve veterinerinizden aldığınız raporuekleyebilirsiniz</Text>
        <Pressable onPress={() => documentPicker('vaccination')} style={styles.documentUploadButton}>
          {!vaccinationCard ? (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="description" size={35} color="#FF6B35" />
              </View>
              <Text style={styles.uploadText}>Aşı Karnesi Ekle</Text>
              <Text style={styles.uploadSubText}>PDF, DOC veya DOCX</Text>
            </View>
          ) : (
            <View style={styles.documentPreviewContainer}>
              <View style={styles.documentPreview}>
                <MaterialIcons name="description" size={30} color="#FF6B35" />
                <Text style={styles.documentName}>Aşı Karnesi Yüklendi</Text>
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={() => documentPicker('vaccination')}>
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.changePhotoText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.documentUploadContainer}>
        
        <Pressable onPress={() => documentPicker('veterinary')} style={styles.documentUploadButton}>
          {!veterinaryReport ? (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="description" size={35} color="#FF6B35" />
              </View>
              <Text style={styles.uploadText}>Veteriner Raporu Ekle</Text>
              <Text style={styles.uploadSubText}>PDF, DOC veya DOCX</Text>
            </View>
          ) : (
            <View style={styles.documentPreviewContainer}>
              <View style={styles.documentPreview}>
                <MaterialIcons name="description" size={30} color="#FF6B35" />
                <Text style={styles.documentName}>Veteriner Raporu Yüklendi</Text>
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={() => documentPicker('veterinary')}>
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.changePhotoText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </View>

      <TouchableOpacity
        disabled={loader}
        style={[styles.button, loader && styles.disabledButton]}
        onPress={onSubmit}>
        {loader ? <ActivityIndicator size="large" color="#fff" /> :
          <Text style={{ fontFamily: 'outfit-medium', fontSize: 16, color: '#fff' }}>Kaydet</Text>
        }
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.94,
    backgroundColor: '#f8f9fa',
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF9F6',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#333',
    fontSize: 18,
    fontFamily: 'outfit-medium',
    marginBottom: 5,
  },
  uploadSubText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'outfit-regular',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  changePhotoText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontFamily: 'outfit-medium',
  },
  inputContainer: {
    marginVertical: 15,
  },
  input: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 15,
    fontFamily: 'outfit-medium',
    height: 55,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'outfit-medium',
    color: '#333',
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  picker: {
    height: 55,
    width: '100%',
    fontSize: 15,
  },
  customBreedContainer: {
    marginTop: 15,
  },
  customBreedInput: {
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    fontSize: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  button: {
    padding: 15,
    backgroundColor: '#FF6B35',
    borderRadius: 15,
    marginVertical: 10,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  documentUploadContainer: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  documentUploadButton: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentPreviewContainer: {
    flex: 1,
    backgroundColor: '#FFF9F6',
    padding: 15,
    justifyContent: 'space-between',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EB',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  documentName: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: '#333',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'outfit-medium',
  },
  debugContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 18,
    fontFamily: 'outfit-medium',
    color: '#333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 16,
    fontFamily: 'outfit-regular',
    color: '#666',
    marginBottom: 5,
  },
});
