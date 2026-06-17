import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';

export default function PeerComparison({ features, riskProbability }) {
  if (!features) return null;

  const age = parseFloat(features.age) || 30;
  const userRisk = Math.round(riskProbability * 100);
  const userUtil = (parseFloat(features.RevolvingUtilizationOfUnsecuredLines) || 0) * 100;
  const userDebt = (parseFloat(features.DebtRatio) || 0) * 100;

  let avgRisk = 45, avgUtil = 40, avgDebt = 35, groupName = "Genel Yaş Ortalaması";

  if (age < 30) {
    avgRisk = 55; avgUtil = 60; avgDebt = 45; groupName = "20-29 Yaş Grubu";
  } else if (age >= 30 && age < 45) {
    avgRisk = 40; avgUtil = 45; avgDebt = 40; groupName = "30-44 Yaş Grubu";
  } else if (age >= 45 && age < 60) {
    avgRisk = 30; avgUtil = 25; avgDebt = 30; groupName = "45-59 Yaş Grubu";
  } else {
    avgRisk = 20; avgUtil = 15; avgDebt = 20; groupName = "60+ Yaş Grubu";
  }

  let percentile = 50 + (avgRisk - userRisk);
  if (percentile > 99) percentile = 99;
  if (percentile < 1) percentile = 1;

  const getScoreColor = (userVal, avgVal) => {
    const diff = avgVal - userVal;
    if (diff > 5) return COLORS.emerald;
    if (diff < -5) return COLORS.red500;
    return COLORS.amber500;
  };

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.skyBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <SvgCircle cx="9" cy="7" r="4" />
            <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Svg>
        </View>
        <Text style={styles.title}>Akran Karşılaştırması</Text>
      </View>

      <Text style={styles.description}>
        Sizinle benzer demografik özelliklere (<Text style={{ color: COLORS.skyBlue, fontWeight: '600' }}>{groupName}</Text>) sahip diğer kullanıcıların ortalamalarına göre durumunuz:
      </Text>

      {/* Toplumsal Sıralama */}
      <View style={styles.rankBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rankTitle}>Toplumsal Sıralama</Text>
          <Text style={styles.rankSub}>Aynı yaş grubundaki kullanıcıların</Text>
        </View>
        <View style={[styles.rankBadge, {
          backgroundColor: percentile >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: percentile >= 50 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        }]}>
          <Text style={[styles.rankPercent, { color: percentile >= 50 ? COLORS.emerald : COLORS.red500 }]}>
            %{(100 - percentile).toFixed(0)}'undan
          </Text>
          <Text style={[styles.rankLabel, { color: percentile >= 50 ? COLORS.emerald : COLORS.red500 }]}>
            Daha İyi Durumdasınız
          </Text>
        </View>
      </View>

      {/* Karşılaştırma Barları */}
      <View style={{ gap: 16 }}>
        <ComparisonBar label="Genel Risk Puanı" userVal={userRisk} avgVal={avgRisk} unit="%" color={getScoreColor(userRisk, avgRisk)} />
        <ComparisonBar label="Kart Kullanım Oranı" userVal={userUtil} avgVal={avgUtil} unit="%" color={getScoreColor(userUtil, avgUtil)} />
        <ComparisonBar label="Borç / Gelir Oranı" userVal={userDebt} avgVal={avgDebt} unit="%" color={getScoreColor(userDebt, avgDebt)} />
      </View>
    </View>
  );
}

function ComparisonBar({ label, userVal, avgVal, unit, color }) {
  const safeUserWidth = Math.min(Math.max(userVal, 5), 100);
  const safeAvgWidth = Math.min(Math.max(avgVal, 5), 100);

  return (
    <View>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={[barStyles.value, { color }]}>Siz: {userVal.toFixed(0)}{unit}</Text>
      </View>
      {/* User bar */}
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${safeUserWidth}%`, backgroundColor: color }]} />
      </View>
      {/* Avg bar */}
      <View style={barStyles.avgRow}>
        <View style={[barStyles.track, { height: 4, flex: 1 }]}>
          <View style={[barStyles.fill, { width: `${safeAvgWidth}%`, backgroundColor: COLORS.slate600, height: 4 }]} />
        </View>
        <Text style={barStyles.avgText}>Akran Ort.: {avgVal.toFixed(0)}{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    color: COLORS.slate200,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: COLORS.slate400,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  rankBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rankTitle: {
    color: COLORS.slate300,
    fontSize: 14,
    fontWeight: '500',
  },
  rankSub: {
    color: COLORS.slate600,
    fontSize: 12,
    marginTop: 2,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rankPercent: {
    fontWeight: '700',
    fontSize: 15,
  },
  rankLabel: {
    fontSize: 11,
  },
});

const barStyles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: COLORS.slate300,
    fontSize: 13,
  },
  value: {
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avgText: {
    color: COLORS.slate600,
    fontSize: 11,
  },
});
