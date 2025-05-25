import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCart } from './CartContext';
import { Ionicons } from '@expo/vector-icons';
import PetShopHeader from './PetShopHeader';

const { width } = Dimensions.get('window');

export default function Cart() {
  const navigation = useNavigation();
  const router = useRouter();
  const { cart, removeFromCart, updateQty, clearCart, user, loading, currentUserEmail } = useCart();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleUpdateQty = async (id, newQty) => {
    await updateQty(id, newQty);
  };

  const handleRemoveFromCart = async (id) => {
    await removeFromCart(id);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image }} style={styles.img} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price} TL</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity - 1)}>
            <Ionicons name="remove-circle" size={22} color="red" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity + 1)}>
            <Ionicons name="add-circle" size={22} color="green" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)}>
        <Ionicons name="trash" size={22} color="#ff6b35" />
      </TouchableOpacity>
    </View>
  );

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <View style={styles.bg}>
        <PetShopHeader title="Sepetim" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Sepet yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Show message if user is not authenticated
  if (!currentUserEmail) {
    return (
      <View style={styles.bg}>
        <PetShopHeader title="Sepetim" />
        <View style={styles.emptyBox}>
          <Ionicons name="person-circle-outline" size={60} color="#ff6b35" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, color: '#bbb', fontStyle: 'italic' }}>
            Sepetinizi görüntülemek için giriş yapın.
          </Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <PetShopHeader title="Sepetim" />
      {cart.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cart-outline" size={60} color="#ff6b35" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, color: '#bbb', fontStyle: 'italic' }}>Sepetiniz boş.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Toplam:</Text>
            <Text style={styles.totalPrice}>{total} TL</Text>
          </View>
          <View style={styles.actionBox}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutText}>Ödeme Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
              <Ionicons name="close-circle-outline" size={19} color="red" />
              <Text style={{ color: 'red', marginLeft: 7, fontWeight: 'bold' }}>Sepeti Temizle</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f6faff'
  },
  list: {
    padding: 18,
    paddingBottom: 8
  },
  item: {
    backgroundColor: '#f6f6f6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 18,
    shadowColor: '#ff6b35',
    shadowOpacity: 0.07,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fae0d7',
    minHeight: 90,
    maxWidth: width - 36
  },
  img: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ede3b3'
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ff6b35'
  },
  price: {
    fontSize: 15,
    color: '#7b7b7b',
    fontWeight: 'bold',
    marginTop: 1
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  qtyBtn: {
    padding: 2
  },
  qtyText: {
    fontSize: 17,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#222'
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 10,
    backgroundColor: '#ededed',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  totalPrice: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#ff6b35'
  },
  actionBox: {
    width: '100%',
    backgroundColor: '#ededed',
    paddingVertical: 18,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtn: {
    backgroundColor: 'green',
    borderRadius: 15,
    marginTop: 0,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 47,
    width: '90%',
    elevation: 2,
    shadowColor: '#1abc9c',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3
  },
  checkoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10
  },
  loginBtn: {
    backgroundColor: '#ff6b35',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginTop: 20
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
