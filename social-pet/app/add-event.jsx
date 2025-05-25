import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/FireBaseConfig';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '@clerk/clerk-expo';
import { auth as firebaseAuth } from '../config/FireBaseConfig';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  primary: '#ff6b35',       // daha pastel yeşil
  secondary: '#ffe8a3',     // çok açık sarı
  bg: '#f6f9fb',            // çok açık mavi-gri zemin
  inputBg: '#f8fafd',       // daha açık input arka planı
  text: '#374151',          // daha koyu, göz yormayan gri
  label: '#8b9da9',
  border: '#e6eaf0',
  button: '#ff6b35',
  focus: '#afd9f9',         // input focus efekti
  cardShadow: '#c8e6fa88'
};

const cityOptions = ['Ankara', 'İstanbul', 'İzmir'];
const districtOptions = {
  'Ankara': ['Çankaya', 'Keçiören'],
  'İstanbul': ['Kadıköy', 'Beşiktaş'],
  'İzmir': ['Konak', 'Bornova'],
};
const petTypeOptions = ['Dogs', 'Cats', 'Fishes', 'Birds', 'Hamsters', 'Others'];

function CustomInput({ label, value, onChangeText, placeholder, required, editable = true, ...props }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={{ color: '#ff5151' }}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          !editable && { opacity: 0.5 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bfcad8"
        editable={editable}
        {...props}
      />
    </View>
  );
}

