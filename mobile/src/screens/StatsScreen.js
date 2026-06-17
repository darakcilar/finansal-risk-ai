import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

export default function StatsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  
  const history = user?.history || [];
  const totalAnalyses = history.length;
  
  const avgRisk = totalAnalyses > 0 
    ? (history.reduce((acc, curr) => acc + curr.risk_probability, 0) / totalAnalyses * 100).toFixed(1) 
    : 0;
    
  const latestAnalysis = totalAnalyses > 0 ? history[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>İstatistiklerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
            <Text style={styles.statValue}>{totalAnalyses}</Text>
            <Text style={styles.statLabel}>Toplam Analiz</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
            <Text style={styles.statValue}>%{avgRisk}</Text>
            <Text style={styles.statLabel}>Ortalama Risk</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son Risk Durumunuz</Text>
          {latestAnalysis ? (
            <View style={styles.latestBox}>
              <View style={styles.latestRow}>
                <Text style={styles.latestLabel}>Risk Seviyesi</Text>
                <Text style={[styles.latestValue, { color: latestAnalysis.risk_level === 'high' ? COLORS.accentRed : latestAnalysis.risk_level === 'medium' ? COLORS.accentYellow : COLORS.accentGreen }]}>
                  {latestAnalysis.risk_label || latestAnalysis.risk_level.toUpperCase()}
                </Text>
              </View>
              <View style={styles.latestRow}>
                <Text style={styles.latestLabel}>Risk Olasılığı</Text>
                <Text style={styles.latestValue}>%{(latestAnalysis.risk_probability * 100).toFixed(1)}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(latestAnalysis.date).toLocaleDateString('tr-TR')} tarihinde analiz edildi</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Henüz bir analiz yapmadınız.</Text>
            </View>
          )}
        </View>

      </ScrollView>
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
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, padding: 25, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  statValue: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', marginBottom: 5 },
  statLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: 'rgba(15, 23, 55, 0.6)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGlass, padding: 20, ...SHADOWS.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 15 },
  latestBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: RADIUS.md },
  latestRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  latestLabel: { color: COLORS.textSecondary, fontSize: 14 },
  latestValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  dateText: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right', marginTop: 10 },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 14 }
});
