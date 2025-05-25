import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function OrderSuccess() {
  const navigation = useNavigation();
  const [order, setOrder] = useState(null);

  // Sipariş bilgilerini yükle (Ödeme sonrası kaydedilmiş)
  useEffect(() => {
    const fetchOrder = async () => {
      const lastOrder = await AsyncStorage.getItem('lastOrder');
      if (lastOrder) {
        setOrder(JSON.parse(lastOrder));
        // Sipariş sayfası gösterildikten sonra cache'i silmek için:
        setTimeout(() => AsyncStorage.removeItem('lastOrder'), 4000);
      }
    };
    fetchOrder();
  }, []);

  if (!order) {
    return (
      <View style={styles.bg}>
        <Text style={{color:'#bbb', fontStyle:'italic'}}>Sipariş yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      {/* Kutlama */}
      <View style={styles.celebrateBox}>
        <Ionicons name="checkmark-circle" size={70} color="green" />
        <Text style={styles.successText}>Siparişiniz başarıyla alındı!</Text>
        <Text style={styles.infoText}>
          Sipariş numarası: <Text style={{color:'#ff6b35', fontWeight:'bold'}}>#{order.orderId}</Text>
        </Text>
      </View>
      {/* Sipariş Özeti */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Sipariş Özeti</Text>
        <FlatList
          data={order.items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={{flex:1, marginLeft:10}}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>Adet: <Text style={{fontWeight:'bold'}}>{item.qty}</Text></Text>
                <Text style={styles.itemDetails}>Fiyat: <Text style={{fontWeight:'bold'}}>{item.price} TL</Text></Text>
              </View>
              <Text style={styles.itemTotal}>{item.qty * item.price} TL</Text>
            </View>
          )}
          contentContainerStyle={{paddingBottom:16}}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Toplam:</Text>
          <Text style={styles.totalPrice}>{order.total} TL</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.homeBtn} 
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeScreen' }],
          });
        }}
      >
        <Ionicons name="home" size={22} color="#fff" />
        <Text style={styles.homeBtnText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f6faff',
    alignItems: 'center'
  },
  celebrateBox: {
    alignItems: 'center',
    marginTop: 46,
    marginBottom: 14
  },
  successText: {
    color: 'green',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 14,
    fontFamily: 'outfit-bold'
  },
  infoText: {
    color: '#888',
    marginTop: 4,
    fontSize: 16
  },
  summaryBox: {
    backgroundColor: '#fffbe7',
    borderRadius: 18,
    padding: 20,
    width: width - 36,
    minHeight: 190,
    shadowColor: '#e3f9f5',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 14
  },
  summaryTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 9
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e3f9f5'
  },
  itemImg: {
    width: 48,
    height: 48,
    borderRadius: 7,
    backgroundColor: '#ede3b3'
  },
  itemName: {
    fontSize: 16,
    color: '#ff6b35',
    fontWeight: 'bold',
    fontFamily: 'outfit-medium'
  },
  itemDetails: {
    color: '#444',
    fontSize: 14,
    marginTop: 1
  },
  itemTotal: {
    color: '#ff6b35',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 5
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffe6a7',
    paddingTop: 9
  },
  totalLabel: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold'
  },
  totalPrice: {
    fontSize: 20,
    color: '#ff6b35',
    fontWeight: 'bold'
  },
  homeBtn: {
    marginTop: 28,
    backgroundColor: '#ff6b35',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 27,
    paddingVertical: 13
  },
  homeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16
  }
});
