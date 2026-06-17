import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line as SvgLine, Polyline } from 'react-native-svg';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

const severityConfig = {
  critical: { color: '#fc8181', bg: 'rgba(252, 129, 129, 0.08)', border: 'rgba(252, 129, 129, 0.25)', label: 'Kritik' },
  warning: { color: '#fbd38d', bg: 'rgba(251, 211, 141, 0.08)', border: 'rgba(251, 211, 141, 0.25)', label: 'Uyarı' },
  info: { color: '#a5b4fc', bg: 'rgba(165, 180, 252, 0.08)', border: 'rgba(165, 180, 252, 0.25)', label: 'Bilgi' },
};

export default function Recommendations({ recommendations }) {
  if (!recommendations) return null;

  const {
    riskFactors,
    positiveFactors,
    overallSummary,
    overallAdvice,
    riskLevel,
    totalRiskFactors,
    totalPositiveFactors,
  } = recommendations;

  return (
    <View style={{ gap: 20 }}>
      {/* Ana Analiz Kartı */}
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.recHeader}>
          <View style={styles.recIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 18V5l12-2v13" />
              <SvgCircle cx="6" cy="18" r="3" />
              <SvgCircle cx="18" cy="16" r="3" />
            </Svg>
          </View>
          <View>
            <Text style={styles.recTitle}>Sistem Analizi & Tavsiyeler</Text>
            <Text style={styles.recSubtitle}>
              {totalRiskFactors} risk faktörü · {totalPositiveFactors} olumlu faktör
            </Text>
          </View>
        </View>

        {/* Overall Summary */}
        <View style={[styles.overallBox, {
          borderLeftColor: riskLevel === 'high' ? COLORS.accentRed : riskLevel === 'medium' ? COLORS.accentYellow : COLORS.accentGreen,
        }]}>
          <Text style={{ fontSize: 20 }}>
            {riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.overallText}>{overallSummary}</Text>
            {overallAdvice && overallAdvice.length > 0 && (
              <View style={styles.adviceList}>
                {overallAdvice.map((advice, idx) => (
                  <Text key={idx} style={styles.adviceItem}>• {advice}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Risk Faktörleri */}
      {riskFactors && riskFactors.length > 0 && (
        <View>
          <View style={styles.sectionTitleRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.accentRed} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <SvgLine x1="12" y1="9" x2="12" y2="13" />
              <SvgLine x1="12" y1="17" x2="12.01" y2="17" />
            </Svg>
            <Text style={styles.sectionTitleText}>Kritik Bulgular</Text>
          </View>

          {riskFactors.map((factor, idx) => {
            const config = severityConfig[factor.severity] || severityConfig.info;
            return (
              <View key={idx} style={[styles.riskCard, { borderLeftColor: config.border, backgroundColor: config.bg }]}>
                {/* Başlık satırı */}
                <View style={styles.factorTitleRow}>
                  <Text style={{ fontSize: 16 }}>{factor.icon}</Text>
                  <Text style={styles.factorTitle}>{factor.feature}</Text>
                  <View style={[styles.severityBadge, { borderColor: config.border }]}>
                    <Text style={[styles.severityText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Metrikler */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Mevcut Değer</Text>
                    <Text style={[styles.metricValue, { color: config.color }]}>{factor.currentValue}</Text>
                  </View>
                  <Text style={styles.metricArrow}>→</Text>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>İdeal Aralık</Text>
                    <Text style={[styles.metricValue, { color: COLORS.accentGreen }]}>{factor.idealRange}</Text>
                  </View>
                </View>

                {/* Açıklama */}
                <Text style={styles.explanation}>{factor.explanation}</Text>

                {/* Tavsiyeler */}
                {factor.advice && factor.advice.length > 0 && (
                  <View style={styles.adviceBox}>
                    <Text style={styles.adviceBoxLabel}>📋 Aksiyon Planı:</Text>
                    {factor.advice.map((adv, i) => (
                      <Text key={i} style={styles.adviceBoxItem}>• {adv}</Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Olumlu Faktörler */}
      {positiveFactors && positiveFactors.length > 0 && (
        <View>
          <View style={styles.sectionTitleRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.accentGreen} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <Polyline points="22 4 12 14.01 9 11.01" />
            </Svg>
            <Text style={styles.sectionTitleText}>Güçlü Yönler</Text>
          </View>

          {positiveFactors.map((factor, idx) => (
            <View key={idx} style={styles.positiveCard}>
              <Text style={{ fontSize: 20 }}>{factor.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.positiveTitleRow}>
                  <Text style={styles.positiveTitle}>{factor.feature}</Text>
                  <Text style={styles.positiveValue}>{factor.currentValue}</Text>
                </View>
                <Text style={styles.positiveMsg}>{factor.message}</Text>
              </View>
            </View>
          ))}
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
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  recSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  overallBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    padding: 14,
  },
  overallText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  adviceList: {
    gap: 4,
  },
  adviceItem: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  riskCard: {
    borderLeftWidth: 4,
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 14,
  },
  factorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  factorTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 6,
    padding: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricArrow: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  explanation: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  adviceBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: 10,
  },
  adviceBoxLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  adviceBoxItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 3,
  },
  positiveCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(104, 211, 145, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(104, 211, 145, 0.2)',
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 10,
  },
  positiveTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  positiveTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  positiveValue: {
    color: COLORS.accentGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  positiveMsg: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