function CustomPicker({ label, selectedValue, onValueChange, items, placeholder }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={Colors.primary}
        >
          <Picker.Item label={placeholder} value="" />
          {items.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

export default function AddEventScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  
  // State for user info
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Get user info from different sources
  useEffect(() => {
    const getUserInfo = async () => {
      let email = '';
      let name = '';
      
      // Check Clerk user first (Google login)
      if (user && user.primaryEmailAddress) {
        email = user.primaryEmailAddress.emailAddress;
        name = user.fullName || user.firstName || '';
        console.log('👤 Clerk kullanıcısı tespit edildi:', { email, name });
      } 
      // Check Firebase Auth (fallback)
      else if (firebaseAuth.currentUser) {
        email = firebaseAuth.currentUser.email || '';
        name = firebaseAuth.currentUser.displayName || '';
        console.log('🔥 Firebase Auth kullanıcısı tespit edildi:', { email, name });
      }
      // Check AsyncStorage for email/password login
      else {
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            email = parsedUserData.email || '';
            name = parsedUserData.name || '';
            console.log('💾 AsyncStorage kullanıcısı tespit edildi:', { email, name, fullData: parsedUserData });
          }
        } catch (error) {
          console.error('❌ AsyncStorage kullanıcı bilgisi alınırken hata:', error);
        }
      }
      
      setUserEmail(email);
      setUserName(name);
      console.log('✅ Final kullanıcı bilgileri:', { email, name });
    };
    
    getUserInfo();
  }, [user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Etkinlik Oluştur',
      headerTitleStyle: {
        fontFamily: 'outfit-bold',
        fontSize: 23,
        color: '#ff6b35',
        letterSpacing: 0.2,
      },
      headerStyle: {
        backgroundColor: Colors.bg,
        borderBottomWidth: 0,
        elevation: 0,
      },
      headerTintColor: '#ff6b35',
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [petType, setPetType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [unlimited, setUnlimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddEvent = async () => {
    if (!title || !city || !district || !date || !time || (!capacity && !unlimited)) {
      Alert.alert('Eksik Alan', 'Yıldızlı tüm alanları doldurun.');
      return;
    }
    
    if (!userEmail) {
      Alert.alert('Giriş Gerekli', 'Etkinlik oluşturmak için giriş yapmalısınız.');
      return;
    }
    
    setLoading(true);
    try {
      const participantsArr = userEmail ? [userEmail] : [];
      const createdBy = userName || userEmail || 'Anonim';
      
      console.log('📝 Etkinlik oluşturuluyor:', {
        email: userEmail,
        created_by: createdBy,
        participants: participantsArr
      });
      
      await addDoc(collection(db, 'Events'), {
        title,
        city,
        district,
        date: `${date}T${time}:00`,
        time,
        description,
        pet_type: petType,
        email: userEmail,
        created_at: new Date().toISOString(),
        created_by: createdBy,
        capacity: unlimited ? null : parseInt(capacity, 10) || 1,
        unlimited,
        participants: participantsArr
      });
      Alert.alert('Başarılı', 'Etkinlik eklendi!');
      navigation.goBack();
    } catch (e) {
      console.error('❌ Etkinlik eklenirken hata:', e);
      Alert.alert('Hata', 'Etkinlik eklenirken bir hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.formCard}>
        <CustomInput label="Başlık" value={title} onChangeText={setTitle} placeholder="Etkinlik başlığı" required />
        <CustomPicker
          label="Şehir"
          selectedValue={city}
          onValueChange={(itemValue) => {
            setCity(itemValue);
            setDistrict('');
          }}
          items={cityOptions}
          placeholder="Şehir seçin"
        />
        {city ? (
          <CustomPicker
            label="İlçe"
            selectedValue={district}
            onValueChange={setDistrict}
            items={districtOptions[city] || []}
            placeholder="İlçe seçin"
          />
        ) : null}
        <CustomPicker
          label="Evcil Türü"
          selectedValue={petType}
          onValueChange={setPetType}
          items={petTypeOptions}
          placeholder="Evcil türü seçin"
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputDateBtn}>
          <MaterialIcons name="calendar-today" size={18} color={Colors.primary} style={{marginRight:5}} />
          <Text style={{ color: date ? Colors.text : '#bfcad8', fontSize: 16 }}>
            {date ? date : 'Tarih seçin'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date ? new Date(date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate.toISOString().split('T')[0]);
            }}
          />
        )}

        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputDateBtn}>
          <MaterialIcons name="access-time" size={18} color={Colors.primary} style={{marginRight:5}} />
          <Text style={{ color: time ? Colors.text : '#bfcad8', fontSize: 16 }}>
            {time ? time : 'Saat seçin'}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time ? new Date(`1970-01-01T${time}:00`) : new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const h = selectedTime.getHours().toString().padStart(2, '0');
                const m = selectedTime.getMinutes().toString().padStart(2, '0');
                setTime(`${h}:${m}`);
              }
            }}
          />
        )}

        <CustomInput label="Açıklama" value={description} onChangeText={setDescription} placeholder="Kısa açıklama..." />

        <View style={styles.capacityRow}>
          <CustomInput
            label="Katılımcı Sayısı"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="1"
            keyboardType="numeric"
            editable={!unlimited}
          />
          <TouchableOpacity
            style={[styles.unlimitedBtn, unlimited && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
            onPress={() => setUnlimited(!unlimited)}
          >
            <MaterialIcons name="all-inclusive" size={24} color={unlimited ? "#fff" : Colors.primary} />
            <Text style={{ color: unlimited ? '#fff' : Colors.primary, marginLeft: 7, fontFamily: 'outfit-medium' }}>Limitsiz</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddEvent}
          disabled={loading}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'outfit-bold', fontSize: 18, marginLeft: 9, letterSpacing: 0.1 }}>
            {loading ? 'Ekleniyor...' : 'Etkinlik Oluştur'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: 26,
    borderRadius: 30,
    margin: 18,
    backgroundColor: '#fff',
    shadowColor: Colors.cardShadow,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 30,
    elevation: 9,
    marginTop: 25,
    marginBottom: 30,
  },
  inputLabel: {
    color: Colors.label,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 7,
    marginLeft: 2,
    fontFamily: 'outfit',
    letterSpacing: 0.05
  },
  input: {
    fontSize: 17,
    paddingVertical: 13,
    paddingHorizontal: 18,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontFamily: 'outfit',
    shadowColor: "#e3eefc",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  pickerWrapper: {
    backgroundColor: Colors.inputBg,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 2,
    paddingVertical: 0,
    marginTop: 1,
    shadowColor: "#e3eefc",
    shadowOpacity: 0.11,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  picker: {
    height: 50,
    width: '100%',
    color: Colors.text,
    fontSize: 17,
    fontFamily: 'outfit',
    backgroundColor: 'transparent',
  },
  inputDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowColor: "#e3eefc",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  unlimitedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 21,
    marginLeft: 18,
    backgroundColor: '#f5fcf8',
    shadowColor: "#e3eefc",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  addBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.button,
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: Colors.button,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  debugCard: {
    padding: 18,
    borderRadius: 20,
    margin: 18,
    backgroundColor: '#fff',
    shadowColor: Colors.cardShadow,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 30,
    elevation: 9,
  },
  debugTitle: {
    color: Colors.label,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'outfit',
  },
  debugText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'outfit',
  },
});
