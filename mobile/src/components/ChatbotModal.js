import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function ChatbotModal({ isVisible, onClose, userId, apiBase }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Merhaba! Ben Finansal Asistanınızım. Size nasıl yardımcı olabilirim? (Örn: "Kredi çekmeli miyim?", "Limitimi artırmalı mıyım?")' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isVisible, messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: userMessage })
      });
      
      const data = await response.json();
      
      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Üzgünüm, asistan şu an yanıt veremiyor.' }]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Bağlantı hatası oluştu.' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerTitle}>Finansal Asistan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          >
            {messages.map((msg, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.messageBubble, 
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}
              >
                <Text style={[styles.messageText, msg.sender === 'user' && { color: '#fff' }]}>
                  {msg.text}
                </Text>
              </View>
            ))}
            
            {isLoading && (
              <View style={[styles.messageBubble, styles.botBubble, { alignSelf: 'flex-start' }]}>
                <ActivityIndicator size="small" color={COLORS.skyBlue} />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Bir soru sorun..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} 
              onPress={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: COLORS.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.emerald,
    marginRight: 8,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 5,
  },
  closeText: {
    color: COLORS.skyBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.skyBlue,
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: COLORS.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  }
});
