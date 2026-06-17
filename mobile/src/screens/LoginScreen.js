import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    
    const result = await login(email, password, role, rememberMe);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏦</Text>
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.roleTabs}>
            <TouchableOpacity 
              style={[styles.roleTab, role === 'user' && styles.roleTabActive]} 
              onPress={() => { setRole('user'); setEmail(''); setPassword(''); setError(''); }}
            >
              <Text style={[styles.roleTabText, role === 'user' && styles.roleTabTextActive]}>Kullanıcı</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, role === 'admin' && styles.roleTabAdminActive]} 
              onPress={() => { setRole('admin'); setEmail(''); setPassword(''); setError(''); }}
            >
              <Text style={[styles.roleTabText, role === 'admin' && styles.roleTabAdminTextActive]}>Yönetici</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Text style={styles.label}>{role === 'admin' ? 'Kullanıcı Adı' : 'E-posta'}</Text>
          <TextInput
            style={styles.input}
            placeholder={role === 'admin' ? "Yönetici Adı" : "ornek@email.com"}
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType={role === 'admin' ? "default" : "email-address"}
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRememberMe(!rememberMe);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Beni Hatırla</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, role === 'admin' && { backgroundColor: '#8b5cf6' }]} 
            onPress={handleLogin} 
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          {role === 'user' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Hesabınız yok mu? </Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Register'); }}>
                <Text style={styles.link}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 50, marginBottom: 15 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, marginTop: 5 },
  form: { backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 24, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGlass },
  errorText: { color: COLORS.accentRed, marginBottom: 15, textAlign: 'center' },
  label: { color: COLORS.slate300, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: COLORS.bgGlass, borderWidth: 1, borderColor: COLORS.borderGlass, borderRadius: RADIUS.md, color: COLORS.textPrimary, padding: 14, fontSize: 15, marginBottom: 20 },
  button: { backgroundColor: COLORS.skyBlue, padding: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.textSecondary },
  link: { color: COLORS.skyBlue, fontWeight: '700' },
  roleTabs: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  roleTab: { flex: 1, padding: 12, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  roleTabActive: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(56, 189, 248, 0.5)' },
  roleTabAdminActive: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.5)' },
  roleTabText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  roleTabTextActive: { color: COLORS.skyBlue },
  roleTabAdminTextActive: { color: '#c084fc' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.borderGlass, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: COLORS.skyBlue, borderColor: COLORS.skyBlue },
  checkboxIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { color: COLORS.slate300, fontSize: 14 }
});
