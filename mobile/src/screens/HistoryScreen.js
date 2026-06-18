import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

export default function HistoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Geçmiş Analizler</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {(!user?.history || user.history.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Henüz geçmiş analiziniz bulunmuyor.</Text>
          </View>
        ) : (
          user.history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                <View style={[styles.badge, { backgroundColor: item.risk_level === 'high' ? 'rgba(239, 68, 68, 0.1)' : item.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.badgeText, { color: item.risk_level === 'high' ? COLORS.accentRed : item.risk_level === 'medium' ? COLORS.accentYellow : COLORS.accentGreen }]}>
                    {item.risk_label || item.risk_level.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.probLabel}>Risk Olasılığı:</Text>
                <Text style={styles.probValue}>%{(item.risk_probability * 100).toFixed(1)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.borderGlass },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: COLORS.borderGlass,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  historyCard: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: COLORS.borderGlass, borderRadius: RADIUS.md, padding: 16, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  date: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 },
  probLabel: { color: COLORS.textMuted, fontSize: 13 },
  probValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' }
});
