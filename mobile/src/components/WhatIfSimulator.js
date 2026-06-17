import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { simulatePredict } from '../utils/api';

export default function WhatIfSimulator({ originalFeatures, originalProb, apiBase }) {
  const [simulatedFeatures, setSimulatedFeatures] = useState({ ...originalFeatures });
  const [simulatedProb, setSimulatedProb] = useState(originalProb);
  const [simulatedLevel, setSimulatedLevel] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!originalFeatures) return null;

  const runSimulation = async () => {
    setLoading(true);
    try {
      const data = await simulatePredict(simulatedFeatures);
      setSimulatedProb(data.risk_probability);
      setSimulatedLevel(data.risk_level);
    } catch (err) {
      console.error("Simülasyon Hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    const num = parseFloat(value) || 0;
    setSimulatedFeatures(prev => ({ ...prev, [name]: num }));
  };

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Text style={{ color: 'white', fontSize: 16 }}>▶</Text>
        </View>
        <Text style={styles.title}>"What-If" Simülasyonu</Text>
      </View>

      <Text style={styles.description}>
        Mevcut verilerinizle oynayarak algoritmik risk skorunuzun nasıl değiştiğini canlı olarak test edin.
      </Text>

      {/* Input alanları (Slider yerine - daha güvenilir) */}
      <View style={styles.inputsBox}>
        {simulatedFeatures.RevolvingUtilizationOfUnsecuredLines !== undefined && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kredi Kartı Limit Kullanım Oranı</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={String((simulatedFeatures.RevolvingUtilizationOfUnsecuredLines * 100).toFixed(0))}
                onChangeText={(val) => handleChange('RevolvingUtilizationOfUnsecuredLines', String((parseFloat(val) || 0) / 100))}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.inputUnit}>%</Text>
            </View>
          </View>
        )}

        {simulatedFeatures.MonthlyIncome !== undefined && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aylık Gelir (TL)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={String(simulatedFeatures.MonthlyIncome)}
                onChangeText={(val) => handleChange('MonthlyIncome', val)}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.inputUnit}>₺</Text>
            </View>
          </View>
        )}
      </View>

      {/* Sonuç Karşılaştırma */}
      <View style={styles.resultBox}>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Orijinal Risk</Text>
          <Text style={[styles.resultValue, { color: COLORS.slate400 }]}>
            %{(originalProb * 100).toFixed(1)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={runSimulation}
          disabled={loading}
          style={[styles.simButton, loading && { opacity: 0.6 }]}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.simButtonText}>Simüle Et</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Yeni Senaryo</Text>
          <Text style={[styles.resultValue, {
            color: simulatedProb < originalProb ? COLORS.emerald :
                   simulatedProb > originalProb ? COLORS.red500 : COLORS.blue500
          }]}>
            %{(simulatedProb * 100).toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: RADIUS.md,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    backgroundColor: COLORS.blue500,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  inputsBox: {
    gap: 14,
    marginBottom: 20,
  },
  inputGroup: {},
  inputLabel: {
    color: COLORS.slate300,
    fontSize: 13,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  inputUnit: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  simButton: {
    backgroundColor: COLORS.blue500,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  simButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
});
