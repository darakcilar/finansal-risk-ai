import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, SHADOWS } from '../theme/colors';

export default function RiskForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    creditCardBalance: '',
    creditCardLimit: '',
    age: '',
    monthlyDebt: '',
    monthlyIncome: '',
    late3059: '0',
    late6089: '0',
    late90: '0',
    openCreditLines: '',
    realEstateLoans: '0',
    dependents: '0',
  });

  const [isTestMode, setIsTestMode] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsTestMode(false);
  };

  const handleFastFill = (type) => {
    const data = type === 'lowRisk'
      ? {
          creditCardBalance: '2000', creditCardLimit: '10000', age: '35',
          monthlyDebt: '1500', monthlyIncome: '8000', late3059: '0',
          late6089: '0', late90: '0', openCreditLines: '4',
          realEstateLoans: '1', dependents: '1',
        }
      : {
          creditCardBalance: '18000', creditCardLimit: '20000', age: '24',
          monthlyDebt: '4500', monthlyIncome: '5000', late3059: '3',
          late6089: '1', late90: '0', openCreditLines: '8',
          realEstateLoans: '0', dependents: '2',
        };
    setFormData(data);
    setIsTestMode(true);
  };

  const handleSubmit = () => {
    const ccBalance = parseFloat(formData.creditCardBalance) || 0;
    const ccLimit = parseFloat(formData.creditCardLimit) || 0;
    const debt = parseFloat(formData.monthlyDebt) || 0;
    const income = parseFloat(formData.monthlyIncome) || 0;

    const ccUtilizationRatio = ccLimit > 0 ? (ccBalance / ccLimit) : (ccBalance > 0 ? 1 : 0);
    const debtRatio = income > 0 ? (debt / income) : debt;

    const mlFeatures = {
      "RevolvingUtilizationOfUnsecuredLines": ccUtilizationRatio,
      "age": parseFloat(formData.age) || 0,
      "NumberOfTime30-59DaysPastDueNotWorse": parseFloat(formData.late3059) || 0,
      "DebtRatio": debtRatio,
      "MonthlyIncome": income,
      "NumberOfOpenCreditLinesAndLoans": parseFloat(formData.openCreditLines) || 0,
      "NumberOfTimes90DaysLate": parseFloat(formData.late90) || 0,
      "NumberRealEstateLoansOrLines": parseFloat(formData.realEstateLoans) || 0,
      "NumberOfTime60-89DaysPastDueNotWorse": parseFloat(formData.late6089) || 0,
      "NumberOfDependents": parseFloat(formData.dependents) || 0,
    };

    onSubmit(mlFeatures, isTestMode);
    setIsTestMode(false);
  };

  const renderInput = (label, name, placeholder, opts = {}) => (
    <View style={[styles.inputGroup, opts.style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={formData[name]}
        onChangeText={(val) => handleChange(name, val)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
        returnKeyType="next"
      />
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Hızlı Doldur */}
      <View style={styles.fastFillRow}>
        <Text style={styles.fastFillLabel}>Hızlı Doldur:</Text>
        <TouchableOpacity style={styles.fastFillBtn} onPress={() => handleFastFill('lowRisk')}>
          <Text style={styles.fastFillBtnText}>Düşük Risk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fastFillBtn} onPress={() => handleFastFill('highRisk')}>
          <Text style={styles.fastFillBtnText}>Yüksek Risk</Text>
        </TouchableOpacity>
      </View>

      {/* Kredi Kartı Bilgileri */}
      <View style={styles.row}>
        {renderInput('💳 Güncel Kart Borcu (₺)', 'creditCardBalance', 'Örn: 2500', { style: { flex: 1 } })}
        {renderInput('🏦 Toplam Kart Limiti (₺)', 'creditCardLimit', 'Örn: 10000', { style: { flex: 1 } })}
      </View>
      <Text style={styles.hint}>Kredi kartı kullanım oranınız otomatik hesaplanacaktır.</Text>

      {/* Gelir ve Borç */}
      <View style={styles.row}>
        {renderInput('💰 Aylık Net Gelir (₺)', 'monthlyIncome', 'Örn: 35000', { style: { flex: 1 } })}
        {renderInput('📊 Aylık Borç Ödemesi (₺)', 'monthlyDebt', 'Kredi, fatura vb.', { style: { flex: 1 } })}
      </View>
      <Text style={styles.hint}>Borç/Gelir oranınız otomatik hesaplanacaktır.</Text>

      {/* Yaş */}
      {renderInput('👤 Yaş', 'age', 'Müşterinin yaşı')}

      {/* Gecikme Bilgileri */}
      <View style={styles.row}>
        {renderInput('⏰ 30-59 Gün', 'late3059', '0', { style: { flex: 1 } })}
        {renderInput('⚠️ 60-89 Gün', 'late6089', '0', { style: { flex: 1 } })}
        {renderInput('🚨 90+ Gün', 'late90', '0', { style: { flex: 1 } })}
      </View>

      {/* Kredi Bilgileri */}
      <View style={styles.row}>
        {renderInput('📑 Açık Kredi/Kart', 'openCreditLines', '0', { style: { flex: 1 } })}
        {renderInput('🏠 İpotekli Kredi', 'realEstateLoans', '0', { style: { flex: 1 } })}
      </View>

      {/* Bakmakla Yükümlü */}
      {renderInput('👨‍👩‍👧‍👦 Bakmakla Yükümlü Kişi', 'dependents', '0')}

      {/* Submit Butonu */}
      <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8} style={{ marginTop: 16 }}>
        <LinearGradient colors={GRADIENTS.primary} style={[styles.submitBtn, loading && { opacity: 0.5 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitText}>Risk Analizi Yap 🚀</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
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
  fastFillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  fastFillLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  fastFillBtn: {
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fastFillBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -8,
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowBlue,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
