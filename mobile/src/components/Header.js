import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';

export default function Header() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.08)', 'rgba(118, 75, 162, 0.04)', 'transparent']}
        style={styles.glow}
      />
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.logoIcon}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <Path d="M9 12l2 2 4-4" />
            </Svg>
          </LinearGradient>
          <View>
            <Text style={styles.title}>Finansal Risk AI</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Explainable AI</Text>
            </View>
          </View>
        </View>
        <Text style={styles.desc}>
          Karar ağaçları ile açıklanabilir yapay zeka destekli risk puanlaması
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inner: {
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentBlue,
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
});
