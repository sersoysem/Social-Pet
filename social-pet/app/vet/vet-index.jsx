import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, SafeAreaView, Platform, Alert, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useUser } from '@clerk/clerk-expo';
import { Picker } from '@react-native-picker/picker';

const petBreeds = {
  'Köpek': [
    'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog',
    'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
    'Dachshund', 'Siberian Husky', 'Great Dane', 'Chihuahua',
    'Shih Tzu', 'Boston Terrier', 'Kangal', 'Akbash', 'Cocker Spaniel',
    'Border Collie', 'Jack Russell Terrier', 'Maltese Terrier', 'Diğer'
  ],
  'Kedi': [
    'British Shorthair', 'Scottish Fold', 'Persian', 'Maine Coon',
    'Ragdoll', 'Siamese', 'Bengal', 'Russian Blue', 'Abyssinian',
    'Sphynx', 'Munchkin', 'Turkish Angora', 'Van Kedisi', 'Tekir',
    'Tricolor', 'Siyah', 'Beyaz', 'Gri', 'Sarman', 'Diğer'
  ],
  'Kuş': [
    'Muhabbet Kuşu', 'Kanarya', 'Sultan Papağanı', 'Cennet Papağanı',
    'Jako Papağanı', 'Forpus', 'Love Bird', 'Finch', 'Bülbül',
    'Güvercin', 'Ispinoz', 'Saka', 'Diğer'
  ],
  'Hamster': [
    'Syrian Hamster', 'Dwarf Hamster', 'Roborovski', 'Chinese Hamster',
    'European Hamster', 'Diğer'
  ],
  'Diğer': [
    'Belirtilmemiş'
  ]
};

