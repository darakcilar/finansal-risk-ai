import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Circle, Path, Polyline, Line as SvgLine } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DecisionPath({ explanations, summary, decisionPath }) {
  const [isTreeOpen, setIsTreeOpen] = useState(false);

  if (!explanations || explanations.length === 0) return null;

  const toggleTree = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsTreeOpen(!isTreeOpen);
  };

  return (
    <View style={{ gap: 20 }}>
      {/* 1. İnsani Açıklamalar */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.violet} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <SvgLine x1="12" y1="17" x2="12.01" y2="17" />
            </Svg>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Neden Bu Sonuç?</Text>
            <Text style={styles.sectionSub}>Modelin kararını etkileyen temel faktörler</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {explanations.map((exp, idx) => {
            const isCritical = exp.impact === 'critical';
            const isIncrease = exp.direction === 'increase';

            let borderColor = 'rgba(255,255,255,0.1)';
            let icon = '✅';

            if (isCritical) {
              borderColor = 'rgba(252, 129, 129, 0.3)';
              icon = '🚨';
            } else if (isIncrease) {
              borderColor = 'rgba(246, 173, 85, 0.3)';
              icon = '⚠️';
            } else {
              borderColor = 'rgba(104, 211, 145, 0.3)';
            }

            return (
              <View key={idx} style={[styles.expItem, { borderLeftColor: borderColor }]}>
                <View style={styles.expHeader}>
                  <Text style={{ fontSize: 14 }}>{icon}</Text>
                  <Text style={styles.expLabel}>
                    {exp.label} {isIncrease ? '↑' : '↓'}
                  </Text>
                </View>
                <Text style={styles.expMsg}>{exp.message}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Karar Ağacı (Açılır/Kapanır) */}
      {decisionPath && decisionPath.length > 0 && (
        <View style={styles.card}>
          <TouchableOpacity onPress={toggleTree} activeOpacity={0.7} style={styles.treeHeader}>
            <View style={styles.treeHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.borderGlass }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </Svg>
              </View>
              <View>
                <Text style={styles.treeTitle}>Yapay Zeka Karar Ağacı</Text>
                <Text style={styles.treeSub}>Matematiksel eşik değerleri ve algoritma yolu</Text>
              </View>
            </View>
            <View style={styles.chevronBox}>
              <Text style={[styles.chevron, { transform: [{ rotate: isTreeOpen ? '180deg' : '0deg' }] }]}>▼</Text>
            </View>
          </TouchableOpacity>

          {isTreeOpen && (
            <View style={styles.treeContent}>
              {decisionPath.map((step, idx) => (
                <View key={idx} style={styles.treeStep}>
                  {/* Düğüm noktası */}
                  <View style={[styles.treeDot, step.type === 'leaf' && styles.treeDotLeaf]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.treeStepLabel}>Adım {idx + 1}</Text>
                    <Text style={[styles.treeStepDesc, step.type === 'leaf' && styles.treeStepDescLeaf]}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSub: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  expItem: {
    backgroundColor: COLORS.bgGlass,
    borderLeftWidth: 4,
    borderRadius: RADIUS.sm,
    padding: 14,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  expMsg: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  treeTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  treeSub: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  chevronBox: {
    backgroundColor: COLORS.bgGlass,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  treeContent: {
    marginTop: 20,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.borderGlass,
    borderStyle: 'dashed',
  },
  treeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingBottom: 16,
    position: 'relative',
  },
  treeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginLeft: -17,
    marginTop: 4,
  },
  treeDotLeaf: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlue,
  },
  treeStepLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  treeStepDesc: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  treeStepDescLeaf: {
    color: COLORS.accentBlue,
    fontWeight: '600',
  },
});
