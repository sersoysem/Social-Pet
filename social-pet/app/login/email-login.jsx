import React, { useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import Colors from "../../constants/Colors";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/FireBaseConfig';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shared from '../../Shared/Shared';

export default function EmailLoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
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
    <View style={{ flex: 1, backgroundColor: Colors.WHITE, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontFamily: "outfit-medium", fontSize: 28, textAlign: "center", marginBottom: 30 }}>
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
          borderColor: Colors.GRAY,
          borderRadius: 8,
          padding: 10,
          marginBottom: 15,
          fontSize: 16,
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
          borderColor: Colors.GRAY,
          borderRadius: 8,
          padding: 10,
          marginBottom: 20,
          fontSize: 16,
        }}
      />
      <Pressable
        onPress={handleEmailLogin}
        style={{
          backgroundColor: Colors.PRIMARY,
          padding: 14,
          borderRadius: 14,
          opacity: loading ? 0.7 : 1,
        }}
        disabled={loading}
      >
        <Text style={{ fontFamily: "outfit-medium", fontSize: 20, textAlign: "center", color: "white" }}>
          Giriş Yap
        </Text>
      </Pressable>
    </View>
  );
}
