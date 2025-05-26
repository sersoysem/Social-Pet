import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Pressable, Image, Modal, TextInput, ScrollView, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, addDoc, query, where, setDoc, doc } from 'firebase/firestore';
import { db, storage } from '../../config/FireBaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadImageAndGetURL } from '../../utils/StorageUtils';

const TURKISH_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
    'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
    'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
    'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
    'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
    'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
    'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const PET_TYPES = {
    dog: {
        label: 'Köpek',
        breeds: [
            'Golden Retriever', 'Labrador', 'Alman Kurdu', 'Pitbull', 'Bulldog', 
            'Pomeranian', 'Shih Tzu', 'Poodle', 'Husky', 'Rottweiler', 'Doberman',
            'Beagle', 'Chihuahua', 'Dalmaçyalı', 'Boxer', 'Diğer'
        ]
    },
    cat: {
        label: 'Kedi',
        breeds: [
            'Tekir', 'Sarman', 'Van Kedisi', 'Persian', 'British Shorthair',
            'Maine Coon', 'Sphynx', 'Ragdoll', 'Siamese', 'Scottish Fold',
            'Bengal', 'Abyssinian', 'Diğer'
        ]
    },
    bird: {
        label: 'Kuş',
        breeds: [
            'Muhabbet Kuşu', 'Kanarya', 'Papağan', 'Sultan Papağanı',
            'İspinoz', 'Bülbül', 'Diğer'
        ]
    },
    fish: {
        label: 'Balık',
        breeds: [
            'Japon Balığı', 'Beta', 'Moli', 'Plati', 'Lepistes',
            'Melek Balığı', 'Discus', 'Diğer'
        ]
    },
    hamster: {
        label: 'Hamster',
        breeds: [
            'Suriye Hamsterı', 'Roborovski', 'Campbell', 'Winter White',
            'Chinese', 'Diğer'
        ]
    }
};

function getChatId(email1, email2) {
  return [email1, email2].sort().join("_");
}

