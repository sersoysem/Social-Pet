import { View, Text, TextInput, Alert, SafeAreaView, ScrollView } from "react-native";
import React, { useState } from "react";
import Colors from "../../constants/Colors";
import { Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../config/FireBaseConfig";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Lütfen adınızı girin.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen e-posta adresinizi girin.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      // Önce email'in daha önce kullanılıp kullanılmadığını kontrol et
      const usersRef = collection(db, 'Users');
      const emailQuery = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        Alert.alert("Hata", "Bu e-posta adresi zaten kullanılıyor.");
        setLoading(false);
        return;
      }

      // Benzersiz ID oluştur
      const userId = uuidv4();

      // Firebase Users koleksiyonuna kullanıcı verilerini kaydet
      const userData = {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: password, // Gerçek uygulamada hash'lenmeli
        role: "user",
        createdAt: new Date().toISOString(),
      };

      // Firestore'a kaydet
      await setDoc(doc(db, 'Users', email.toLowerCase().trim()), userData);

      // AsyncStorage'a da kaydet (local login için)
      const localUserData = {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        loginType: "email",
        registeredAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem("userData", JSON.stringify(localUserData));
      
      Alert.alert(
        "Başarılı!", 
        "Hesabınız başarıyla oluşturuldu! Şimdi ilk evcil hayvanınızı ekleyin.",
        [
          {
            text: "Tamam",
            onPress: () => router.replace("/add-new-pet")
          }
        ]
      );
    } catch (error) {
      console.error("Kayıt hatası:", error);
      Alert.alert("Hata", "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24, paddingTop: 60 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Pressable 
              onPress={() => router.back()}
              style={{ marginBottom: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.BLACK} />
            </Pressable>
            <Text style={{ 
              fontFamily: "outfit-bold", 
              fontSize: 28, 
              color: Colors.BLACK,
              marginBottom: 8 
            }}>
              Hesap Oluştur
            </Text>
            <Text style={{ 
              fontFamily: "outfit-medium", 
              fontSize: 16, 
              color: Colors.GRAY 
            }}>
              Evcil dostunla birlikte sosyalleşmeye başla!
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 20 }}>
            {/* Name Input */}
            <View>
              <Text style={{ 
                fontFamily: "outfit-medium", 
                fontSize: 16, 
                color: Colors.BLACK,
                marginBottom: 8 
              }}>
                Ad Soyad
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Adınızı ve soyadınızı girin"
                style={{
                  borderWidth: 1,
                  borderColor: Colors.LIGHT_GRAY,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  fontFamily: "outfit-medium",
                  backgroundColor: Colors.WHITE,
                }}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View>
              <Text style={{ 
                fontFamily: "outfit-medium", 
                fontSize: 16, 
                color: Colors.BLACK,
                marginBottom: 8 
              }}>
                E-posta
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta adresinizi girin"
                style={{
                  borderWidth: 1,
                  borderColor: Colors.LIGHT_GRAY,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  fontFamily: "outfit-medium",
                  backgroundColor: Colors.WHITE,
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View>
              <Text style={{ 
                fontFamily: "outfit-medium", 
                fontSize: 16, 
                color: Colors.BLACK,
                marginBottom: 8 
              }}>
                Şifre
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifrenizi girin (en az 6 karakter)"
                  secureTextEntry={!showPassword}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.LIGHT_GRAY,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontFamily: "outfit-medium",
                    backgroundColor: Colors.WHITE,
                    paddingRight: 50,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: 16, 
                    top: 16 
                  }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={Colors.GRAY} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text style={{ 
                fontFamily: "outfit-medium", 
                fontSize: 16, 
                color: Colors.BLACK,
                marginBottom: 8 
              }}>
                Şifre Tekrar
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Şifrenizi tekrar girin"
                  secureTextEntry={!showConfirmPassword}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.LIGHT_GRAY,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontFamily: "outfit-medium",
                    backgroundColor: Colors.WHITE,
                    paddingRight: 50,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: 16, 
                    top: 16 
                  }}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={Colors.GRAY} 
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Register Button */}
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: loading ? Colors.LIGHT_GRAY : '#FF6B35',
              paddingVertical: 16,
              borderRadius: 12,
              marginTop: 32,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ 
              fontFamily: "outfit-bold", 
              fontSize: 18, 
              textAlign: "center", 
              color: "white" 
            }}>
              {loading ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
            </Text>
          </Pressable>

          {/* Login Link */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: "outfit-medium", fontSize: 16, color: Colors.GRAY }}>
              Zaten hesabın var mı?{' '}
              <Text 
                onPress={() => router.back()}
                style={{ 
                  fontFamily: "outfit-bold", 
                  color: '#FF6B35',
                  textDecorationLine: 'underline'
                }}
              >
                Giriş Yap
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 