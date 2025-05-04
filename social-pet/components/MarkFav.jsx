import { View, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import Shared from '../Shared/Shared';
import { useUser } from '@clerk/clerk-expo';

export default function MarkFav({ pet, size, color='black' }) {
    const { user } = useUser();
    const [favList, setFavList] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);

    // Kullanıcının favori listesini getir
    useEffect(() => {
        if (user) {
            GetFav();
        }
    }, [user]);

    // Favori listesi veya pet değiştiğinde, favori olup olmadığını kontrol et
    useEffect(() => {
        setIsFavorite(favList.includes(pet?.id));
    }, [favList, pet]);

    const GetFav = async () => {
        try {
            const result = await Shared.GetFavList(user);
            setFavList(result?.favorites || []);
        } catch (error) {
            console.error('Favoriler alınamadı:', error);
        }
    };

    const ToggleFav = async () => {
        try {
            let updatedFavList;
            if (isFavorite) {
                // Favoriden çıkar
                updatedFavList = favList.filter(id => id !== pet?.id);
            } else {
                // Favoriye ekle
                updatedFavList = [...favList, pet?.id];
            }
            
            await Shared.UpdateFav(user, updatedFavList);
            setFavList(updatedFavList); // Güncel listeyi state'e yansıt
        } catch (error) {
            console.error('Favori güncelleme hatası:', error);
        }
    };

    return (
        <View>
            <Pressable onPress={ToggleFav}>
                <AntDesign 
                    name={isFavorite ? "heart" : "hearto"} 
                    size={size || 30}
                    color={isFavorite ? "red" : color} 
                />
            </Pressable>
        </View>
    );
}
