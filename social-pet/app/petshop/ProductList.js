import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
//import productsData from './productsData';
import { useCart } from './CartContext';
import PetShopHeader from './PetShopHeader';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useEffect } from 'react';


const numColumns = 2;
const CARD_MARGIN = 10;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_MARGIN * (numColumns + 1)) / numColumns;

const animalTypes = [
  { label: 'Tümü', value: 'Tümü' },
  { label: 'Köpek', value: 'Dogs' },
  { label: 'Kedi', value: 'Cats' },
  { label: 'Kuş', value: 'Birds' },
  { label: 'Balık', value: 'Fishes' },
  { label: 'Hamster', value: 'Hamsters' },
];

const getTurkishAnimalType = (englishType) => {
  const typeMap = {
    'Dogs': 'Köpek',
    'Cats': 'Kedi',
    'Birds': 'Kuş',
    'Fishes': 'Balık',
    'Hamsters': 'Hamster'
  };
  return typeMap[englishType] || englishType;
};

export default function ProductList() {
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const [selectedType, setSelectedType] = useState('Tümü');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);
  

  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, 'Products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('productsList:', productsList);  // ← BUNU EKLE!
      setProducts(productsList);
    } catch (e) {
      console.error('Ürünler çekilemedi:', e);
    } finally {
      setLoading(false);
    }
  };
  

  // Tür filtresi uygula
  const filteredProducts =
  selectedType === 'Tümü'
    ? products
    : products.filter(p => p.animalType === selectedType);


  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
      activeOpacity={0.95}
    >
      <View style={styles.imgWrapper}>
        <Image source={{ uri: item.image }} style={styles.img} />
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price} TL</Text>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>{getTurkishAnimalType(item.animalType)}</Text>
        </View>
        <TouchableOpacity
          style={styles.cartAddBtn}
          onPress={async () => await addToCart(item)}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.cartAddText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PetShopHeader title="Pet Shop" />
      
      {/* Filtre Barı - Sabit yükseklikte bir View içine alıyoruz */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {animalTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterBtn,
                selectedType === type.value && styles.filterBtnActive
              ]}
              onPress={() => setSelectedType(type.value)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterBtnText,
                selectedType === type.value && styles.filterBtnTextActive
              ]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ürün Listesi - marginTop ile filtre barından sonra başlamasını sağlıyoruz */}
      {loading ? (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Ürünler yükleniyor...</Text>
      </View>
    ) : (
      console.log('filteredProducts:', filteredProducts),
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f6faff' 
  },
  // Filtre barı için sabit yükseklik
  filterContainer: {
    height: 50, // Sabit yükseklik
    justifyContent: 'center',
  },
  filterScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 10,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: CARD_WIDTH,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    shadowColor: '#ffb88a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#ffe6a7',
    margin: CARD_MARGIN / 2,
    marginBottom: 16,
    transition: 'transform 0.1s',
  },
  imgWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff3ea',
    marginBottom: 12,
    shadowColor: '#ffb88a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoSection: {
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'outfit-bold',
  },
  price: {
    fontSize: 15,
    color: '#7b7b7b',
    marginBottom: 8,
    fontWeight: 'bold',
    fontFamily: 'outfit-medium',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#50C878',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 12,
    marginTop: 2,
    alignSelf: 'center',
    shadowColor: '#ffb88a',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  typeChipText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'outfit-medium',
    letterSpacing: 0.2,
  },
  cartAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b35',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 7,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#ffb88a',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 2,
  },
  cartAddText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'outfit-bold',
    letterSpacing: 0.3,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    height: 40,
    backgroundColor: '#ccc'
  },
  filterBtnActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35'
  },
  filterBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  filterBtnTextActive: {
    color: '#fff'
  },
});