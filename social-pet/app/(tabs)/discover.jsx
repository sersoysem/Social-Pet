import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Modal, Animated } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import GiftedChat from 'react-native-gifted-chat';
import { sendLocalNotification } from '../../config/NotificationConfig';

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
    const swiperRef = useRef(null);
    const [showHeart, setShowHeart] = useState(false);
    const [showX, setShowX] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;
    const xScale = useRef(new Animated.Value(0)).current;

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
                    const matchId = change.doc.id;
                    
                    // Bu match daha önce gösterildi mi kontrol et
                    try {
                        const shownMatches = await AsyncStorage.getItem('shownMatches');
                        const shownMatchesArray = shownMatches ? JSON.parse(shownMatches) : [];
                        
                        if (shownMatchesArray.includes(matchId)) {
                            // Bu match zaten gösterildi, modal'ı gösterme
                            return;
                        }
                        
                        // Yeni match, modal'ı göster ve kaydet
                        const otherEmail = matchData.users.filter(u => u !== localUser.email)[0];
                        const userDoc = await getDoc(doc(db, 'Users', otherEmail));
                        setOtherUserName(userDoc.exists() ? userDoc.data().name || userDoc.data().uname || otherEmail : otherEmail);
                        setMatchModal({ ...matchData, id: matchId });
                        
                        // Bu match'i gösterildi olarak işaretle
                        shownMatchesArray.push(matchId);
                        await AsyncStorage.setItem('shownMatches', JSON.stringify(shownMatchesArray));
                        
                    } catch (error) {
                        console.error('Match tracking error:', error);
                        // Hata durumunda modal'ı yine de göster
                        const otherEmail = matchData.users.filter(u => u !== localUser.email)[0];
                        const userDoc = await getDoc(doc(db, 'Users', otherEmail));
                        setOtherUserName(userDoc.exists() ? userDoc.data().name || userDoc.data().uname || otherEmail : otherEmail);
                        setMatchModal({ ...matchData, id: matchId });
                    }
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
                
                // Bildirim gönder
                sendLocalNotification(
                    'Yeni Eşleşme! 🎉',
                    `${swipedPetData.name} ile eşleştiniz!`,
                    { type: 'match' }
                );
                
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

    const handleSwipeAnimation = (direction) => {
        if (direction === 'right') {
            setShowHeart(true);
            Animated.sequence([
                Animated.timing(heartScale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(heartScale, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShowHeart(false);
            });
        } else {
            setShowX(true);
            Animated.sequence([
                Animated.timing(xScale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(xScale, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShowX(false);
            });
        }
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
                                color={selectedPetType === type.id ? '#ff6b35' : '#666'}
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
                                backgroundColor: '#ff6b35',
                                padding: 12,
                                borderRadius: 20,
                            }}
                            onPress={fetchPets}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tekrar Gözden Geçir</Text>
                        </TouchableOpacity>
                    </View>
                ) : pets.length > 0 ? (
                    <>
                    <Swiper
                        ref={swiperRef}
                        cards={pets}
                        renderCard={(pet) => (
                            <View style={styles.card}>
                                <View style={styles.cardImageContainer}>
                                    <Image
                                        source={{ uri: pet.imageUrl }}
                                        style={styles.cardImage}
                                    />
                                    <View style={styles.ageBadge}>
                                        <Text style={styles.ageText}>{pet.age}</Text>
                                        <Text style={styles.ageLabel}>Yaş</Text>
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    
                                    <View style={styles.infoContainer}>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="paw" size={20} color="#ff6b35" style={styles.icon} />
                                            <Text style={styles.infoLabel}>Türü: </Text>
                                            <Text style={styles.infoText}>{pet.breed || 'Belirtilmemiş'}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Ionicons name="location" size={20} color="#ff6b35" style={styles.icon} />
                                            <Text style={styles.infoLabel}>Konum: </Text>
                                            <Text style={styles.infoText}>{pet.address || 'Belirtilmemiş'}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Ionicons name="heart" size={20} color="#ff6b35" style={styles.icon} />
                                            <Text style={styles.infoLabel}>Hakkında: </Text>
                                            <Text style={styles.infoText} numberOfLines={2} ellipsizeMode="tail">
                                                {pet.about || 'Belirtilmemiş'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                        onSwipedLeft={(cardIndex) => {
                            handleSwipeAnimation('left');
                            handleSwipe('left', pets[cardIndex]);
                        }}
                        onSwipedRight={(cardIndex) => {
                            handleSwipeAnimation('right');
                            handleSwipe('right', pets[cardIndex]);
                        }}
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
                    {showHeart && (
                        <Animated.View 
                            style={[
                                styles.swipeAnimation,
                                {
                                    transform: [{
                                        scale: heartScale.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1.5]
                                        })
                                    }],
                                    opacity: heartScale
                                }
                            ]}
                        >
                            <Ionicons name="heart" size={150} color="#1abc9c" />
                        </Animated.View>
                    )}
                    {showX && (
                        <Animated.View 
                            style={[
                                styles.swipeAnimation,
                                {
                                    transform: [{
                                        scale: xScale.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1.5]
                                        })
                                    }],
                                    opacity: xScale
                                }
                            ]}
                        >
                            <Ionicons name="close" size={150} color="#ff4d4d" />
                        </Animated.View>
                    )}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.dislikeButton]}
                            onPress={() => swiperRef.current && swiperRef.current.swipeLeft()}
                        >
                            <Ionicons name="close" size={36} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.likeButton]}
                            onPress={() => swiperRef.current && swiperRef.current.swipeRight()}
                        >
                            <Ionicons name="heart" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    </>
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
                                        <Text style={{ fontSize:15, fontWeight:'bold', color: '#ff6b35' }}>{matchModal.pets[0].name}</Text>
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.PRIMARY }}>♥</Text>
                                    <View style={{ alignItems:'center', marginLeft: 10 }}>
                                        <Image source={{ uri: matchModal.pets[1].imageUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 4 }} />
                                        <Text style={{ fontSize:15, fontWeight:'bold', color: '#ff6b35' }}>{matchModal.pets[1].name}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleStartChat} style={{ marginTop:20, alignSelf:'center', backgroundColor: 'green', padding: 12, borderRadius: 20 }}>
                            <Text style={{ color:'#fff', fontWeight:'bold' }}>Sohbete Başla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMatchModal(null)} style={{ marginTop:10, alignSelf:'center' }}>
                            <Text style={{ color:'red', fontWeight:'bold' }}>Kapat</Text>
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
    filterTextActive: { color: '#ff6b35' },
    swiperContainer: {
        flex: 1,
        marginTop: 10,
    },
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
        overflow: 'hidden',
    },
    cardImageContainer: {
        position: 'relative',
        width: '100%',
        height: '65%',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    ageBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#ff6b35',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: 'center',
        zIndex: 2,
    },
    ageText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'outfit-bold',
        marginRight: 3,
    },
    ageLabel: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'outfit-medium',
        opacity: 0.9,
    },
    cardContent: {
        padding: 26,
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    petName: {
        fontSize: 30,
        fontFamily: 'outfit-bold',
        color: '#ff6b35',
        marginBottom: 15,
        letterSpacing: 0.5,
        textAlign: 'left',
    },
    infoContainer: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        marginRight: 4,
    },
    infoLabel: {
        fontSize: 20,
        color: '#666',
        fontFamily: 'outfit-medium',
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 20,
        color: '#444',
        fontFamily: 'outfit-regular',
        flex: 1,
        lineHeight: 24,
    },
    noPetsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noPetsText: { fontSize: 18, color: '#666' },
    actionButtonsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    dislikeButton: {
        backgroundColor: '#ff4d4d',
    },
    likeButton: {
        backgroundColor: '#1abc9c',
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'outfit-bold',
        letterSpacing: 0.2,
    },
    swipeAnimation: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -75,
        marginTop: -75,
        zIndex: 1000,
        pointerEvents: 'none',
    },
});
