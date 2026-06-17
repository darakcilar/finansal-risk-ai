import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api'; // Or context

export default function SettingsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMessage({ type: 'error', text: data.error || 'Şifre değiştirme başarısız.' });
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessage({ type: 'error', text: 'Sunucu bağlantı hatası.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Şifre Değiştir</Text>

            {message.text ? (
              <View style={[styles.msgBox, message.type === 'error' ? styles.msgError : styles.msgSuccess]}>
                <Text style={[styles.msgText, message.type === 'error' ? styles.msgTextError : styles.msgTextSuccess]}>{message.text}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Mevcut Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: COLORS.textPrimary, fontSize: 20 },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: { backgroundColor: 'rgba(15, 23, 55, 0.6)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGlass, padding: 20, ...SHADOWS.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  label: { color: COLORS.slate300, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: COLORS.bgGlass, borderWidth: 1, borderColor: COLORS.borderGlass, borderRadius: RADIUS.md, color: COLORS.textPrimary, padding: 14, fontSize: 15, marginBottom: 20 },
  button: { backgroundColor: COLORS.skyBlue, padding: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  msgBox: { padding: 15, borderRadius: RADIUS.md, marginBottom: 20, borderWidth: 1 },
  msgError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  msgSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  msgText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  msgTextError: { color: COLORS.accentRed },
  msgTextSuccess: { color: COLORS.accentGreen }
});
