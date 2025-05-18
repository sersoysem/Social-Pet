import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Modal } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import GiftedChat from 'react-native-gifted-chat';

const PET_TYPES = [
    { id: 'all', label: 'Tümü', icon: 'paw' },
    { id: 'Dogs', label: 'Köpek', icon: 'paw' },
    { id: 'Cats', label: 'Kedi', icon: 'paw' },
    { id: 'Birds', label: 'Kuş', icon: 'paw' },
    { id: 'Other', label: 'Diğer', icon: 'paw' },
];

export default function DiscoverScreen() {
    const { user: clerkUser } = useUser();
    const [localUser, setLocalUser] = useState(null); // AsyncStorage için
    const [selectedPetType, setSelectedPetType] = useState('all');
    const [pets, setPets] = useState([]);
    const [loader, setLoader] = useState(false);
    const [myPets, setMyPets] = useState([]); // id ve category tutacak
    const [allSwiped, setAllSwiped] = useState(false);
    const [matchModal, setMatchModal] = useState(null);
    const [otherUserName, setOtherUserName] = useState('');
    const router = useRouter();

    // Kullanıcı bilgisini hem Clerk hem AsyncStorage'dan bul!
    useEffect(() => {
        if (clerkUser && clerkUser.primaryEmailAddress?.emailAddress) {
            setLocalUser({
                email: clerkUser.primaryEmailAddress.emailAddress,
                name: clerkUser.fullName,
                imageUrl: clerkUser.imageUrl,
            });
        } else {
            // AsyncStorage login
            AsyncStorage.getItem('userData').then(res => {
                if (res) {
                    const parsed = JSON.parse(res);
                    setLocalUser(parsed);
                }
            });
        }
    }, [clerkUser]);

    // Kendi petlerini çek
    useEffect(() => {
        const fetchMyPets = async () => {
            if (!localUser?.email) return;
            const q = query(collection(db, 'Pets'), where('email', '==', localUser.email));
            const querySnapshot = await getDocs(q);
            const petsArr = [];
            querySnapshot.forEach(doc => petsArr.push({ id: doc.id, category: doc.data().category }));
            setMyPets(petsArr);
        };
        fetchMyPets();
    }, [localUser]);

    // Hayvanları çek (kategoriye ve kendi petlerine göre)
    useEffect(() => {
        if (localUser?.email) {
            fetchPets();
        }
        // eslint-disable-next-line
    }, [selectedPetType, localUser, myPets]);

    // Eşleşme modalı için gerçek zamanlı dinleme
    useEffect(() => {
        if (!localUser?.email) return;
        const q = query(
            collection(db, 'matches'),
            where('users', 'array-contains', localUser.email)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    const matchData = change.doc.data();
                    // Karşı tarafın emailini bul
                    const otherEmail = matchData.users.filter(u => u !== localUser.email)[0];
                    // Karşı tarafın adını çek
                    const userDoc = await getDoc(doc(db, 'Users', otherEmail));
                    setOtherUserName(userDoc.exists() ? userDoc.data().name || userDoc.data().uname || otherEmail : otherEmail);
                    setMatchModal(matchData);
                }
            });
        });
        return () => unsubscribe();
    }, [localUser]);

    // Petleri getir ve kendi petini çıkar
    const fetchPets = async () => {
        try {
            setLoader(true);
            setAllSwiped(false);
            setPets([]);
            const q = collection(db, 'Pets');
            const querySnapshot = await getDocs(q);
            let petsList = [];
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (
                    data.email !== localUser.email &&
                    !myPets.some(p => p.id === docSnap.id && p.category === data.category) &&
                    (selectedPetType === 'all' || data.category === selectedPetType)
                ) {
                    petsList.push({
                        id: docSnap.id,
                        ...data
                    });
                }
            });
            setPets(petsList);
        } catch (error) {
            console.error('Hayvanlar çekilirken hata oluştu:', error);
        } finally {
            setLoader(false);
        }
    };



