import { GoogleGenAI } from "@google/genai";
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function AIAssistant() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const renderMessage = ({ item }) => (
    <View style={{
      padding: 10,
      marginVertical: 5,
      maxWidth: '80%',
      alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
      backgroundColor: item.sender === 'user' ? '#E8B20E' : '#faeedc',
      borderRadius: 10,
    }}>
      <Text style={{
        color: item.sender === 'user' ? 'white' : 'black',
        fontFamily: 'outfit',
      }}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white' }}
    >
      <View style={{ flex: 1, padding: 20 }}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.timestamp}
          style={{ flex: 1 }}
        />

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          borderTopWidth: 1,
          borderTopColor: '#eee',
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
              backgroundColor: '#E8B20E',
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
  );
} 