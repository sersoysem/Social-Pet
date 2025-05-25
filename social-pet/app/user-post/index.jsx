import { View, Text,FlatList } from 'react-native'
import React from 'react'
import { useNavigation } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../config/FireBaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect,useState } from 'react';
import PetListItem from '../../components/Home/PetListItem';
import { RefreshControl } from 'react-native';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserPost() {
    const navigation = useNavigation();
    const { user } = useUser();
    const [userPostList, setUserPostList] = useState([]);
    const [loader, setLoader] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState(null);
    
    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Evcil Hayvanlarım',
            headerTitleStyle: {
                fontFamily: 'outfit-medium',
                fontSize: 25,
            },
        });
        getUserEmail();
    }, []);

    useEffect(() => {
        if (currentUserEmail) {
            GetUserPost();
        }
    }, [currentUserEmail]);

    const getUserEmail = async () => {
        try {
            if (user?.primaryEmailAddress?.emailAddress) {
                // Clerk kullanıcısı
                setCurrentUserEmail(user.primaryEmailAddress.emailAddress);
            } else {
                // Email/Password kullanıcısı
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setCurrentUserEmail(parsed.email);
                }
            }
        } catch (error) {
            console.error("Kullanıcı email'i alınamadı:", error);
        }
    };

    const GetUserPost = async () => {
        if (!currentUserEmail) return;
        
        setLoader(true);
        const q = query(collection(db, 'Pets'), where('email', '==', currentUserEmail));
        const querySnapshot = await getDocs(q);

        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        setUserPostList(posts);
        setLoader(false);
    };

    const OnDeletePost = async (docId) => {
        Alert.alert('Silmek istediğinize emin misiniz?', 'Bu işlem geri alınamaz.', [
            {
                text: 'İptal',
                onPress: () => console.log('İptal Edildi'),
                style: 'cancel',
            },
            {
                text: 'Sil',
                onPress: () => deletePost(docId),
            }
        ]);
    };

    const deletePost = async (docId) => {
        await deleteDoc(doc(db, 'Pets', docId));
        GetUserPost();
    };

    return (
        <View style={{
            padding: 20,
        }}>
            <FlatList
                data={userPostList}
                keyExtractor={(item) => item.id}
                numColumns={2}
                refreshing={loader}
                onRefresh={GetUserPost}
                contentContainerStyle={{ paddingBottom: 50 }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                renderItem={({ item, index }) => (
                    <View>
                        <PetListItem pet={item} key={index} />
                        <Pressable onPress={() => OnDeletePost(item?.id)} style={styles.deleteButton}>
                            <Text style={styles.deleteText}>Sil</Text>
                        </Pressable>
                    </View>
                )}
            />
            {userPostList?.length === 0 && (
                <Text>Hiç Evcil Hayvanınız Yok</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    deleteButton: {
        backgroundColor: '#faeedc',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 7,
        marginTop: 8,
        width: '40%',
        marginLeft: '20%',
        marginBottom: 10,
    },
    deleteText: {
        fontFamily: 'outfit-medium',
        textAlign: 'center',
        color: '#E76F51',
        fontSize: 16,
    },
});