export default function VetIndex() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [selectedVet, setSelectedVet] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [reason, setReason] = useState('');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Get user email from either Clerk or AsyncStorage
  const getUserEmail = async () => {
    try {
      if (clerkUser?.primaryEmailAddress?.emailAddress) {
        return clerkUser.primaryEmailAddress.emailAddress;
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.email;
        }
      }
    } catch (error) {
      console.error("Kullanıcı email'i alınamadı:", error);
    }
    return null;
  };

  useEffect(() => {
    const initializeUser = async () => {
      const email = await getUserEmail();
      setCurrentUserEmail(email);
    };
    
    initializeUser();
    fetchVeterinarians();
  }, [clerkUser]);

  useEffect(() => {
    if (currentUserEmail) {
      loadAppointments();
    }
  }, [currentUserEmail]);

  const loadAppointments = async () => {
    if (!currentUserEmail) return;
    
    try {
      console.log('Randevular yükleniyor...', currentUserEmail);
      
      const appointmentsQuery = query(
        collection(db, 'Appointments'),
        where('userEmail', '==', currentUserEmail)
      );
      
      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointments = [];
        snapshot.forEach((doc) => {
          appointments.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('Firestore\'dan çekilen randevular:', appointments);
        setUpcomingAppointments(appointments);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Randevuları yükleme hatası:', error);
      
      // Fallback to AsyncStorage if Firestore fails
      try {
        const localAppointments = await AsyncStorage.getItem('appointments');
        if (localAppointments) {
          setUpcomingAppointments(JSON.parse(localAppointments));
        }
      } catch (localError) {
        console.error('Local randevuları yükleme hatası:', localError);
      }
    }
  };

  const fetchVeterinarians = async () => {
    try {
      setLoading(true);
      console.log('Veteriner verileri çekiliyor...');
      
      const vetsCollection = collection(db, 'Vets');
      const vetsSnapshot = await getDocs(vetsCollection);
      
      console.log('Veriler çekildi, döküman sayısı:', vetsSnapshot.docs.length);
      
      const vetsList = vetsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Veteriner verisi:', data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('İşlenmiş veteriner listesi:', vetsList);
      setVeterinarians(vetsList);
    } catch (error) {
      console.error('Veteriner verilerini çekme hatası:', error);
      Alert.alert(
        'Hata',
        'Veteriner bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppointment = (vet) => {
    setSelectedVet(vet);
    setModalVisible(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDate(selectedTime);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async () => {
    if (!date || !petName || !petType || !petBreed || !reason) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (!currentUserEmail) {
      Alert.alert("Hata", "Randevu alabilmek için giriş yapmanız gerekiyor.");
      return;
    }

    try {
      const newAppointment = {
        userEmail: currentUserEmail,
        vetId: selectedVet.id,
        vetName: selectedVet.name,
        vetImage: selectedVet.image,
        vetSpecialization: selectedVet.specialization,
        vetClinic: selectedVet.clinic,
        vetPhone: selectedVet.phone,
        petName,
        petType,
        petBreed,
        date: formatDate(date),
        time: formatTime(date),
        reason,
        status: 'confirmed',
        createdAt: new Date()
      };

      console.log('Firestore\'a kaydedilecek randevu:', newAppointment);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'Appointments'), newAppointment);
      console.log('Randevu Firestore\'a kaydedildi, ID:', docRef.id);

      // Also save to AsyncStorage for offline access
      const updatedAppointments = [...upcomingAppointments, { id: docRef.id, ...newAppointment }];
      await AsyncStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      Alert.alert(
        "Başarılı",
        "Randevunuz başarıyla oluşturuldu ve onaylandı.",
        [{ text: "Tamam" }]
      );

      // Reset form
      setModalVisible(false);
      setDate(new Date());
      setPetName('');
      setPetType('');
      setPetBreed('');
      setReason('');
      
    } catch (error) {
      console.error('Randevu kaydetme hatası:', error);
      Alert.alert("Hata", "Randevu kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      console.log('Silme işlemi başlatılıyor:', appointmentId);
      
      // Firestore'dan sil
      await deleteDoc(doc(db, 'Appointments', appointmentId));
      console.log('Firestore\'dan silindi');
      
      // Local state'i güncelle
      const updatedAppointments = upcomingAppointments.filter(apt => apt.id !== appointmentId);
      setUpcomingAppointments(updatedAppointments);
      
      // AsyncStorage'ı güncelle
      await AsyncStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      console.log('AsyncStorage güncellendi');
      
      setSelectedAppointment(null);
      Alert.alert("Başarılı", "Randevunuz başarıyla iptal edildi.");
    } catch (error) {
      console.error('Randevu silme hatası:', error);
      Alert.alert("Hata", "Randevu iptal edilirken bir hata oluştu: " + error.message);
      setSelectedAppointment(null);
    }
  };

  const handleCardPress = (appointmentId) => {
    console.log('Karta tıklandı:', appointmentId);
    console.log('Mevcut selectedAppointment:', selectedAppointment);
    
    if (selectedAppointment && selectedAppointment.id === appointmentId) {
      // Aynı karta basıldı, step'i artır
      console.log('Aynı karta basıldı, mevcut step:', selectedAppointment.step);
      
      if (selectedAppointment.step === 1) {
        console.log('Step 1 -> 2 geçiş yapılıyor');
        setSelectedAppointment({ id: appointmentId, step: 2 });
      } else if (selectedAppointment.step === 2) {
        console.log('Step 2 -> Silme işlemi başlatılıyor');
        // Üçüncü tık, silme işlemini gerçekleştir
        handleDeleteAppointment(appointmentId);
      }
    } else {
      // Farklı kart seçildi veya ilk tık
      console.log('İlk tık veya farklı kart, step 1 set ediliyor');
      setSelectedAppointment({ id: appointmentId, step: 1 });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinerlerimiz</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.container}>
        {!currentUserEmail ? (
          <View style={styles.authContainer}>
            <MaterialIcons name="person-outline" size={60} color="#FF6B35" />
            <Text style={styles.authTitle}>Randevu alabilmek için giriş yapmanız gerekiyor</Text>
            <Text style={styles.authSubtitle}>
              Veterinerlerimizden randevu alabilmek ve randevularınızı takip edebilmek için lütfen giriş yapın.
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.mainScrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainScrollContent}
          >
            <View style={styles.upcomingSection}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="schedule" size={24} color="#FF6B35" style={{marginRight: 10}} />
                <Text style={styles.sectionTitle}>Gelecek Randevularım</Text>
              </View>
              {upcomingAppointments.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.upcomingScroll}
                  contentContainerStyle={styles.upcomingScrollContent}
                >
                  {upcomingAppointments.map((appointment) => (
                    <TouchableOpacity 
                      key={appointment.id} 
                      style={[
                        styles.appointmentCard,
                        selectedAppointment && selectedAppointment.id === appointment.id && styles.selectedAppointmentCard
                      ]}
                      onPress={() => handleCardPress(appointment.id)}
                      activeOpacity={0.7}
                      delayPressIn={0}
                    >
                      {selectedAppointment && selectedAppointment.id === appointment.id ? (
                        // Silme modu
                        <View style={styles.deleteMode}>
                          {selectedAppointment.step === 1 ? (
                            // İlk step: Sadece yazı
                            <Text style={[styles.deleteText, {marginTop: -43}]}>Randevuyu Sil</Text>
                          ) : (
                            // İkinci step: X ikonu
                            <>
                              <MaterialIcons name="close" size={40} color="#fff" />
                              <Text style={[styles.deleteText, {marginTop: 20}]}>Sil</Text>
                            </>
                          )}
                        </View>
                      ) : (
                        // Normal mod
                        <>
                          <View style={styles.compactAppointmentHeader}>
                            <Text style={styles.compactPetName}>{appointment.petName}</Text>
                            <Text style={styles.compactVetName}>{appointment.vetName}</Text>
                          </View>
                          
                          <View style={styles.compactDetailsRow}>
                            <View style={styles.compactDetailItem}>
                              <MaterialIcons name="calendar-today" size={16} color="#FF6B35" />
                              <Text style={styles.compactDetailText}>{appointment.date}</Text>
                            </View>
                            <View style={styles.compactDetailItem}>
                              <MaterialIcons name="access-time" size={16} color="#FF6B35" />
                              <Text style={styles.compactDetailText}>{appointment.time}</Text>
                            </View>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noAppointmentsContainer}>
                  <MaterialIcons name="event-busy" size={40} color="#FF6B35" />
                  <Text style={styles.noAppointmentsText}>Henüz gelecek randevunuz bulunmuyor</Text>
                  <Text style={styles.noAppointmentsSubText}>
                    Veterinerlerimizden birini seçerek randevu alabilirsiniz
                  </Text>
                </View>
              )}
            </View>

            <TouchableWithoutFeedback onPress={() => setSelectedAppointment(null)}>
              <View>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Veterinerler yükleniyor...</Text>
                  </View>
                ) : veterinarians.length > 0 ? (
                  <View style={styles.veterinariansSection}>
                    <View style={styles.sectionTitleContainer}>
                      <MaterialIcons name="pets" size={24} color="#FF6B35" />
                      <Text style={styles.sectionTitle}>Veterinerlerimiz</Text>
                      <MaterialIcons name="pets" size={24} color="#FF6B35" />
                    </View>
                    {veterinarians.map((vet) => (
                      <TouchableOpacity key={vet.id} style={styles.card}>
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: vet.image }}
                            style={styles.profileImage}
                          />
                        </View>
                        <View style={styles.cardContent}>
                          <View style={styles.cardHeader}>
                            <View style={styles.vetInfo}>
                              <Text style={styles.vetName}>{vet.name}</Text>
                              <Text style={styles.specialization}>{vet.specialization}</Text>
                            </View>
                            <View style={styles.ratingContainer}>
                              <MaterialIcons name="star" size={20} color="#FFD700" />
                              <Text style={styles.rating}>{vet.rating}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.clinicInfo}>
                            <MaterialIcons name="business" size={20} color="#FF6B35" />
                            <Text style={styles.clinicText}>{vet.clinic}</Text>
                          </View>
                          
                          <View style={styles.clinicInfo}>
                            <MaterialIcons name="location-on" size={20} color="#FF6B35" />
                            <Text style={styles.clinicText}>{vet.address}</Text>
                          </View>
                          
                          <View style={styles.clinicInfo}>
                            <MaterialIcons name="phone" size={20} color="#FF6B35" />
                            <Text style={styles.clinicText}>{vet.phone}</Text>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.appointmentButton}
                            onPress={() => handleAppointment(vet)}
                          >
                            <Text style={styles.appointmentButtonText}>Randevu Al</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <MaterialIcons name="error-outline" size={40} color="#FF6B35" />
                    <Text style={styles.noDataText}>Veteriner bilgileri bulunamadı</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={fetchVeterinarians}
                    >
                      <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Randevu Al</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalScroll}>
                    <View style={styles.modalForm}>
                      <Text style={styles.modalSubtitle}>
                        {selectedVet?.name} ile randevu oluştur
                      </Text>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Tarih</Text>
                        <TouchableOpacity 
                          style={styles.dateTimeButton}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                          <MaterialIcons name="calendar-today" size={20} color="#666" />
                        </TouchableOpacity>
                        {showDatePicker && (
                          <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                          />
                        )}
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Saat</Text>
                        <TouchableOpacity 
                          style={styles.dateTimeButton}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
                          <MaterialIcons name="access-time" size={20} color="#666" />
                        </TouchableOpacity>
                        {showTimePicker && (
                          <DateTimePicker
                            value={date}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleTimeChange}
                            minuteInterval={30}
                          />
                        )}
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Evcil Hayvan Adı</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Evcil hayvanınızın adı"
                          value={petName}
                          onChangeText={setPetName}
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Hayvan Türü</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={petType}
                            onValueChange={(value) => {
                              setPetType(value);
                              setPetBreed(''); // Reset breed when type changes
                            }}
                            style={styles.picker}
                          >
                            <Picker.Item label="Seçiniz" value="" />
                            <Picker.Item label="Köpek" value="Köpek" />
                            <Picker.Item label="Kedi" value="Kedi" />
                            <Picker.Item label="Kuş" value="Kuş" />
                            <Picker.Item label="Hamster" value="Hamster" />
                            <Picker.Item label="Diğer" value="Diğer" />
                          </Picker>
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Hayvan Irkı</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={petBreed}
                            onValueChange={(value) => setPetBreed(value)}
                            style={styles.picker}
                            enabled={petType !== ''}
                          >
                            <Picker.Item label="Seçiniz" value="" />
                            {petBreeds[petType] && petBreeds[petType].map((breed) => (
                              <Picker.Item key={breed} label={breed} value={breed} />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Randevu Nedeni</Text>
                        <TextInput
                          style={[styles.formInput, styles.formTextArea]}
                          placeholder="Randevu nedeninizi belirtin"
                          multiline
                          numberOfLines={4}
                          value={reason}
                          onChangeText={setReason}
                        />
                      </View>

                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={handleSubmit}
                      >
                        <Text style={styles.submitButtonText}>Randevuyu Onayla</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </SafeAreaView>
            </Modal>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: '#FF6B35',
  },
  headerRight: {
    width: 40, // To balance the back button
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
    marginTop: 40,
  },
  imageContainer: {
    position: 'absolute',
    top: -30,
    left: 20,
    zIndex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cardContent: {
    padding: 15,
    paddingTop: 65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 18,
    fontFamily: 'outfit-bold',
    color: '#333',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rating: {
    marginLeft: 5,
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#FF6B35',
  },
  clinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clinicText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
    flex: 1,
  },
  appointmentButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  appointmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: '#FF6B35',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    flex: 1,
  },
  modalForm: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: '#666',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'outfit-regular',
    backgroundColor: '#fff',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'outfit-bold',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 16,
    fontFamily: 'outfit-regular',
    color: '#333',
  },
  upcomingSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 200,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'outfit-bold',
    color: '#333',
    marginHorizontal: 15,
  },
  upcomingScroll: {
    flexGrow: 0,
  },
  upcomingScrollContent: {
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginRight: 15,
    marginLeft: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  compactAppointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactPetName: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#333',
  },
  compactVetName: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: '#666',
  },
  compactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDetailText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF9E6',
    borderRadius: 15,
    marginTop: 10,
  },
  noAppointmentsText: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  noAppointmentsSubText: {
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'outfit-medium',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: '#333',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: '#666',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'outfit-medium',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  picker: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 20,
  },
  veterinariansSection: {
    padding: 15,
    backgroundColor: '#fff',
  },
  selectedAppointmentCard: {
    backgroundColor: '#FF4444',
    borderColor: '#FF2222',
  },
  deleteMode: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 80,
  },
  deleteText: {
    fontSize: 16,
    fontFamily: 'outfit-bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    justifyContent: 'center',
  },
  deleteSubText: {
    fontSize: 12,
    fontFamily: 'outfit-regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
}); 