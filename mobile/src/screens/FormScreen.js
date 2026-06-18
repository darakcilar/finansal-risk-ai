import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { healthCheck, predict } from '../utils/api';

// Bileşenler
import Header from '../components/Header';
import RiskForm from '../components/RiskForm';
import LoadingScreen from '../components/LoadingScreen';
import RiskResult from '../components/RiskResult';
import XAIAssistant from '../components/XAIAssistant';
import PeerComparison from '../components/PeerComparison';
import ShapWaterfall from '../components/ShapWaterfall';
import DecisionPath from '../components/DecisionPath';
import WhatIfSimulator from '../components/WhatIfSimulator';
import Recommendations from '../components/Recommendations';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

export default function FormScreen({ navigation }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [currentFeatures, setCurrentFeatures] = useState(null);
  const scrollRef = useRef(null);
  const { addHistoryItem, user } = useContext(AuthContext);

  // Sunucuyu uyandır
  useEffect(() => {
    healthCheck();
  }, []);

  const handlePredict = async (features, isQuickFill = false) => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setCurrentFeatures(features);

    try {
      const data = await predict(features, isQuickFill, user ? user.id : null);
      setResult(data);
      // Save to history asynchronously
      addHistoryItem(data);
      
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowResults(true);
      }, 500);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !currentFeatures) {
      Alert.alert('Uyarı', 'Lütfen önce bir analiz gerçekleştirin.');
      return;
    }

    // SHAP verileri
    const riskIncreasers = result.shap_values?.filter(s => s.value > 0).slice(0, 3) || [];
    const riskDecreasers = result.shap_values?.filter(s => s.value < 0).slice(0, 3) || [];

    const totalDelays = (parseFloat(currentFeatures['NumberOfTime30-59DaysPastDueNotWorse']) || 0) +
                        (parseFloat(currentFeatures['NumberOfTime60-89DaysPastDueNotWorse']) || 0) +
                        (parseFloat(currentFeatures['NumberOfTimes90DaysLate']) || 0);

    // Tavsiye blokları
    let recHtml = '';
    if (result.recommendations) {
      const recs = result.recommendations;
      if (recs.overallAdvice && recs.overallAdvice.length > 0) {
        recHtml += `
          <div style="margin-bottom:20px;">
            <h3 style="color:#0f172a;font-size:14px;margin-bottom:8px;">📌 Genel Değerlendirme</h3>
            <p style="font-size:12px;color:#334155;font-weight:bold;">${recs.overallSummary || ''}</p>
            <ul style="font-size:12px;color:#475569;line-height:1.6;">${recs.overallAdvice.map(a => `<li>${a}</li>`).join('')}</ul>
          </div>
        `;
      }
      if (recs.riskFactors && recs.riskFactors.length > 0) {
        recHtml += `<h3 style="color:#e11d48;font-size:14px;">⚠️ Öncelikli İyileştirme Alanları</h3>`;
        recs.riskFactors.forEach(rf => {
          recHtml += `
            <div style="margin-bottom:15px;background:#fdf2f8;padding:12px;border-left:4px solid #f43f5e;border-radius:4px;">
              <strong style="font-size:13px;">${rf.icon} ${rf.feature} (${rf.currentValue})</strong>
              <p style="font-size:11px;color:#334155;">${rf.explanation}</p>
              <ul style="font-size:11px;color:#475569;">${(rf.advice || []).map(a => `<li>${a}</li>`).join('')}</ul>
            </div>
          `;
        });
      }
    }
    if (!recHtml) recHtml = '<p style="font-size:12px;">Finansal verilerinizi düzenli takip edin.</p>';

    // SHAP HTML
    let shapHtml = '';
    if (riskIncreasers.length > 0 || riskDecreasers.length > 0) {
      shapHtml = `
        <h2 style="color:#0f172a;font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;">3. Bireysel Risk Etkenleri (SHAP)</h2>
        <div style="display:flex;gap:15px;margin-top:15px;">
          <div style="flex:1;background:#fff1f2;border:1px solid #ffe4e6;padding:15px;border-radius:8px;">
            <strong style="color:#e11d48;">📈 Riski Artıranlar</strong>
            <ul style="font-size:12px;">${riskIncreasers.map(s => `<li>${s.feature}</li>`).join('')}</ul>
          </div>
          <div style="flex:1;background:#ecfdf5;border:1px solid #d1fae5;padding:15px;border-radius:8px;">
            <strong style="color:#059669;">📉 Riski Düşürenler</strong>
            <ul style="font-size:12px;">${riskDecreasers.map(s => `<li>${s.feature}</li>`).join('')}</ul>
          </div>
        </div>
      `;
    }

    const reportHtml = `
      <html><head><meta charset="UTF-8"/><style>body{font-family:'Segoe UI',sans-serif;padding:20px;color:#1e293b;}</style></head><body>
        <div style="border-bottom:3px solid #0284c7;padding-bottom:15px;margin-bottom:25px;">
          <h1 style="color:#0f172a;margin:0;font-size:22px;">Finansal Risk Analiz Raporu</h1>
          <p style="color:#64748b;font-size:12px;">Explainable AI (XAI) Sistem Çıktısı — ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;margin-bottom:25px;display:flex;justify-content:space-between;">
          <div><span style="color:#64748b;font-size:11px;">Yaş</span><br/><strong>${currentFeatures.age || '-'}</strong></div>
          <div><span style="color:#64748b;font-size:11px;">Aylık Gelir</span><br/><strong>${currentFeatures.MonthlyIncome ? Number(currentFeatures.MonthlyIncome).toLocaleString('tr-TR') + ' ₺' : '-'}</strong></div>
          <div><span style="color:#64748b;font-size:11px;">Gecikme</span><br/><strong>${totalDelays} Kez</strong></div>
          <div><span style="color:#64748b;font-size:11px;">Kredi/Kart</span><br/><strong>${currentFeatures.NumberOfOpenCreditLinesAndLoans || '0'}</strong></div>
        </div>
        <h2 style="color:#0284c7;font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;">1. XAI Yönetici Özeti</h2>
        <p style="background:#f0f9ff;padding:16px;border-left:4px solid #0284c7;border-radius:0 8px 8px 0;font-size:13px;line-height:1.6;">${result.xai_advice || 'XAI motoru yanıt vermedi.'}</p>
        <h2 style="color:#0f172a;font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;">2. Model Çıktısı</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:12px;border:1px solid #cbd5e1;background:#f1f5f9;">Risk Seviyesi</td><td style="padding:12px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:${result.risk_level === 'low' ? '#059669' : result.risk_level === 'medium' ? '#d97706' : '#dc2626'};">${result.risk_label || result.risk_level}</td></tr>
          <tr><td style="padding:12px;border:1px solid #cbd5e1;background:#f1f5f9;">Risk Olasılığı</td><td style="padding:12px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;font-size:18px;">%${((result.risk_probability || 0) * 100).toFixed(1)}</td></tr>
        </table>
        ${shapHtml}
        <h2 style="color:#0f172a;font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-top:25px;">${shapHtml ? '4' : '3'}. Eylem Planı</h2>
        ${recHtml}
        <div style="margin-top:30px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:15px;">
          <p style="font-weight:bold;color:#64748b;">Bu rapor XAI destekli Random Forest algoritması tarafından üretilmiştir.</p>
          <p>Bu belge resmi bir finansal danışmanlık niteliği taşımaz.</p>
        </div>
      </body></html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: reportHtml });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Finansal Risk Raporu',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Başarılı', 'PDF oluşturuldu: ' + uri);
      }
    } catch (err) {
      Alert.alert('Hata', 'PDF oluşturulamadı: ' + err.message);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowResults(false);
    setError(null);
    setCurrentFeatures(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Risk Analizi</Text>
        <View style={{ width: 60 }} />
      </View>

      <Header />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Form Bölümü */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Text style={styles.sectionIconText}>👥</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
              <Text style={styles.sectionSubtitle}>Mali verileri girerek yapay zeka analizini başlatın</Text>
            </View>
          </View>

          <RiskForm onSubmit={handlePredict} loading={loading} />

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Sonuçlar Bölümü */}
        {loading ? (
          <LoadingScreen />
        ) : result && showResults ? (
          <View style={styles.resultsSection}>
            {/* Başlık + PDF */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderTitle}>Analiz Raporu</Text>
              <TouchableOpacity onPress={handleDownloadPDF} style={styles.pdfBtn} activeOpacity={0.7}>
                <Text style={styles.pdfBtnText}>📄 PDF İndir</Text>
              </TouchableOpacity>
            </View>

            <RiskResult
              riskProbability={result.risk_probability}
              riskLevel={result.risk_level}
              riskLabel={result.risk_label}
              localExplanation={result.local_explanation}
            />
            <XAIAssistant advice={result.xai_advice} />
            <PeerComparison features={currentFeatures} riskProbability={result.risk_probability} />
            <ShapWaterfall shapValues={result.shap_values || []} />
            <DecisionPath
              explanations={result.local_explanation?.explanations || []}
              summary={result.local_explanation?.summary || ''}
              decisionPath={result.decision_path || []}
            />
            <WhatIfSimulator
              originalFeatures={currentFeatures}
              originalProb={result.risk_probability}
              apiBase={API_BASE}
            />
            <Recommendations recommendations={result.recommendations} />

            {/* Yeni Analiz Butonu */}
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
              <Text style={styles.resetBtnText}>Yeni Analiz Yap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Boş Durum */
          <View style={styles.emptyState}>
            <Text style={styles.emptyRobot}>🤖</Text>
            <Text style={styles.emptyTitle}>Yapay Zeka Analize Hazır</Text>
            <Text style={styles.emptyDesc}>
              Müşterinin finansal verilerini yukarıdaki forma girerek{' '}
              <Text style={{ fontWeight: '700' }}>"Risk Analizi Yap"</Text> butonuna basın.
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.techBadge, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <Text style={[styles.techBadgeText, { color: COLORS.skyBlue }]}>🌳 Random Forest</Text>
              </View>
              <View style={[styles.techBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={[styles.techBadgeText, { color: COLORS.emerald }]}>🧠 SHAP XAI</Text>
              </View>
              <View style={[styles.techBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Text style={[styles.techBadgeText, { color: COLORS.violet }]}>📄 PDF Raporu</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Finansal Risk AI — Explainable Artificial Intelligence (XAI)</Text>
          <Text style={styles.footerSub}>Mimari: Node.js + Python (Random Forest) + Rule-based NLG</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: COLORS.borderGlass,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  topHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconText: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(252, 129, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252, 129, 129, 0.2)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 14,
  },
  errorText: {
    color: COLORS.accentRed,
    fontSize: 14,
  },
  resultsSection: {
    marginTop: 24,
    gap: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  pdfBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pdfBtnText: {
    color: COLORS.emerald,
    fontSize: 13,
    fontWeight: '700',
  },
  resetBtn: {
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
  },
  resetBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyRobot: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  techBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  techBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGlass,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  footerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },
});
