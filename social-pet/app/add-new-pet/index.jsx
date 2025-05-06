import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../config/FireBaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Pressable } from 'react-native';
import {ToastAndroid} from 'react-native';
import { storage } from '../../config/FireBaseConfig';
import { getDocs, collection } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { ActivityIndicator } from 'react-native';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

// İngilizce kategori ID'leri → Türkçe karşılıkları
const categoryLabels = {
  Dogs: 'Köpek',
  Cats: 'Kedi',
  Birds: 'Kuş',
  Hamsters: 'Hamster',
  Fishes: 'Balık',
  Others: 'Diğer'
};

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
  const [formData, setFormData] = useState({});
  const [gender, setGender] = useState();
  const [CategoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [customBreed, setCustomBreed] = useState('');
  const [selectedSterilization, setSelectedSterilization] = useState('');
  const [image, setImage] = useState();
  const [loader, setLoader] = useState(false);
  const {user}=useUser();
  const router = useRouter();
  
  useEffect(() => {
    navigation.setOptions({ headerTitle: 'Yeni Evcil Hayvan Ekleme' });
  
    const fetchData = async () => {
      await GetCategories();
    };
  
    fetchData();
  }, []);
  

  const GetCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Category')); // 'category' yazılışı kontrol edildiğine göre doğru
      if (snapshot.empty) {
        console.log('⚠️ Firestore Category koleksiyonu boş');
        return;
      }
  
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });
  
      console.log('🎯 Çekilen kategoriler:', categories);
      setCategoryList(categories);
    } catch (error) {
      console.error('🔥 Kategori verisi çekilirken hata:', error);
    }
  };
  

  /**
   * Galeriden resim seçme
   */
  const imagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      console.log(result);
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
  };

  const handleInputChange = (fieldName, fieldValue) => {
    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
  };

  const onSubmit = () => {
    if (!image) {
      ToastAndroid.show('Lütfen bir resim seçin', ToastAndroid.SHORT);
      return;
    }
  
    if (Object.keys(formData).length !== 9) {
      ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
      return;
    }
  
    UploadImage();
  };
  

/**
 * Resim yükleme
 */
const UploadImage = async () => {
  try {
    setLoader(true);

    const response = await fetch(image);
    const blob = await response.blob();
    const filename = `pets/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob); // Resmi yükle
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✔️ Doğru alınan URL:', downloadURL);


    await SaveFromData(downloadURL); // Firestore'a kaydet
  } catch (error) {
    console.error("🔥 Resim yükleme hatası:", error);
    ToastAndroid.show('Resim yükleme başarısız oldu', ToastAndroid.SHORT);
    setLoader(false);
  }
};



  const SaveFromData = async(imageURL) => {
    const docId=Date.now().toString();
    await setDoc(doc(db,'Pets',docId),{
        ...formData,
        imageUrl: imageURL,
        uname:user?.fullName || "Bulunamadı",
        email:user?.primaryEmailAddress?.emailAddress || "Bulunamadı",
        about:formData.about || "Bulunamadı",
        id:docId,
        pp:user?.imageUrl || "Bulunamadı",

        createdAt: new Date()
    })
    setLoader(false);
    router.replace('/(tabs)/home');
  }

  const handleCategoryChange = (itemValue) => {
    setSelectedCategory(itemValue);
    setSelectedBreed('');
    setCustomBreed('');
    handleInputChange('category', itemValue);
  };

  const handleBreedChange = (itemValue) => {
    setSelectedBreed(itemValue);
    if (itemValue !== 'Diğer') setCustomBreed('');
    handleInputChange('breed', itemValue === 'Diğer' ? customBreed : itemValue);
  };

  const handleCustomBreedChange = (value) => {
    setCustomBreed(value);
    handleInputChange('breed', value);
  };
  console.log("Kategori Listesi:", CategoryList);
  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontFamily: 'outfit-medium' }}>Yeni Hayvan Ekleme</Text>


      <Pressable onPress={imagePicker}>
      {!image ? <Image source={require('../../assets/images/paw.png')} 
      style={{
        width: 100, 
        height: 100, 
        borderRadius: 25, 
        borderWidth: 1, 
        borderColor: '#E8BB0E' 
      }} />:
      <Image source={{ uri:image }} 
      style={{
        width: 100, 
        height: 100, 
        borderRadius: 25, 
      }}
      />
      }
      </Pressable>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Evcil Hayvanınızın Adı *</Text>
        <TextInput style={styles.input} placeholder='Ad giriniz' onChangeText={(value) => handleInputChange('name', value)} />
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
            enabled={selectedCategory !== ''}
          >
            <Picker.Item label="Önce Tür Seçiniz" value="" />
            {selectedCategory && breedOptions[selectedCategory]?.map((breed) => (
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
        <TextInput style={styles.input} keyboardType='numeric-pad'
        onChangeText={(value) => handleInputChange('age', value)} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ağırlığı (kg) *</Text>
        <TextInput style={styles.input} keyboardType='numeric-pad'
        onChangeText={(value) => handleInputChange('weight', value)} />
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
          onChangeText={(value) => handleInputChange('about', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adres *</Text>
        <TextInput style={styles.input} onChangeText={(value) => handleInputChange('address', value)} />
      </View>

      <TouchableOpacity 
      disabled={loader}
      style={styles.button} 
      onPress={onSubmit}>
        {loader ? <ActivityIndicator size="large" color="#fff" /> :
        <Text style={{ fontFamily: 'outfit-medium', fontSize: 16, color: '#fff' }}>Kaydet</Text>
      }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 12,
  },
  input: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    fontFamily: 'outfit-medium',
    height: 25,
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
    fontFamily: 'outfit-medium',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    height: 52,
    width: '100%',
    fontSize: 14,
  },
  customBreedContainer: {
    marginTop: 12,
  },
  customBreedInput: {
    height: 25,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 7,
    fontSize: 14,
  },
  button: {
    padding: 15,
    backgroundColor: '#E8BB0E',
    borderRadius: 15,
    marginVertical: 10,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',   
  }
});
