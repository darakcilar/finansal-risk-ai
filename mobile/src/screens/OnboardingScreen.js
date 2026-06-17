import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Finansal Geleceğinizi\nŞekillendirin',
    desc: 'Yapay zeka destekli altyapımızla risk analizinizi saniyeler içinde yapın.',
    icon: '🚀'
  },
  {
    id: '2',
    title: 'Detaylı ve Anlaşılır\nRaporlar',
    desc: 'Karmaşık finansal verileri Explainable AI (XAI) ile anlaşılır grafiklere dönüştürüyoruz.',
    icon: '📊'
  },
  {
    id: '3',
    title: 'Kişiselleştirilmiş\nÖneriler',
    desc: 'Analiz sonucunuza özel iyileştirme tavsiyeleriyle finansal sağlığınızı koruyun.',
    icon: '💡'
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { completeOnboarding } = useContext(AuthContext);

  const nextSlide = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{slides[currentSlide].icon}</Text>
        </View>
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.desc}>{slides[currentSlide].desc}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, currentSlide === i && styles.activeDot]} />
          ))}
        </View>
        
        <TouchableOpacity style={styles.button} onPress={nextSlide} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? "Başla" : "İleri"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  icon: { fontSize: 60 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 15, lineHeight: 34 },
  desc: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  footer: { padding: 30 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.borderGlass, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: COLORS.skyBlue },
  button: { backgroundColor: COLORS.skyBlue, padding: 16, borderRadius: RADIUS.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
