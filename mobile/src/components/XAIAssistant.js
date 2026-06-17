import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Polyline } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';

export default function XAIAssistant({ advice }) {
  if (!advice) return null;

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={COLORS.emerald} />
            <Polyline points="14 2 14 8 20 8" stroke={COLORS.emerald} />
            <Line x1="16" y1="13" x2="8" y2="13" stroke={COLORS.emerald} />
            <Line x1="16" y1="17" x2="8" y2="17" stroke={COLORS.emerald} />
          </Svg>
        </View>
        <Text style={styles.title}>XAI YÖNETİCİ ÖZETİ</Text>
      </View>

      {/* Metin */}
      <Text style={styles.adviceText}>{advice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: RADIUS.md,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.emerald,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adviceText: {
    color: COLORS.slate200,
    fontSize: 14,
    lineHeight: 22,
  },
});
