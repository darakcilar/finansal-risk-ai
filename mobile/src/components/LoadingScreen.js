import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS } from '../theme/colors';

const STEPS = [
  "Güvenli bağlantı tescilleniyor",
  "Geçmiş kredi veritabanı taranıyor",
  "Random Forest modeli çalıştırılıyor",
  "XAI motoru kararları analiz ediyor",
  "Nihai risk raporu derleniyor",
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinner animasyonu
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Adım ilerletme
    const timer = setInterval(() => {
      setStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const target = ((step + 1) / STEPS.length) * 100;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.innerBox}>
        {/* Spinner */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spinInterpolation }] }]} />

        <Text style={styles.title}>Sistem Analizi</Text>
        <Text style={styles.subtitle}>Yapay zeka finansal verilerinizi işliyor</Text>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={GRADIENTS.progressBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Stepper */}
        <View style={styles.stepperContainer}>
          {/* Dikey çizgi */}
          <View style={styles.stepperLine} />

          {STEPS.map((text, index) => {
            const isActive = index === step;
            const isCompleted = index < step;
            const isPending = index > step;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.stepItem,
                  { opacity: isPending ? 0.4 : 1 },
                  isActive && { transform: [{ translateX: 5 }] },
                ]}
              >
                {/* İkon */}
                <View
                  style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isActive && styles.stepIconActive,
                  ]}
                >
                  {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                  {isActive && <View style={styles.activeDot} />}
                </View>

                {/* Metin */}
                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.stepTextActive,
                    isCompleted && { color: COLORS.textSecondary },
                  ]}
                >
                  {text}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgGlass,
    paddingVertical: 40,
  },
  innerBox: {
    paddingHorizontal: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderLeftColor: COLORS.skyBlue,
    marginBottom: 15,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 25,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepperContainer: {
    width: '100%',
    paddingLeft: 10,
    position: 'relative',
  },
  stepperLine: {
    position: 'absolute',
    left: 25,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  stepIconActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: COLORS.skyBlue,
  },
  checkMark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.skyBlue,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
  },
  stepTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
