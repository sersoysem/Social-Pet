// petshop/PetShopHeader.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from './CartContext';

export default function PetShopHeader({ title = "PetShop" }) {
  const navigation = useNavigation();
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0);
  
  // Animation refs
  const bounceValue = useRef(new Animated.Value(1)).current;
  const [showSuccess, setShowSuccess] = useState(false);
  const previousCount = useRef(cartCount);

  // Animate cart icon when count changes
  useEffect(() => {
    if (cartCount > previousCount.current) {
      // Show success state
      setShowSuccess(true);
      
      // Bounce animation when item is added
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset success state after animation
      setTimeout(() => {
        setShowSuccess(false);
      }, 800);
    }
    previousCount.current = cartCount;
  }, [cartCount]);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#ff6b35" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
        <Animated.View style={{ transform: [{ scale: bounceValue }] }}>
          <Ionicons 
            name={showSuccess ? "checkmark-circle" : "cart-outline"} 
            size={28} 
            color={showSuccess ? "#27ae60" : "#ff6b35"} 
          />
        </Animated.View>
        {cartCount > 0 && (
          <Animated.View style={[styles.badge, { transform: [{ scale: bounceValue }] }]}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    elevation: 2,
    marginBottom: 0,
    marginTop: 6
  },
  backBtn: {
    padding: 6,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'outfit-bold',
    color: '#ff6b35',
  },
  cartBtn: {
    padding: 6,
    borderRadius: 16,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#f9f9f9',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'outfit-bold',
  },
});
