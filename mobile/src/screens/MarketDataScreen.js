import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api'; // Or use context

export default function MarketDataScreen({ navigation }) {
  const [marketData, setMarketData] = useState({ USD: null, EUR: null, FAIZ: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/market-data`);
      const data = await res.json();
      if (res.ok) {
        setMarketData({
          USD: parseFloat(data.USD).toFixed(2),
          EUR: parseFloat(data.EUR).toFixed(2),
          FAIZ: data.FAIZ ? parseFloat(data.FAIZ).toFixed(2) : '--'
        });
      }
    } catch (e) {
      console.error("Market data fetch error:", e);
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
        <Text style={styles.title}>Canlı Piyasa</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>TCMB Güncel Verileri</Text>
        
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.skyBlue} />
            <Text style={styles.loaderText}>Veriler Çekiliyor...</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardFlag}>🇺🇸</Text>
                <Text style={styles.cardTitle}>USD / TRY</Text>
              </View>
              <Text style={styles.cardValue}>₺{marketData.USD || '--'}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardFlag}>🇪🇺</Text>
                <Text style={styles.cardTitle}>EUR / TRY</Text>
              </View>
              <Text style={styles.cardValue}>₺{marketData.EUR || '--'}</Text>
            </View>

            <View style={[styles.card, styles.faizCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardFlag}>🏦</Text>
                <Text style={styles.cardTitle}>TCMB Politika Faizi</Text>
              </View>
              <Text style={styles.cardValue}>%{marketData.FAIZ || '--'}</Text>
              <Text style={styles.cardDesc}>Ağırlıklı Ortalama Fonlama Maliyeti</Text>
            </View>
          </View>
        )}
      </View>
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
  subtitle: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  loader: { marginTop: 50, alignItems: 'center' },
  loaderText: { color: COLORS.textSecondary, marginTop: 15 },
  cardsContainer: { gap: 15 },
  card: { backgroundColor: 'rgba(15, 23, 55, 0.6)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGlass, padding: 20, ...SHADOWS.md },
  faizCard: { borderColor: COLORS.skyBlue, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardFlag: { fontSize: 24, marginRight: 10 },
  cardTitle: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  cardValue: { color: COLORS.textPrimary, fontSize: 32, fontWeight: 'bold' },
  cardDesc: { color: COLORS.skyBlue, fontSize: 12, marginTop: 10 }
});
