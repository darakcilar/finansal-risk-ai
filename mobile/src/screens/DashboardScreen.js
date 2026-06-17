import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import DrawerMenu from '../components/DrawerMenu';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNewAnalysis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Form');
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerMenu 
        isVisible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onNavigate={(route) => navigation.navigate(route)} 
        user={user} 
        onLogout={logout} 
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsDrawerOpen(true); }} style={styles.hamburgerBtn}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.name}>{user?.name || 'Kullanıcı'}</Text>
          <Text style={styles.subtitle}>Bugün risk analizi yapmak için harika bir gün!</Text>
        </View>

        {/* Big Action Buttons */}
        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.bigActionBtn} onPress={handleNewAnalysis} activeOpacity={0.8}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
              <Text style={styles.bigActionIcon}>🚀</Text>
            </View>
            <Text style={styles.bigActionTitle}>Yeni Analiz Yap</Text>
            <Text style={styles.bigActionDesc}>Yeni bir finansal risk değerlendirmesi başlatın</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.bigActionBtn, { marginTop: 20 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('History'); }} activeOpacity={0.8}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Text style={styles.bigActionIcon}>📊</Text>
            </View>
            <Text style={styles.bigActionTitle}>Geçmiş Analizlerim</Text>
            <Text style={styles.bigActionDesc}>Önceki analiz sonuçlarınızı inceleyin</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  hamburgerBtn: { padding: 10, marginLeft: -10 },
  hamburgerIcon: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' },
  welcomeSection: { marginBottom: 40 },
  greeting: { color: COLORS.skyBlue, fontSize: 18, fontWeight: '600' },
  name: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '800', marginTop: 5 },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, marginTop: 10, lineHeight: 22 },
  mainActions: { flex: 1 },
  bigActionBtn: { backgroundColor: 'rgba(15, 23, 55, 0.8)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGlass, padding: 25, alignItems: 'center', ...SHADOWS.md },
  iconWrapper: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  bigActionIcon: { fontSize: 35 },
  bigActionTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  bigActionDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 10 }
});
