import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useCart } from './CartContext';
import PetShopHeader from './PetShopHeader';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';

const { width, height } = Dimensions.get('window');

export default function ProductDetails() {
  const route = useRoute();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Check if product is passed directly from ProductList
        if (route.params?.product) {
          setProduct(route.params.product);
          setLoading(false);
          return;
        }
        
        // Fallback: fetch from Firestore if productId is provided
        if (route.params?.productId) {
          const productDoc = await getDoc(doc(db, 'Products', route.params.productId));
          
          if (productDoc.exists()) {
            setProduct({ id: productDoc.id, ...productDoc.data() });
          }
        }
      } catch (error) {
        console.error('Ürün detayları yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [route.params]);

  if (loading) {
    return (
      <View style={[styles.bg, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.bg, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Ürün bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <PetShopHeader title="Ürün Detayı" />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
      >
        {/* Görsel */}
        <View style={styles.imgBox}>
          <Image
            source={{ uri: product.image }}
            style={styles.img}
            resizeMode="cover"
          />
        </View>

        {/* Bilgi */}
        <View style={styles.infoBox}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{product.price} TL</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tür:</Text>
            <Text style={styles.value}>{product.animalType}</Text>
          </View>
          {product.weight && (
            <View style={styles.row}>
              <Text style={styles.label}>Gramaj:</Text>
              <Text style={styles.value}>{product.weight}</Text>
            </View>
          )}
          <Text style={styles.details}>{product.description}</Text>
        </View>

        {/* Sepete Ekle */}
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={async () => await addToCart(product)}
        >
          <Text style={styles.cartBtnText}>SEPETE EKLE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imgBox: {
    width: width,
    height: height * 0.32,
    backgroundColor: '#ede3b3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    position: 'relative'
  },
  img: {
    width: width,
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 18,
    right: 26,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 7,
    zIndex: 10
  },
  infoBox: {
    padding: 22,
    paddingBottom: 0,
    marginTop: -15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  title: {
    fontSize: 30,
    letterSpacing: 1,
    marginBottom: 5,
    fontFamily: 'outfit-medium',
  },
  price: {
    fontSize: 21,
    color: '#ff6b35',
    marginBottom: 10,
    fontFamily: 'outfit-medium',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 6
  },
  value: {
    fontSize: 15,
    color: '#222'
  },
  details: {
    fontSize: 17,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 22,
    marginTop: 8,
    fontFamily: 'outfit-regular',
  },
  cartBtn: {
    backgroundColor: '#ff6b35',
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  cartBtnText: {
    fontSize: 25,
    letterSpacing: 2,
    fontFamily: 'outfit-bold',
    color: '#fff',
  },
});
