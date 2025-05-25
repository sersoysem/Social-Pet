import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from './CartContext';
import PetShopHeader from './PetShopHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Checkout() {
  const navigation = useNavigation();
  const { cart, clearCart } = useCart();

  // Adres state
  const [addressName, setAddressName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Kart state
  const [cardName, setCardName] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const [showAddAddress, setShowAddAddress] = useState(true);
  const [showAddCard, setShowAddCard] = useState(true);

  const total = cart.reduce((acc, item) => acc + item.price * (item.quantity || item.qty || 1), 0);

  // İlk açılışta kayıtlı adres/kartları yükle
  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const addresses = await AsyncStorage.getItem('addresses');
      const cards = await AsyncStorage.getItem('cards');
      if (addresses) setSavedAddresses(JSON.parse(addresses));
      if (cards) setSavedCards(JSON.parse(cards));
    } catch (e) {}
  };

  // Adres kaydet
  const handleSaveAddress = async () => {
    if (
      !addressName.trim() ||
      !city.trim() ||
      !district.trim() ||
      !neighborhood.trim() ||
      !addressDetail.trim()
    ) {
      Alert.alert('Uyarı', 'Tüm adres alanlarını doldurun.');
      return;
    }
    const newAddress = { addressName, city, district, neighborhood, addressDetail };
    const updated = [...savedAddresses, newAddress];
    setSavedAddresses(updated);
    await AsyncStorage.setItem('addresses', JSON.stringify(updated));
    setShowAddAddress(false);
    setSelectedAddress(newAddress);
    Alert.alert('Başarılı', 'Adres kaydedildi!');
  };

  // Kart kaydet
  const handleSaveCard = async () => {
    if (
      !cardName.trim() ||
      !cardHolder.trim() ||
      !cardNumber.trim() ||
      !cardExpiry.trim() ||
      !cardCVC.trim()
    ) {
      Alert.alert('Uyarı', 'Tüm kart alanlarını doldurun.');
      return;
    }
    // Kart numarası kontrol
    const cardNum = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNum)) {
      Alert.alert('Hata', 'Kart numarası 16 haneli olmalı.');
      return;
    }
    // Tarih kontrol (AA/YY)
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      Alert.alert('Hata', 'Tarih formatı AA/YY olmalı.');
      return;
    }
    const [ay, yil] = cardExpiry.split('/').map(Number);
    const now = new Date();
    const thisYear = now.getFullYear() % 100;
    const thisMonth = now.getMonth() + 1;
    if (ay < 1 || ay > 12) {
      Alert.alert('Hata', 'Ay değeri 01-12 olmalı.');
      return;
    }
    if (yil < thisYear || (yil === thisYear && ay < thisMonth)) {
      Alert.alert('Hata', 'Kartın son kullanma tarihi geçmiş.');
      return;
    }
    if (!/^\d{3}$/.test(cardCVC)) {
      Alert.alert('Hata', 'CVC 3 haneli olmalı.');
      return;
    }
    const newCard = {
      cardName,
      cardHolder,
      cardNumber: cardNum,
      cardExpiry,
      cardCVC
    };
    const updated = [...savedCards, newCard];
    setSavedCards(updated);
    await AsyncStorage.setItem('cards', JSON.stringify(updated));
    setShowAddCard(false);
    setSelectedCard(newCard);
    Alert.alert('Başarılı', 'Kart kaydedildi!');
  };

  // Siparişi tamamla
  const handlePayment = async () => {
    if (!selectedAddress) {
      Alert.alert('Eksik', 'Bir teslimat adresi seçin veya ekleyin.');
      return;
    }
    if (!selectedCard) {
      Alert.alert('Eksik', 'Bir kart seçin veya ekleyin.');
      return;
    }
    // Sipariş bilgilerini kaydet
    const order = {
      orderId: Math.floor(100000 + Math.random() * 900000), // basit sipariş no
      items: cart,
      total: cart.reduce((acc, item) => acc + item.price * (item.quantity || item.qty || 1), 0)
    };
    await AsyncStorage.setItem('lastOrder', JSON.stringify(order));
    clearCart();
    Alert.alert('Başarılı', 'Siparişiniz oluşturuldu!');
    navigation.replace('OrderSuccess');
  };
  
  // Kartı maskele (**** **** **** 1234)
  const maskCard = (number) =>
    `**** **** **** ${number.slice(-4)}`;

  return (
    <View style={{flex:1, backgroundColor: '#f6faff'}}>
      <PetShopHeader title="Ödeme" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Kayıtlı Adresler */}
          <Text style={styles.title}>Teslimat Adresini Seç</Text>
          {savedAddresses.length > 0 && (
            <FlatList
              data={savedAddresses}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.savedItem,
                    selectedAddress === item && styles.selectedItem
                  ]}
                  onPress={() => {
                    setSelectedAddress(item);
                    setShowAddAddress(false);
                  }}
                >
                  <Text style={styles.savedItemName}>{item.addressName}</Text>
                  <Text style={styles.savedItemDetail}>{item.city}, {item.district}, {item.neighborhood}</Text>
                  <Text style={styles.savedItemDetail}>{item.addressDetail}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_, i) => i.toString()}
              style={{marginBottom:8}}
            />
          )}
          {/* Yeni Adres Formu */}
          {showAddAddress && (
            <View style={styles.formBox}>
              <TextInput
                style={styles.input}
                placeholder="Adres adı (Ev, İş vb)"
                value={addressName}
                onChangeText={setAddressName}
              />
              <TextInput
                style={styles.input}
                placeholder="İl"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={styles.input}
                placeholder="İlçe"
                value={district}
                onChangeText={setDistrict}
              />
              <TextInput
                style={styles.input}
                placeholder="Mahalle"
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
              <TextInput
                style={styles.input}
                placeholder="Adres detayı (Apartman, kat, daire vb)"
                value={addressDetail}
                onChangeText={setAddressDetail}
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
          {!showAddAddress && (
            <TouchableOpacity style={styles.addBtn} onPress={()=>setShowAddAddress(true)}>
              <Text style={styles.addBtnText}>+ Yeni Adres Ekle</Text>
            </TouchableOpacity>
          )}

          {/* Kayıtlı Kartlar */}
          <Text style={styles.title}>Kart Seçimi</Text>
          {savedCards.length > 0 && (
            <FlatList
              data={savedCards}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.savedItem,
                    selectedCard === item && styles.selectedItem
                  ]}
                  onPress={() => {
                    setSelectedCard(item);
                    setShowAddCard(false);
                  }}
                >
                  <Text style={styles.savedItemName}>{item.cardName}</Text>
                  <Text style={styles.savedItemDetail}>{maskCard(item.cardNumber)}</Text>
                  <Text style={styles.savedItemDetail}>{item.cardHolder}</Text>
                  <Text style={styles.savedItemDetail}>SKT: {item.cardExpiry}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_, i) => i.toString()}
              style={{marginBottom:8}}
            />
          )}
          {/* Yeni Kart Formu */}
          {showAddCard && (
            <View style={styles.formBox}>
              <TextInput
                style={styles.input}
                placeholder="Kart adı (Kendi kartım, Kayıtlı Kart 1, vb)"
                value={cardName}
                onChangeText={setCardName}
              />
              <TextInput
                style={styles.input}
                placeholder="Kart Üzerindeki İsim"
                value={cardHolder}
                onChangeText={setCardHolder}
              />
              <TextInput
                style={styles.input}
                placeholder="Kart Numarası (16 hane)"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={16}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, {flex:1, marginRight:8}]}
                  placeholder="AA/YY"
                  value={cardExpiry}
                  onChangeText={(text) => {
                    // Remove any non-digit characters
                    const numbers = text.replace(/\D/g, '');
                    
                    // Format the input
                    let formatted = numbers;
                    if (numbers.length > 2) {
                      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
                    }
                    
                    setCardExpiry(formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, {flex:1}]}
                  placeholder="CVC"
                  value={cardCVC}
                  onChangeText={setCardCVC}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCard}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
          {!showAddCard && (
            <TouchableOpacity style={styles.addBtn} onPress={()=>setShowAddCard(true)}>
              <Text style={styles.addBtnText}>+ Yeni Kart Ekle</Text>
            </TouchableOpacity>
          )}

          {/* Sipariş Özeti */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Toplam Tutar:</Text>
            <Text style={styles.summaryPrice}>{total} TL</Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
            <Text style={styles.payBtnText}>Ödeme Yap ve Siparişi Tamamla</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 15 }}>Geri Dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginTop: 15,
    marginBottom: 6,
    fontFamily: 'outfit-bold'
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 11,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#fae0d7',
    marginBottom: 11,
    fontFamily: 'outfit-regular'
  },
  saveBtn: {
    backgroundColor: '#ff6b35',
    padding: 10,
    borderRadius: 9,
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-end',
    minWidth: 80
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  addBtn: {
    backgroundColor: 'green',
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-end',
    minWidth: 125
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  formBox: {
    backgroundColor: '#f2f6fc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12
  },
  savedItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#b7fa98',
    minWidth: 140,
    minHeight: 55,
    marginBottom: 3
  },
  selectedItem: {
    borderColor: '#1abc9c',
    backgroundColor: '#d8f5e5'
  },
  savedItemName: {
    fontWeight: 'bold',
    color: 'green',
    fontSize: 15
  },
  savedItemDetail: {
    fontSize: 12,
    color: '#444'
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e3f9f5',
    marginTop: 20,
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#666'
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35'
  },
  payBtn: {
    backgroundColor: 'green',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    height: 47,
    marginTop: 8
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17
  },
  backBtn: {
    alignSelf: 'center',
    marginTop: 18
  }
});
