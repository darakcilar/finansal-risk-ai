import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';

export default function ShapWaterfall({ shapValues }) {
  if (!shapValues || shapValues.length === 0) return null;

  const getVal = (item) => item.value !== undefined ? item.value : (item.shap_value || 0);
  const maxAbsValue = Math.max(...shapValues.map(s => Math.abs(getVal(s))));

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Line x1="18" y1="20" x2="18" y2="10" />
            <Line x1="12" y1="20" x2="12" y2="4" />
            <Line x1="6" y1="20" x2="6" y2="14" />
          </Svg>
        </View>
        <View>
          <Text style={styles.title}>Bireysel Risk Etkenleri (SHAP)</Text>
          <Text style={styles.subtitle}>Mevcut skorunuzu artıran ve azaltan faktörler</Text>
        </View>
      </View>

      {/* Çubuk Grafik */}
      <View style={styles.chartArea}>
        {shapValues.map((item, index) => {
          const val = getVal(item);
          const isPositive = val > 0;
          const barWidth = maxAbsValue === 0 ? 0 : (Math.abs(val) / maxAbsValue) * 100;
          const barColor = isPositive ? COLORS.red500 : COLORS.emerald;

          return (
            <View key={index} style={styles.barRow}>
              {/* Feature Name */}
              <View style={styles.featureNameBox}>
                <Text style={styles.featureName} numberOfLines={1}>{item.feature}</Text>
              </View>

              {/* Bar Area */}
              <View style={styles.barArea}>
                {/* Sol taraf (Negatif - Yeşil) */}
                <View style={styles.barHalf}>
                  {!isPositive && val !== 0 && (
                    <View style={styles.negativeBar}>
                      <Text style={[styles.barValue, { color: barColor }]}>{val.toFixed(3)}</Text>
                      <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }]} />
                    </View>
                  )}
                </View>

                {/* Merkez çizgisi */}
                <View style={styles.centerLine} />

                {/* Sağ taraf (Pozitif - Kırmızı) */}
                <View style={styles.barHalf}>
                  {isPositive && val !== 0 && (
                    <View style={styles.positiveBar}>
                      <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor, borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />
                      <Text style={[styles.barValue, { color: barColor }]}>+{val.toFixed(3)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Alt Bilgi */}
      <View style={styles.legend}>
        <Text style={{ color: COLORS.emerald, fontSize: 12 }}>← Riski Düşürenler</Text>
        <Text style={{ color: COLORS.red500, fontSize: 12 }}>Riski Artıranlar →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: RADIUS.md,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  iconBox: {
    backgroundColor: COLORS.violet,
    padding: 8,
    borderRadius: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  chartArea: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureNameBox: {
    width: '35%',
    paddingRight: 8,
  },
  featureName: {
    color: COLORS.slate300,
    fontSize: 12,
    textAlign: 'right',
  },
  barArea: {
    width: '65%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  barHalf: {
    flex: 1,
    height: 16,
    justifyContent: 'center',
  },
  negativeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  positiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centerLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.slate600,
    marginHorizontal: 4,
  },
  barFill: {
    height: 14,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
});
