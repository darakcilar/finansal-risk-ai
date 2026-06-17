import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, GRADIENTS, RADIUS, SHADOWS } from '../theme/colors';

export default function RiskResult({ riskProbability, riskLevel, riskLabel, localExplanation }) {
  const [displayPercent, setDisplayPercent] = useState('0.0%');
  const [gaugeOffset, setGaugeOffset] = useState(251.2); // full circumference

  const circumference = 2 * Math.PI * 40; // ~251.2

  useEffect(() => {
    // Gauge animasyonu - basit JS interval ile (Animated SVG yerine)
    const targetOffset = circumference - (riskProbability * circumference);
    const target = riskProbability * 100;
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);
      const eased = easeOutQuart(progress);

      // Gauge ilerleme
      const currentOffset = circumference - (riskProbability * circumference * eased);
      setGaugeOffset(currentOffset);

      // Yüzde sayaç
      const currentVal = target * eased;
      setDisplayPercent(`${currentVal.toFixed(1)}%`);

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [riskProbability]);

  const gaugeColor =
    riskLevel === 'high' ? COLORS.accentRed :
    riskLevel === 'medium' ? COLORS.accentYellow :
    COLORS.accentGreen;

  const bgGradient =
    riskLevel === 'high' ? GRADIENTS.riskHigh :
    riskLevel === 'medium' ? GRADIENTS.riskMedium :
    GRADIENTS.riskLow;

  return (
    <View style={[styles.card, { borderColor: `${gaugeColor}30` }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Risk Puanı</Text>
        <LinearGradient colors={bgGradient} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.badgeText}>{riskLabel}</Text>
        </LinearGradient>
      </View>

      {/* Gauge - Animated yerine state ile kontrol edilen statik SVG */}
      <View style={styles.gaugeContainer}>
        <Svg width={160} height={160} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <Circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${gaugeOffset}`}
            rotation="-90"
            origin="50, 50"
          />
        </Svg>
        <View style={styles.gaugeLabel}>
          <Text style={[styles.gaugePercent, { color: gaugeColor }]}>{displayPercent}</Text>
          <Text style={styles.gaugeText}>Risk Olasılığı</Text>
        </View>
      </View>

      {/* Summary */}
      {localExplanation?.summary && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{localExplanation.summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 55, 0.6)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    padding: 20,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  gaugeLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugePercent: {
    fontSize: 28,
    fontWeight: '800',
  },
  gaugeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginTop: 16,
  },
  summaryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
