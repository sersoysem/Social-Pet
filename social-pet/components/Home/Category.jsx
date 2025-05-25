import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import Colors from '../../constants/Colors'

const { width } = Dimensions.get('window');

const categories = [
    { id: 'Dogs', label: 'Köpek', icon: 'dog', iconType: 'FontAwesome5' },
    { id: 'Cats', label: 'Kedi', icon: 'cat', iconType: 'FontAwesome5' }, 
    { id: 'Birds', label: 'Kuş', icon: 'dove', iconType: 'FontAwesome5' },
    { id: 'Fishes', label: 'Balık', icon: 'fish', iconType: 'FontAwesome5' },
    { id: 'Hamsters', label: 'Hamster', icon: 'paw', iconType: 'FontAwesome5' },
    { id: 'Other', label: 'Diğer', icon: 'pets', iconType: 'MaterialIcons' },
];

export default function Category({ category }) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const handleCategoryPress = (categoryId) => {
        setSelectedCategory(categoryId);
        category(categoryId);
    };

    const renderIcon = (item) => {
        const iconColor = selectedCategory === item.id ? '#fff' : '#ff6b35';
        const iconSize = 24;

        switch(item.iconType) {
            case 'FontAwesome5':
                return <FontAwesome5 name={item.icon} size={iconSize} color={iconColor} />;
            case 'Ionicons':
                return <Ionicons name={item.icon} size={iconSize} color={iconColor} />;
            default:
                return <MaterialIcons name={item.icon} size={iconSize} color={iconColor} />;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kategoriler</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.categoryButton,
                            selectedCategory === item.id && styles.selectedCategory
                        ]}
                        onPress={() => handleCategoryPress(item.id)}
                    >
                        <View style={[
                            styles.iconContainer,
                            selectedCategory === item.id && styles.selectedIconContainer
                        ]}>
                            {renderIcon(item)}
                        </View>
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === item.id && styles.selectedCategoryText
                        ]}>
                            {item.label}
                        </Text>
                        {selectedCategory === item.id && (
                            <View style={styles.selectedIndicator} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
    },
    title: {
        fontSize: 20,
        fontFamily: 'outfit-bold',
        color: '#333',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    scrollContent: {
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
    categoryButton: {
        alignItems: 'center',
        marginRight: 15,
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        minWidth: 90,
    },
    selectedCategory: {
        backgroundColor: '#fff',
        borderColor: '#ff6b35',
        transform: [{ scale: 1.05 }],
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedIconContainer: {
        backgroundColor: '#ff6b35',
        transform: [{ scale: 1.1 }],
    },
    categoryText: {
        fontSize: 14,
        fontFamily: 'outfit-medium',
        color: '#666',
        textAlign: 'center',
    },
    selectedCategoryText: {
        color: '#ff6b35',
        fontFamily: 'outfit-bold',
    },
    selectedIndicator: {
        position: 'absolute',
        bottom: -2,
        left: '50%',
        marginLeft: -15,
        width: 30,
        height: 3,
        backgroundColor: '#ff6b35',
        borderRadius: 1.5,
    },
});
