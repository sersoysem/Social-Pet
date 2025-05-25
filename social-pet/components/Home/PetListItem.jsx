import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { useRouter } from 'expo-router';
import MarkFav from '../MarkFav';
import { normalizeStorageURL } from '../../utils/StorageUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2.; // 50 = padding (20) + gap between cards (10)

export default function PetListItem({ pet }) {
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);
    const [normalizedImageUrl, setNormalizedImageUrl] = useState(pet?.imageUrl);

    useEffect(() => {
        const normalizeImageURL = async () => {
            if (pet?.imageUrl) {
                try {
                    const normalizedUrl = await normalizeStorageURL(pet.imageUrl);
                    setNormalizedImageUrl(normalizedUrl);
                } catch (error) {
                    console.warn('❌ PetListItem URL normalize hatası:', error);
                    setNormalizedImageUrl(pet.imageUrl); // Fallback to original
                }
            }
        };
        
        normalizeImageURL();
    }, [pet?.imageUrl]);

    const handlePetPress = () => {
        router.push({
            pathname: '/pet-details',
            params: { pet: JSON.stringify(pet) }
        });
    };

    return (
        <TouchableOpacity onPress={handlePetPress} style={styles.container}>
            <View style={styles.imageContainer}>
                        <View style={{
                            position:'absolute',
                            zIndex:10,
                            right:10,
                            top:10,
                        }}>
                            <MarkFav pet={pet} color='white' size={20}/>
                        </View>
                <Image 
                    source={{ uri: normalizedImageUrl }} 
                    style={styles.image}
                    onError={(error) => {
                        console.warn('⚠️ PetListItem Image load warning:', error.nativeEvent.error);
                    }}
                />
                <View style={styles.ageContainer}>
                    <Text style={styles.ageText}>{pet.age}</Text>
                    <Text style={styles.ageLabel}>Yaş</Text>
                </View>
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.petName}>{pet.name}</Text>
                <View style={styles.infoContainer}>
                    <View style={styles.breedContainer}>
                        <MaterialIcons name="pets" size={16} color="#666" />
                        <Text style={styles.breedText}>{pet.breed || 'Belirtilmemiş'}</Text>
                    </View>
                    <View style={styles.addressContainer}>
                        <MaterialIcons name="location-on" size={16} color="#666" />
                        <Text style={styles.addressText} numberOfLines={1}>{pet.address || 'Belirtilmemiş'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: cardWidth,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 10,
    },
    imageContainer: {
        position: 'relative',
        height: 180,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favoriteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
        padding: 8,
    },
    ageContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#ff6b35',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: 'center',
    },
    ageText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'outfit-bold',
    },
    ageLabel: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'outfit-regular',
        opacity: 0.9,
    },
    contentContainer: {
        padding: 12,
    },
    petName: {
        fontSize: 18,
        fontFamily: 'outfit-bold',
        color: '#333',
        marginBottom: 12,
    },
    infoContainer: {
        marginBottom: 0,
    },
    breedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    breedText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
        fontFamily: 'outfit-medium',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#666',
        fontFamily: 'outfit-regular',
    },
});