// Swipe işlemi (eşleşme vs.)
// Likes koleksiyonuna ekleme ve match kontrolü
const handleSwipe = async (direction, swipedPet) => {
    if (direction !== 'right') return;
    try {
        // 1. Önce kendi like'ını Likes'a ekle (from: localUser.email, to: swipedPet.email)
        await addDoc(collection(db, 'Likes'), {
            from: localUser.email,
            to: swipedPet.email,
            petId: swipedPet.id,
            petCategory: swipedPet.category,
            createdAt: new Date()
        });

        // 2. Karşı taraf da seni like'ladı mı? (from: swipedPet.email, to: localUser.email, petCategory aynı)
        // Ve karşı tarafın like'ladığı pet ID'lerinden biri SENİN petlerinden mi?
        let matchedMyPet = null;
        for (const myPet of myPets.filter(p => p.category === swipedPet.category)) {
            const likeQuery = query(
                collection(db, 'Likes'),
                where('from', '==', swipedPet.email),
                where('to', '==', localUser.email),
                where('petCategory', '==', swipedPet.category),
                where('petId', '==', myPet.id)
            );
            const likeSnap = await getDocs(likeQuery);
            if (!likeSnap.empty) {
                matchedMyPet = myPet;
                break;
            }
        }

        // 3. Sadece karşılıklı like varsa eşleşme oluştur
        if (matchedMyPet) {
            // Daha önce match oluştu mu? (Kopya match'leri engelle)
            const existingMatchQuery = query(
                collection(db, 'matches'),
                where('users', 'array-contains', localUser.email)
            );
            const existingMatchSnap = await getDocs(existingMatchQuery);
            let alreadyMatched = false;
            existingMatchSnap.forEach(doc => {
                const d = doc.data();
                if (
                    d.users.includes(localUser.email) &&
                    d.users.includes(swipedPet.email) &&
                    d.category === swipedPet.category
                ) {
                    alreadyMatched = true;
                }
            });
            if (alreadyMatched) return; // Daha önce match olduysa tekrar ekleme!

            // Eşleşen petlerin detaylarını çek
            const myPetDoc = await getDoc(doc(db, 'Pets', matchedMyPet.id));
            const myPetData = myPetDoc.exists() ? myPetDoc.data() : {};
            const swipedPetDoc = await getDoc(doc(db, 'Pets', swipedPet.id));
            const swipedPetData = swipedPetDoc.exists() ? swipedPetDoc.data() : {};

            await addDoc(collection(db, 'matches'), {
                users: [localUser.email, swipedPet.email],
                category: swipedPet.category,
                createdAt: new Date(),
                pets: [
                    {
                        owner: localUser.email,
                        id: matchedMyPet.id,
                        name: myPetData.name || myPetData.uname || '',
                        category: myPetData.category || '',
                        imageUrl: myPetData.imageUrl || myPetData.pp || ''
                    },
                    {
                        owner: swipedPet.email,
                        id: swipedPet.id,
                        name: swipedPetData.name || swipedPetData.uname || '',
                        category: swipedPetData.category || '',
                        imageUrl: swipedPetData.imageUrl || swipedPetData.pp || ''
                    }
                ]
            });
            console.log(`EŞLEŞME VAR! Kategori: ${swipedPet.category} | Sen: ${localUser.email}, Onlar: ${swipedPet.email}`);
        } else {
            console.log('Karşılıklı like yok, eşleşme olmadı.');
        }
    } catch (error) {
        console.error('Beğenme/Match işlemi sırasında hata:', error);
    }
};

    // Sohbete başla fonksiyonu
    const handleStartChat = async () => {
        if (!matchModal) return;
        const otherEmail = matchModal.users.filter(u => u !== localUser.email)[0];
        // Chat ID: iki email alfabetik sıralı birleştirilir
        const chatId = [localUser.email, otherEmail].sort().join('_');
        // Chat dokümanı var mı kontrol et
        const chatRef = doc(db, 'Chat', chatId);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
            // Karşı tarafın adını ve pp'sini Users'tan çek
            const userDoc = await getDoc(doc(db, 'Users', otherEmail));
            const otherName = userDoc.exists() ? userDoc.data().name || userDoc.data().uname || otherEmail : otherEmail;
            const otherPp = userDoc.exists() ? userDoc.data().pp || userDoc.data().imageUrl || '' : '';
            await setDoc(chatRef, {
                id: chatId,
                users: [
                    {
                        email: localUser.email,
                        name: localUser.name,
                        pp: localUser.imageUrl
                    },
                    {
                        email: otherEmail,
                        name: otherName,
                        pp: otherPp
                    }
                ],
                userIds: [localUser.email, otherEmail],
                lastMessage: "",
                lastMessageTime: null,
                lastMessageSeenBy: []
            });
        }
        setMatchModal(null);
        router.push({ pathname: '/chat', params: { id: chatId } });
    };

    const onSend = async (newMessages = []) => {
        const messageToSave = {
            ...newMessages[0],
            createdAt: new Date(),
            seenBy: [localUser.email], // Gönderen zaten okudu!
            user: {
                _id: localUser.email,
                name: localUser.name,
                avatar: localUser.imageUrl
            }
        };

        // Chat dokümanını da güncelle — Inbox için (son mesaj, zaman, okunanlar, kullanıcılar)
        const chatRef = doc(db, 'Chat', chatId);

        // Karşı tarafın emailini bul
        const docSnap = await getDoc(chatRef);
        const result = docSnap.data();
        const otherUser = result?.users?.filter(
            (item) => item.email !== localUser.email
        );
        const otherEmail = otherUser?.[0]?.email;

        // Güncel kullanıcı bilgilerini çek
        const myInfo = {
            name: localUser.name,
            pp: localUser.imageUrl
        };
        const otherInfo = {
            name: otherEmail ? otherEmail : '',
            pp: otherEmail ? otherEmail : ''
        };

        await updateDoc(chatRef, {
            lastMessage: messageToSave.text || '',
            lastMessageTime: messageToSave.createdAt,
            lastMessageSeenBy: [localUser.email], // Sadece gönderen okumuş olur
            users: [
                {
                    email: localUser.email,
                    name: myInfo.name,
                    pp: myInfo.pp
                },
                {
                    email: otherEmail,
                    name: otherInfo.name,
                    pp: otherInfo.pp
                }
            ]
        });
    };

    return (
        <View style={styles.container}>
            {/* Pet Type Filter */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PET_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.filterButton,
                                selectedPetType === type.id && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedPetType(type.id)}
                        >
                            <Ionicons
                                name={type.icon}
                                size={20}
                                color={selectedPetType === type.id ? Colors.PRIMARY : '#666'}
                            />
                            <Text style={[
                                styles.filterText,
                                selectedPetType === type.id && styles.filterTextActive
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Card Swiper */}
            <View style={styles.swiperContainer}>
                {loader ? (
                    <View style={styles.noPetsContainer}>
                        <Text style={styles.noPetsText}>Yükleniyor...</Text>
                    </View>
                ) : allSwiped ? (
                    <View style={styles.noPetsContainer}>
                        <Text style={styles.noPetsText}>Gösterilecek hayvan kalmadı</Text>
                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: Colors.PRIMARY,
                                padding: 12,
                                borderRadius: 20,
                            }}
                            onPress={fetchPets}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tekrar Gözden Geçir</Text>
                        </TouchableOpacity>
                    </View>
                ) : pets.length > 0 ? (
                    <Swiper
                        cards={pets}
                        renderCard={(pet) => (
                            <View style={styles.card}>
                                <Image
                                    source={{ uri: pet.imageUrl }}
                                    style={styles.cardImage}
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    <Text style={styles.petInfo}>{pet.age}</Text>
                                    <Text style={styles.petDescription}>{pet.about}</Text>
                                </View>
                            </View>
                        )}
                        onSwipedLeft={(cardIndex) => handleSwipe('left', pets[cardIndex])}
                        onSwipedRight={(cardIndex) => handleSwipe('right', pets[cardIndex])}
                        cardIndex={0}
                        backgroundColor={'transparent'}
                        stackSize={3}
                        stackSeparation={15}
                        animateOverlayLabelsOpacity
                        overlayLabels={{
                            left: {
                                title: 'PAS',
                                style: {
                                    label: {
                                        backgroundColor: 'red',
                                        color: 'white',
                                        fontSize: 24
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        marginTop: 30,
                                        marginLeft: -30
                                    }
                                }
                            },
                            right: {
                                title: 'BEĞEN',
                                style: {
                                    label: {
                                        backgroundColor: 'green',
                                        color: 'white',
                                        fontSize: 24
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        marginTop: 30,
                                        marginLeft: 30
                                    }
                                }
                            }
                        }}
                        onSwipedAll={() => setAllSwiped(true)}
                    />
                ) : (
                    <View style={styles.noPetsContainer}>
                        <Text style={styles.noPetsText}>Gösterilecek hayvan bulunamadı</Text>
                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: Colors.PRIMARY,
                                padding: 12,
                                borderRadius: 20,
                            }}
                            onPress={fetchPets}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tekrar Gözden Geçir</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <Modal visible={!!matchModal} transparent animationType="fade">
                <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor:'#fff', padding:30, borderRadius:20, alignItems:'center', maxWidth:340 }}>
                        <Text style={{ fontSize:20, fontWeight:'bold', textAlign:'center' }}>Tebrikler! Eşleştiniz 🎉</Text>
                        {matchModal && matchModal.pets && (
                            <View style={{ marginTop: 15, alignItems: 'center' }}>
                                <Text style={{ fontWeight:'bold', fontSize:16, marginBottom:8, textAlign:'center' }}>
                                    Eşleşen hayvanlarınız:
                                </Text>
                                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center' }}>
                                    <View style={{ alignItems:'center', marginRight: 10 }}>
                                        <Image source={{ uri: matchModal.pets[0].imageUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 4 }} />
                                        <Text style={{ fontSize:15, fontWeight:'bold', color: Colors.PRIMARY }}>{matchModal.pets[0].name}</Text>
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.PRIMARY }}>♥</Text>
                                    <View style={{ alignItems:'center', marginLeft: 10 }}>
                                        <Image source={{ uri: matchModal.pets[1].imageUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 4 }} />
                                        <Text style={{ fontSize:15, fontWeight:'bold', color: Colors.PRIMARY }}>{matchModal.pets[1].name}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleStartChat} style={{ marginTop:20, alignSelf:'center', backgroundColor: Colors.PRIMARY, padding: 12, borderRadius: 20 }}>
                            <Text style={{ color:'#fff', fontWeight:'bold' }}>Sohbete Başla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMatchModal(null)} style={{ marginTop:10, alignSelf:'center' }}>
                            <Text style={{ color:Colors.PRIMARY, fontWeight:'bold' }}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    filterContainer: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    filterButtonActive: { backgroundColor: Colors.PRIMARY + '20' },
    filterText: { marginLeft: 5, color: '#666' },
    filterTextActive: { color: Colors.PRIMARY },
    swiperContainer: { flex: 1 },
    card: {
        width: Dimensions.get('window').width * 0.9,
        height: Dimensions.get('window').height * 0.7,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cardContent: { padding: 15 },
    petName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    petInfo: { fontSize: 16, color: '#666', marginBottom: 10 },
    petDescription: { fontSize: 14, color: '#444' },
    noPetsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noPetsText: { fontSize: 18, color: '#666' },
});
