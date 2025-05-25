import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function AIAssistant() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const ai = new GoogleGenAI({ apiKey: "AIzaSyBqVku-b19yHobLsPn4DgoH3D7NF5h--H0" });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Pet Asistanı',
      headerTitleStyle: {
        fontFamily: 'outfit-medium',
      },
    });
  }, [navigation]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Sen bir evcil hayvan uzmanısın. Aşağıdaki soruya evcil hayvanlar hakkında yardımcı ol: ${inputText}`,
      });

      const aiMessage = {
        text: response.text,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI yanıtı alınırken hata:', error);
      const errorMessage = {
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mesajları + loading indicator'ı birleştir
  const messagesWithLoading = [...messages];
  if (isLoading) {
    messagesWithLoading.push({
      text: 'Pet Asistanı yazıyor...',
      sender: 'typing',
      timestamp: 'loading',
    });
  }

  // Typing bubble component
  const TypingBubble = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={{
        padding: 10,
        marginVertical: 5,
        maxWidth: '80%',
        alignSelf: 'flex-start',
        backgroundColor: '#faeedc',
        borderRadius: 10,
        opacity: fadeAnim,
      }}>
        <TypingAnimation />
      </Animated.View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'typing') {
      return <TypingBubble />;
    }
    
    return (
      <View style={{
        padding: 10,
        marginVertical: 5,
        maxWidth: '80%',
        alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
        backgroundColor: item.sender === 'user' ? '#FF6B35' : '#faeedc',
        borderRadius: 10,
      }}>
        <Text style={{
          color: item.sender === 'user' ? 'white' : 'black',
          fontFamily: 'outfit',
        }}>
          {item.sender === 'ai' ? parseMarkdown(item.text) : item.text}
        </Text>
      </View>
    );
  };

  // Markdown parsing - **kalın** yazılar için
  const parseMarkdown = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  };

  // Otomatik scroll - yeni mesaj geldiğinde
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  // Typing animation component
  const TypingAnimation = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animateDots = () => {
        const createAnimation = (dot, delay) => {
          return Animated.loop(
            Animated.sequence([
              Animated.timing(dot, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, 200),
          createAnimation(dot3, 400),
        ]).start();
      };

      animateDots();
    }, []);

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: 'black', fontFamily: 'outfit', fontStyle: 'italic' }}>
          Pet Asistanı yazıyor
        </Text>
        <View style={{ flexDirection: 'row', marginLeft: 5 }}>
          <Animated.View style={{ opacity: dot1 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>•</Text>
          </Animated.View>
          <Animated.View style={{ opacity: dot2 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>•</Text>
          </Animated.View>
          <Animated.View style={{ opacity: dot3 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>•</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'white' }}
      >
        <View style={{ flex: 1, padding: 20 }}>
          <FlatList
            data={messagesWithLoading}
            renderItem={renderMessage}
            keyExtractor={(item) => item.timestamp}
            style={{ flex: 1 }}
            ref={flatListRef}
          />

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            marginBottom: 20,
            borderTopWidth: 1,
            borderTopColor: '#eee',
            backgroundColor: 'white',
          }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#f5f5f5',
                padding: 10,
                borderRadius: 20,
                marginRight: 10,
                fontFamily: 'outfit',
              }}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Mesajınızı yazın..."
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={isLoading}
              style={{
                backgroundColor: '#FF6B35',
                padding: 10,
                borderRadius: 25,
              }}
            >
              <Ionicons
                name="send"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 
const styles = StyleSheet.create({
  container: {
    flex: 0.95,
  },
});
