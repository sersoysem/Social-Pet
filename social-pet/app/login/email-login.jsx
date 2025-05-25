import React, { useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, Image, SafeAreaView } from "react-native";
import Colors from "../../constants/Colors";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useRouter, useNavigation } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shared from '../../Shared/Shared';
import Resim7 from '../images/resim7.jpg';

export default function EmailLoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerTitle: 'E-Posta' });
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error('Oturum kontrolü sırasında hata:', error);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'Users');
      const userQuery = query(usersRef, 
        where('email', '==', email), 
        where('password', '==', password)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        Alert.alert("Giriş Hatası", "E-posta veya şifre yanlış.");
        setLoading(false);
        return;
      }

      const petsRef = collection(db, 'Pets');
      const petQuery = query(petsRef, where('email', '==', email));
      const petSnapshot = await getDocs(petQuery);

      let userData = {};
      
      if (!petSnapshot.empty) {
        const petData = petSnapshot.docs[0].data();
        userData = {
          id: petSnapshot.docs[0].id,
          email: petData.email,
          name: petData.uname,
          imageUrl: petData.pp,
          loginType: 'email',
        };
      } else {
        const userDataFromDB = userSnapshot.docs[0].data();
        userData = {
          id: userSnapshot.docs[0].id,
          email: userDataFromDB.email,
          name: userDataFromDB.name,
          loginType: 'email',
        };
      }

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await Shared.GetFavList(userData.email); // ← favori dokümanı yoksa oluşturur
      router.replace("/(tabs)/home");

    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', zIndex: 1 }}>
          <Image
            source={Resim7}
            style={{
              width: '90%',
              height: '90%',
              resizeMode: 'cover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: Colors.WHITE,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            paddingVertical: 40,
            paddingHorizontal: 24,
            width: '100%',
            minHeight: '48%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
            marginTop: 25,
            zIndex: 2,
            paddingTop: 25,
          }}>
            <Text style={{ fontFamily: "outfit-bold", fontSize: 22, textAlign: "center", marginBottom: 30, color: '#FF6B35' }}>
              E-posta ile Giriş
            </Text>
            <TextInput
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                width: "100%",
                borderWidth: 1,
                borderColor: '#ff6b35',
                borderRadius: 8,
                padding: 14,
                marginBottom: 15,
                fontSize: 16,
                backgroundColor: '#fcf7f5',
              }}
            />
            <TextInput
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                width: "100%",
                borderWidth: 1,
                borderColor: '#ff6b35',
                borderRadius: 8,
                padding: 14,
                marginBottom: 32,
                fontSize: 16,
                backgroundColor: '#fcf7f5',
              }}
            />
            <Pressable
              onPress={handleEmailLogin}
              style={{
                backgroundColor: '#FF6B35',
                paddingVertical: 16,
                width: "100%",
                borderRadius: 16,
                opacity: loading ? 0.7 : 1,
                marginBottom: 16,
              }}
              disabled={loading}
            >
              <Text style={{ fontFamily: "outfit-bold", fontSize: 20, textAlign: "center", color: "white", }}>
                Giriş Yap
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
