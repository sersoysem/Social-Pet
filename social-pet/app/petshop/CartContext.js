// petshop/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../../config/FireBaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  
  // Clerk user hook
  const { user: clerkUser } = useUser();

  // Unified user email getter
  const getUserEmail = async () => {
    try {
      if (clerkUser?.primaryEmailAddress?.emailAddress) {
        // Clerk kullanıcısı
        return clerkUser.primaryEmailAddress.emailAddress;
      } else {
        // Email/Password kullanıcısı
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.email;
        }
      }
    } catch (error) {
      console.error("Kullanıcı email'i alınamadı:", error);
    }
    return null;
  };

  // Auth state listener - combine both auth methods
  useEffect(() => {
    const checkAuthentication = async () => {
      // Only show loading if we don't have user info yet
      if (!currentUserEmail) {
        setLoading(true);
      }
      
      try {
        const email = await getUserEmail();
        
        if (email) {
          setCurrentUserEmail(email);
          setUser({ email }); // Simplified user object
        } else {
          setCurrentUserEmail(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setCurrentUserEmail(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [clerkUser]);

  // Firestore cart listener
  useEffect(() => {
    if (!currentUserEmail) {
      setCart([]);
      return;
    }

    const cartRef = doc(db, 'Carts', currentUserEmail);
    const unsubscribe = onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const items = data.items || [];
        
        // Handle backward compatibility: normalize qty to quantity
        const normalizedItems = items.map(item => ({
          ...item,
          quantity: item.quantity || item.qty || 1 // Use quantity first, fallback to qty, default to 1
        }));
        
        setCart(normalizedItems);
      } else {
        setCart([]);
      }
    });

    return unsubscribe;
  }, [currentUserEmail]);

  // Save cart to Firestore
  const saveCartToFirestore = async (newCart) => {
    if (!currentUserEmail) return;
    
    try {
      const cartRef = doc(db, 'Carts', currentUserEmail);
      await setDoc(cartRef, {
        userEmail: currentUserEmail,
        items: newCart,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
    }
  };

  const addToCart = async (product, qty = 1) => {
    if (!currentUserEmail) {
      console.log('User not authenticated');
      return;
    }

    const newCart = [...cart];
    const found = newCart.find((item) => item.id === product.id);
    
    if (found) {
      found.quantity += qty;
      console.log(`${product.name} sepete eklendi! (${found.quantity} adet)`);
    } else {
      newCart.push({ ...product, quantity: qty });
      console.log(`${product.name} sepete eklendi!`);
    }
    
    await saveCartToFirestore(newCart);
  };

  const removeFromCart = async (id) => {
    if (!currentUserEmail) return;
    
    const newCart = cart.filter((item) => item.id !== id);
    await saveCartToFirestore(newCart);
  };

  const clearCart = async () => {
    if (!currentUserEmail) return;
    
    await saveCartToFirestore([]);
  };

  const updateQty = async (id, qty) => {
    if (!currentUserEmail) return;
    
    if (qty <= 0) {
      await removeFromCart(id);
      return;
    }
    
    const newCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
    );
    
    await saveCartToFirestore(newCart);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      updateQty,
      user,
      loading,
      currentUserEmail
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