export default function LostPets() {
    const navigation = useNavigation();
    const router = useRouter();
    const { user } = useUser();
    const [lostPets, setLostPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState(null);
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserAvatar, setCurrentUserAvatar] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        breed: '',
        lostDate: '',
        city: '',
        explain: '',
        image_url: '',
        user_email: ''
    });
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [availableBreeds, setAvailableBreeds] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
        fetchLostPets();
    }, []);

    useEffect(() => {
        const getUserInfo = async () => {
            let email = '';
            let name = '';
            let avatar = '';
            
            if (user?.primaryEmailAddress?.emailAddress) {
                // Clerk user (Google login)
                email = user.primaryEmailAddress.emailAddress;
                name = user?.fullName || "";
                avatar = user?.imageUrl || "";
            } else {
                // AsyncStorage user (email/password login)
                try {
                    const userData = await AsyncStorage.getItem('userData');
                    if (userData) {
                        const parsed = JSON.parse(userData);
                        email = parsed.email || '';
                        name = parsed.name || "";
                        avatar = parsed.imageUrl || "";
                    }
                } catch (error) {
                    console.error('❌ Lost-pets AsyncStorage kullanıcı bilgisi alınırken hata:', error);
                }
            }
            
            setCurrentUserEmail(email);
            setCurrentUserName(name);
            setCurrentUserAvatar(avatar);
            setFormData(prev => ({
                ...prev,
                user_email: email
            }));
            
            console.log('✅ Lost-pets final kullanıcı bilgileri:', { email, name, avatar });
        };
        
        getUserInfo();
    }, [user]);

    const fetchLostPets = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'LostPets'));
            const pets = [];
            querySnapshot.forEach((doc) => {
                pets.push({ id: doc.id, ...doc.data() });
            });
            setLostPets(pets);
        } catch (error) {
            console.error("Kayıp ilanları yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContact = async (pet) => {
        if (!currentUserEmail) {
            alert('Lütfen giriş yapın');
            return;
        }

        if (!currentUserEmail || !pet?.user_email) {
            alert("Kullanıcı veya karşı tarafın maili eksik!");
            return;
        }

        // Kullanıcının kendi ilanıyla iletişime geçmeye çalışıp çalışmadığını kontrol et
        if (currentUserEmail === pet.user_email) {
            alert("Bu ilan size aittir. Kendi ilanınızla iletişime geçemezsiniz.");
            return;
        }

        const chatId = getChatId(currentUserEmail, pet.user_email);

        // Zaten bir chat var mı kontrol et
        const q = query(collection(db, 'Chat'), where('id', '==', chatId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Chat varsa oraya yönlendir
            router.push({
                pathname: '/chat',
                params: { id: chatId }
            });
            return;
        }

        // Chat yoksa oluştur
        await setDoc(doc(db, 'Chat', chatId), {
            id: chatId,
            users: [
                {
                    email: currentUserEmail,
                    name: currentUserName,
                    pp: currentUserAvatar
                },
                {
                    email: pet.user_email,
                    name: pet.name,
                    imageUrl: pet.image_url,
                }
            ],
            userIds: [currentUserEmail, pet.user_email],
            lastMessage: "",
            lastMessageTime: null,
            lastMessageSeenBy: []
        });

        router.push({
            pathname: '/chat',
            params: { id: chatId }
        });
    };

    const handleGoBack = () => {
        navigation.navigate('HomeScreen');
    };

    const handleImagePicker = async () => {
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
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTypeChange = (value) => {
        handleInputChange('type', value);
        if (value && PET_TYPES[value]) {
            setAvailableBreeds(PET_TYPES[value].breeds);
        } else {
            setAvailableBreeds([]);
        }
        // Reset breed when type changes
        handleInputChange('breed', '');
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toLocaleDateString('tr-TR');
            handleInputChange('lostDate', formattedDate);
        }
    };

    const handleSubmit = async () => {
        if (!image) {
            alert('Lütfen bir fotoğraf seçin');
            return;
        }

        if (!currentUserEmail) {
            alert('Lütfen giriş yapın');
            return;
        }

        setUploading(true);
        try {
            // Upload image to Firebase Storage using StorageUtils
            const downloadURL = await uploadImageAndGetURL(image, 'lost-pets');

            console.log('📝 Kayıp ilanı oluşturuluyor:', {
                user_email: currentUserEmail,
                user_name: currentUserName,
                formData: formData
            });

            // Add document to Firestore
            const docRef = await addDoc(collection(db, 'LostPets'), {
                ...formData,
                image_url: downloadURL,
                created_at: new Date().toISOString(),
                user_email: currentUserEmail
            });

            console.log('✅ Kayıp ilanı başarıyla oluşturuldu:', docRef.id);

            setShowModal(false);
            setFormData({
                name: '',
                type: '',
                breed: '',
                lostDate: '',
                city: '',
                explain: '',
                image_url: '',
                user_email: currentUserEmail
            });
            setImage(null);
            fetchLostPets(); // Refresh the list
        } catch (error) {
            console.error("İlan oluşturma hatası:", error);
            alert('İlan oluşturulurken bir hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={28} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kayıp İlanları</Text>
            </View>

            <Pressable 
                style={styles.createButton}
                onPress={() => setShowModal(true)}
            >
                <MaterialIcons name="add" size={24} color="white" />
                <Text style={styles.createButtonText}>İlan Oluştur</Text>
            </Pressable>

            <FlatList
                data={lostPets}
                keyExtractor={(item) => item.id}
                numColumns={2}
                refreshing={loading}
                onRefresh={fetchLostPets}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <LostPetCard pet={item} onContact={handleContact} />
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="pets" size={50} color="#FF6B35" />
                        <Text style={styles.emptyText}>Henüz kayıp ilanı bulunmuyor</Text>
                    </View>
                )}
            />

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Kayıp İlanı Oluştur</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Pressable onPress={handleImagePicker} style={styles.imageUploadButton}>
                                {!image ? (
                                    <View style={styles.placeholderContainer}>
                                        <MaterialIcons name="add-a-photo" size={35} color="#FF6B35" />
                                        <Text style={styles.uploadText}>Fotoğraf Ekle</Text>
                                    </View>
                                ) : (
                                    <Image source={{ uri: image }} style={styles.uploadedImage} />
                                )}
                            </Pressable>

                            <TextInput
                                style={styles.input}
                                placeholder="Hayvanın Adı"
                                value={formData.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />

                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.type}
                                    onValueChange={handleTypeChange}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Tür Seçin" value="" />
                                    {Object.entries(PET_TYPES).map(([key, { label }]) => (
                                        <Picker.Item key={key} label={label} value={key} />
                                    ))}
                                </Picker>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.breed}
                                    onValueChange={(value) => handleInputChange('breed', value)}
                                    style={styles.picker}
                                    enabled={formData.type !== ''}
                                >
                                    <Picker.Item label="Irk/Cins Seçin" value="" />
                                    {availableBreeds.map((breed) => (
                                        <Picker.Item key={breed} label={breed} value={breed} />
                                    ))}
                                </Picker>
                            </View>

                            <TouchableOpacity 
                                style={styles.dateInput}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={formData.lostDate ? styles.dateText : styles.datePlaceholder}>
                                    {formData.lostDate || 'Kaybolduğu Tarih'}
                                </Text>
                                <MaterialIcons name="calendar-today" size={20} color="#666" />
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={formData.lostDate ? new Date(formData.lostDate) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}

                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.city}
                                    onValueChange={(value) => handleInputChange('city', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Şehir Seçin" value="" />
                                    {TURKISH_CITIES.map((city) => (
                                        <Picker.Item key={city} label={city} value={city} />
                                    ))}
                                </Picker>
                            </View>

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Açıklama"
                                value={formData.explain}
                                onChangeText={(value) => handleInputChange('explain', value)}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, uploading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={uploading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {uploading ? 'Yükleniyor...' : 'İlanı Yayınla'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function LostPetCard({ pet, onContact }) {
    return (
        <View style={styles.lostPetCard}>
            <View style={{flex: 1}}>
                <View style={styles.imageWrapper}>
                    <Image
                        source={{ uri: pet.image_url }}
                        style={styles.petImage}
                        resizeMode="cover"
                    />
                    {pet.age && (
                        <View style={styles.ageBadge}>
                            <Text style={styles.ageBadgeText}>{pet.age}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.infoWrapper}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    <Text style={styles.petLocation}>{pet.town ? `${pet.town}, ` : ''}{pet.city}</Text>
                    <Text style={styles.petExplain} numberOfLines={2} ellipsizeMode="tail">{pet.explain}</Text>
                </View>
            </View>
            <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => onContact(pet)}
            >
                <MaterialIcons name="message" size={20} color="white" />
                <Text style={styles.contactButtonText}>İletişime Geç</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
        elevation: 2,
        zIndex: 10,
    },
    backButton: {
        marginRight: 8,
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'outfit-bold',
        color: '#222',
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 10,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: '48%',
        marginBottom: 15,
    },
    lostPetCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        marginBottom: 8,
        height: 320,
        flex: 1,
        justifyContent: 'space-between',
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: 1.2,
        backgroundColor: '#f2f2f2',
        position: 'relative',
    },
    petImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    infoWrapper: {
        padding: 10,
    },
    petName: {
        fontFamily: 'outfit-bold',
        fontSize: 16,
        color: '#222',
    },
    petBreed: {
        fontFamily: 'outfit-medium',
        fontSize: 14,
        color: '#FF6B35',
        marginTop: 2,
    },
    petAge: {
        fontFamily: 'outfit-regular',
        fontSize: 13,
        color: '#444',
        marginTop: 2,
    },
    petExplain: {
        fontFamily: 'outfit-regular',
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    petLocation: {
        fontFamily: 'outfit-medium',
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B35',
        margin: 15,
        padding: 12,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'outfit-medium',
        marginLeft: 8,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27ae60',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
        marginHorizontal: 10,
        marginBottom: 10,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'outfit-medium',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'outfit-medium',
        color: '#666',
    },
    ageBadge: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        backgroundColor: '#27ae60',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    ageBadgeText: {
        color: 'white',
        fontFamily: 'outfit-bold',
        fontSize: 13,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'outfit-bold',
        color: '#333',
    },
    modalBody: {
        maxHeight: '100%',
    },
    imageUploadButton: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        backgroundColor: '#f8f9fa',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FF6B35',
        borderStyle: 'dashed',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        fontFamily: 'outfit-medium',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        fontFamily: 'outfit-regular',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    picker: {
        height: 50,
    },
    submitButton: {
        backgroundColor: '#FF6B35',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'outfit-bold',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateText: {
        fontSize: 16,
        fontFamily: 'outfit-regular',
        color: '#222',
    },
    datePlaceholder: {
        fontSize: 16,
        fontFamily: 'outfit-regular',
        color: '#666',
    },
    debugContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
    },
    debugTitle: {
        fontSize: 18,
        fontFamily: 'outfit-bold',
        color: '#222',
        marginBottom: 10,
    },
    debugText: {
        fontSize: 16,
        fontFamily: 'outfit-regular',
        color: '#666',
    },
});