import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ClerkProvider } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { CartProvider } from './petshop/CartContext'; // Dizinine göre yolunu ayarla

const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🗝️ \n`)
      } else {
        console.log('No values stored under key: ' + key)
      }
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },

  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  }
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env')
  }

  useFonts({
    'outfit': require("../assets/fonts/WinkySans-Regular.ttf"),
    'outfit-bold': require("../assets/fonts/WinkySans-Bold.ttf"),
    'outfit-medium': require("../assets/fonts/WinkySans-Medium.ttf"),
  });

  return (
    <ClerkProvider 
      tokenCache={tokenCache}
      publishableKey={publishableKey}> 
      <CartProvider>
        <Stack>
          <Stack.Screen name="index"/>
          <Stack.Screen name="(tabs)"
            options={{
              headerShown:false
            }}
          />
          <Stack.Screen name="login/index" 
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </CartProvider>
    </ClerkProvider>
  );
}
