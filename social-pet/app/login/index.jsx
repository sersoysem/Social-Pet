import { View, Text, Image, ImageBackground, Alert, SafeAreaView } from "react-native";
import React, { useEffect, useCallback } from "react";
import Colors from "../../constants/Colors";
import { Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Clerk } from "@clerk/clerk-expo";
import TinderImage from "../../assets/images/tinder.jpg";


export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();


export default function LoginScreen() {
  const { isSignedIn } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Clerk ile login kontrolü
      if (isSignedIn) {
        router.replace("/(tabs)/home");
        return;
      }
      // 2. Email login kontrolü (AsyncStorage)
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        router.replace("/(tabs)/home");
      }
    };
    checkAuth();
  }, [isSignedIn]);


  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      if (isSignedIn && user) {
        const userData = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          imageUrl: user.imageUrl,
          loginType: "google",
        };
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        router.replace("/(tabs)/home");
      } else {
        const storedData = await AsyncStorage.getItem("userData");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData?.email && parsedData?.id) {
            router.replace("/(tabs)/home");
          }
        }
      }
    } catch (error) {
      console.error("Oturum kontrolü sırasında hata:", error);
    }
  };

  const onPress = useCallback(async () => {
    try {
      if (isSignedIn) {
        await signOut();
        await AsyncStorage.removeItem("userData");
      }
  
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)/home", { scheme: "myapp" }),
      });
  
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
  
        // Clerk Expo'da user'a useUser ile ulaşılır!
        // Burada sadece router.replace çağır
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 1000); // (kısa gecikme, user hook update için)
      } else {
        Alert.alert("Oturum Başlatılamadı", "Lütfen tekrar deneyin.");
      }
    } catch (err) {
      console.error("OAuth error", err);
      Alert.alert("Giriş Hatası", "Tekrar giriş yapılırken bir hata oluştu.");
    }
  }, [isSignedIn]);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', zIndex: 1 }}>
          <Image
            source={TinderImage}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
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
          }}>
            <Text style={{ fontFamily: "outfit-bold", fontSize: 22, textAlign: "center", marginBottom: 12 }}>
              Yeni arkadaşlar edinmeye hazır mısın?
            </Text>
            <Text style={{ fontFamily: "outfit-medium", fontSize: 16, textAlign: "center", color: Colors.GRAY, marginBottom: 32 }}>
              Evcil dostunla birlikte sosyalleşmenin, oyun arkadaşları bulmanın en keyifli yolu burada seni bekliyor!
            </Text>
            <Pressable
              onPress={onPress}
              style={{
                backgroundColor: '#FF6B35',
                paddingVertical: 16,
                width: "100%",
                borderRadius: 16,
                marginBottom: 16,
                shadowColor: '#FF6B35',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text style={{ fontFamily: "outfit-bold", fontSize: 20, textAlign: "center", color: "white" }}>
                Google ile Giriş Yap
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/login/email-login")}
              style={{
                backgroundColor: '#fff',
                paddingVertical: 20,
                width: "100%",
                borderRadius: 16,
                borderColor: '#ff6b35',
                borderWidth: 1,
              }}
            >
              <Text style={{ fontFamily: "outfit-bold", fontSize: 20, textAlign: "center", color: '#ff6b35', }}>
                E-posta ile Giriş Yap
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
