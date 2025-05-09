import { View, Text, Image, Alert } from "react-native";
import React from "react";
import Colors from "../../constants/Colors";
import { Pressable } from "react-native";
import * as WebBrowser from 'expo-web-browser'
import { Link } from "expo-router";
import {useOAuth} from "@clerk/clerk-expo"
import * as Linking from 'expo-linking'
import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

export const useWarmUpBrowser = () => {
    React.useEffect(() => {
      // Warm up the android browser to improve UX
      // https://docs.expo.dev/guides/authentication/#improving-user-experience
      void WebBrowser.warmUpAsync()
      return () => {
        void WebBrowser.coolDownAsync()
      }
    }, [])
  }
  
WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {

  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { isSignedIn, signOut } = useAuth();

  const onPress = useCallback(async () => {
    try {
      if (isSignedIn) {
        await signOut(); // çıkış yap
      }

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)/home", { scheme: "myapp" }),
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
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
            marginTop: 100,
            width: "100%",
            borderRadius: 14,
          }}
        >
          <Text style={{ fontFamily: "outfit-medium", fontSize: 20, textAlign: "center", color: "white" }}>
            Giriş Yap
          </Text>
        </Pressable>
      </View>
    </View>
  );
}