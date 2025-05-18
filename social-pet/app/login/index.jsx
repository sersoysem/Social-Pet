import { View, Text, Image, Alert } from "react-native";
import React, { useEffect, useCallback } from "react";
import Colors from "../../constants/Colors";
import { Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Clerk } from "@clerk/clerk-expo";


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
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <Image
        source={require("../images/resim7.jpg")}
        style={{
          width: "100%",
          height: "50%",
          resizeMode: "cover",
          marginTop: 50,
        }}
      />
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ fontFamily: "outfit-medium", fontSize: 30, textAlign: "center" }}>
          Yeni arkadaşlar edinmeye hazır mısın?
        </Text>
        <Text style={{ fontFamily: "outfit-medium", fontSize: 16, textAlign: "center", color: Colors.GRAY, marginTop: 10 }}>
          Evcil dostunla birlikte sosyalleşmenin, oyun arkadaşları bulmanın en keyifli yolu burada seni bekliyor!
        </Text>

        <Pressable
          onPress={onPress}
          style={{
            backgroundColor: Colors.PRIMARY,
            padding: 14,
            marginTop: 70,
            width: "100%",
            borderRadius: 14,
          }}
        >
          <Text style={{ fontFamily: "outfit-medium", fontSize: 20, textAlign: "center", color: "white" }}>
            Google ile Giriş Yap
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/login/email-login")}
          style={{
            backgroundColor: Colors.GRAY,
            padding: 14,
            marginTop: 20,
            width: "100%",
            borderRadius: 14,
          }}
        >
          <Text style={{ fontFamily: "outfit-medium", fontSize: 20, textAlign: "center", color: "white" }}>
            E-posta ile Giriş
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
