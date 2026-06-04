/**
 * recommendations.js
 * ------------------
 * Generates detailed, actionable Turkish-language financial recommendations
 * based on the risk analysis results from the ML model.
 */

/**
 * Generate comprehensive recommendations based on input features and risk
 * @param {object} features - Input features
 * @param {number} riskProbability - Risk probability (0-1)
 * @param {string} riskLevel - 'low', 'medium', or 'high'
 * @param {Array} featureImportances - Feature importance list
 * @returns {object} Detailed recommendations
 */
function generateRecommendations(features, riskProbability, riskLevel, featureImportances) {
  const recommendations = [];
  const riskFactors = [];
  const positiveFactors = [];

  // ─── 1. Kredi Kartı Kullanım Oranı ───
  const ccUtil = features['RevolvingUtilizationOfUnsecuredLines'] || 0;
  if (ccUtil > 0.7) {
    riskFactors.push({
      feature: 'Kredi Kartı Kullanım Oranı',
      icon: '💳',
      severity: 'critical',
      currentValue: `%${(ccUtil * 100).toFixed(0)}`,
      idealRange: '%0 – %30',
      status: 'Çok Yüksek',
      explanation: `Kredi kartlarınızın %${(ccUtil * 100).toFixed(0)}'ini kullanıyorsunuz. Bu oran, kredi değerlendirme kuruluşları tarafından yüksek risk göstergesi olarak kabul edilir. Kredi limitinizin %30'undan fazlasını kullanmak, finansal baskı altında olduğunuz izlenimini verir.`,
      advice: [
        'Kredi kartı bakiyenizi limitin %30\'unun altına düşürmeye çalışın.',
        'En yüksek faizli karttan başlayarak borçları ödeyin (avalanche yöntemi).',
        'Mümkünse kredi limitinizi artırarak kullanım oranını düşürün.',
        'Yeni alışverişlerde kredi kartı yerine banka kartı kullanmayı tercih edin.',
        'Otomatik ödeme talimatlarını gözden geçirip gereksiz abonelikleri iptal edin.'
      ]
    });
  } else if (ccUtil > 0.3) {
    riskFactors.push({
      feature: 'Kredi Kartı Kullanım Oranı',
      icon: '💳',
      severity: 'warning',
      currentValue: `%${(ccUtil * 100).toFixed(0)}`,
      idealRange: '%0 – %30',
      status: 'Orta',
      explanation: `Kredi kartı kullanım oranınız %${(ccUtil * 100).toFixed(0)}. Kabul edilebilir seviyede ancak %30'un altına düşürmek risk puanınızı olumlu etkileyecektir.`,
      advice: [
        'Aylık bakiyenizi limitin %30\'unun altında tutmaya özen gösterin.',
        'Fatura kesim tarihinden önce kısmi ödeme yaparak kullanım oranını düşürün.'
      ]
    });
  } else {
    positiveFactors.push({
      feature: 'Kredi Kartı Kullanım Oranı',
      icon: '💳',
      currentValue: `%${(ccUtil * 100).toFixed(0)}`,
      message: 'Kredi kartı kullanım oranınız sağlıklı seviyede. Bu, risk puanınızı olumlu etkiliyor.'
    });
  }

  // ─── 2. Yaş ───
  const age = features['age'] || 30;
  if (age < 25) {
    riskFactors.push({
      feature: 'Yaş & Kredi Geçmişi',
      icon: '👤',
      severity: 'info',
      currentValue: `${age} yaş`,
      idealRange: '30+ yaş',
      status: 'Genç Profil',
      explanation: `${age} yaşındasınız. Genç yaş, kısa kredi geçmişi anlamına gelir. Finans kuruluşları daha uzun kredi geçmişi olan bireyleri daha güvenilir bulur. Bu doğal bir süreçtir ve zamanla iyileşecektir.`,
      advice: [
        'Kredi geçmişinizi erken oluşturmak için düzenli ve küçük miktarlı kredi kullanın.',
        'Tüm faturalarınızı zamanında ödeyerek olumlu bir ödeme geçmişi oluşturun.',
        'Kredi kartınızı aktif tutun ancak bakiyeyi düşük seviyede tutun.',
        'Gereksiz yere çok sayıda kredi başvurusu yapmaktan kaçının.'
      ]
    });
  } else if (age >= 25 && age <= 60) {
    positiveFactors.push({
      feature: 'Yaş & Kredi Geçmişi',
      icon: '👤',
      currentValue: `${age} yaş`,
      message: 'Yaşınız, yeterli kredi geçmişi oluşturmak için uygun bir aralıkta.'
    });
  }

  // ─── 3. Gecikme Sayıları ───
  const late30 = features['NumberOfTime30-59DaysPastDueNotWorse'] || 0;
  const late60 = features['NumberOfTime60-89DaysPastDueNotWorse'] || 0;
  const late90 = features['NumberOfTimes90DaysLate'] || 0;
  const totalLate = late30 + late60 + late90;

  if (late90 > 0) {
    riskFactors.push({
      feature: 'Ciddi Ödeme Gecikmeleri (90+ Gün)',
      icon: '🚨',
      severity: 'critical',
      currentValue: `${late90} kez`,
      idealRange: '0 kez',
      status: 'Kritik',
      explanation: `Son 2 yılda ${late90} kez 90 günden fazla ödeme gecikmesi yaşanmış. Bu, finans sektöründe "ciddi temerrüt" olarak kabul edilir ve kredi puanınızı en çok olumsuz etkileyen faktörlerden biridir. Bir 90+ gün gecikmesi, kredi puanınızı 100 puana kadar düşürebilir.`,
      advice: [
        'Mevcut tüm gecikmeli ödemelerinizi acilen güncelleyin.',
        'Otomasitk ödeme talimatı kurarak gelecekteki gecikmeleri önleyin.',
        'Ödeme güçlüğü yaşıyorsanız bankanızla yapılandırma görüşmesi yapın.',
        'Gecikmeler kredi raporunuzda 7 yıl kalır; bu süreçte düzenli ödeme yapın.',
        'Bütçenizi yeniden planlayarak minimum ödemeleri bile zamanında yapın.'
      ]
    });
  }

  if (late60 > 0) {
    riskFactors.push({
      feature: '60-89 Gün Gecikme',
      icon: '⚠️',
      severity: 'warning',
      currentValue: `${late60} kez`,
      idealRange: '0 kez',
      status: 'Uyarı',
      explanation: `${late60} kez 60-89 gün arası ödeme gecikmesi tespit edildi. Bu tür gecikmeler kredi raporunuza olumsuz yansır.`,
      advice: [
        'Tüm fatura ve kredi ödemeleriniz için otomatik ödeme kurun.',
        'Fatura tarihlerini maaş gününe yakın olacak şekilde düzenleyin.',
        'Acil durum fonu oluşturarak beklenmedik durumları karşılayın.'
      ]
    });
  }

  if (late30 > 0) {
    riskFactors.push({
      feature: '30-59 Gün Gecikme',
      icon: '⏰',
      severity: 'warning',
      currentValue: `${late30} kez`,
      idealRange: '0 kez',
      status: 'Dikkat',
      explanation: `${late30} kez 30-59 gün arası ödeme gecikmesi yaşanmış. Her gecikme kredi puanınızı olumsuz etkiler.`,
      advice: [
        'Ödeme hatırlatıcıları kurun (telefon bildirimi, takvim uyarısı).',
        'Mümkünse, fatura son ödeme tarihlerini maaş gününüzün hemen sonrasına taşıyın.'
      ]
    });
  }

  if (totalLate === 0) {
    positiveFactors.push({
      feature: 'Ödeme Geçmişi',
      icon: '✅',
      currentValue: '0 gecikme',
      message: 'Hiç ödeme gecikmesi yok! Mükemmel ödeme disiplini, risk puanınızı çok olumlu etkiliyor.'
    });
  }

  // ─── 4. Borç/Gelir Oranı ───
  const debtRatio = features['DebtRatio'] || 0;
  if (debtRatio > 0.5) {
    riskFactors.push({
      feature: 'Borç / Gelir Oranı',
      icon: '📊',
      severity: debtRatio > 0.8 ? 'critical' : 'warning',
      currentValue: `%${(debtRatio * 100).toFixed(0)}`,
      idealRange: '%0 – %35',
      status: debtRatio > 0.8 ? 'Çok Yüksek' : 'Yüksek',
      explanation: `Aylık borç ödemeleriniz gelirinizin %${(debtRatio * 100).toFixed(0)}'ini oluşturuyor. Finans kuruluşları genellikle %35'in altındaki oranları sağlıklı kabul eder. ${debtRatio > 0.8 ? 'Mevcut oranınız ciddi finansal stres göstergesidir.' : 'Oranınız sınır değerin üzerinde.'}`,
      advice: [
        'En yüksek faizli borçları öncelikli olarak kapatın.',
        'Düşük faizli kredi ile yüksek faizli borçları birleştirmeyi (konsolidasyon) değerlendirin.',
        'Ek gelir kaynakları oluşturmayı düşünün (freelance iş, yarı zamanlı çalışma).',
        'Zorunlu olmayan harcamaları geçici olarak kısıtlayın.',
        'Borç yönetim planı için bir mali danışmana başvurabilirsiniz.'
      ]
    });
  } else if (debtRatio > 0.35) {
    riskFactors.push({
      feature: 'Borç / Gelir Oranı',
      icon: '📊',
      severity: 'info',
      currentValue: `%${(debtRatio * 100).toFixed(0)}`,
      idealRange: '%0 – %35',
      status: 'Dikkat',
      explanation: `Borç/gelir oranınız %${(debtRatio * 100).toFixed(0)}. İdeal aralığın biraz üstünde, ancak yönetilebilir seviyede.`,
      advice: [
        'Yeni borçlanma yapmadan önce mevcut borçları azaltın.',
        'Aylık bütçe planı oluşturarak borç ödeme takviminizi optimize edin.'
      ]
    });
  } else {
    positiveFactors.push({
      feature: 'Borç / Gelir Oranı',
      icon: '📊',
      currentValue: `%${(debtRatio * 100).toFixed(0)}`,
      message: 'Borç/gelir oranınız sağlıklı seviyede. Finansal durumunuz dengeli.'
    });
  }

  // ─── 5. Aylık Gelir ───
  const income = features['MonthlyIncome'] || 0;
  if (income < 3000) {
    riskFactors.push({
      feature: 'Aylık Gelir',
      icon: '💰',
      severity: 'warning',
      currentValue: `$${income.toLocaleString()}`,
      idealRange: '$5,000+',
      status: 'Düşük',
      explanation: `Aylık geliriniz $${income.toLocaleString()} seviyesinde. Düşük gelir, beklenmedik harcamalar karşısında mali dayanıklılığı azaltır ve kredi riskini artırır.`,
      advice: [
        'Mesleki gelişim kurslarına yatırım yaparak kariyer ve gelir seviyenizi artırın.',
        'Yan gelir kaynakları (freelance, online satış, yatırım) oluşturun.',
        'Gelir seviyenize uygun bir bütçe planı oluşturun (50/30/20 kuralı).',
        'Acil durum fonu oluşturun (en az 3 aylık gider karşılığı).'
      ]
    });
  } else if (income >= 8000) {
    positiveFactors.push({
      feature: 'Aylık Gelir',
      icon: '💰',
      currentValue: `$${income.toLocaleString()}`,
      message: 'Aylık geliriniz yüksek seviyede. Bu, mali dayanıklılığınızı ve risk profilinizi olumlu etkiliyor.'
    });
  } else {
    positiveFactors.push({
      feature: 'Aylık Gelir',
      icon: '💰',
      currentValue: `$${income.toLocaleString()}`,
      message: 'Aylık geliriniz orta seviyede. Borçlarınızı yönetilebilir seviyede tutmaya devam edin.'
    });
  }

  // ─── 6. Açık Kredi Sayısı ───
  const openCredits = features['NumberOfOpenCreditLinesAndLoans'] || 0;
  if (openCredits > 10) {
    riskFactors.push({
      feature: 'Açık Kredi Sayısı',
      icon: '🏦',
      severity: 'warning',
      currentValue: `${openCredits} adet`,
      idealRange: '3 – 7 adet',
      status: 'Yüksek',
      explanation: `${openCredits} adet açık kredi veya kredi kartınız var. Çok sayıda açık hesap, aşırı borçlanma riskinin göstergesi olabilir.`,
      advice: [
        'Kullanmadığınız kredi kartlarını kapatmayı değerlendirin.',
        'Aynı türdeki kredileri birleştirerek (konsolidasyon) hesap sayısını azaltın.',
        'Aktif kullanmadığınız ama geçmişi uzun olan hesapları açık tutun (kredi geçmişi için).'
      ]
    });
  }

  // ─── 7. Bakmakla Yükümlü Kişi ───
  const dependents = features['NumberOfDependents'] || 0;
  if (dependents >= 4) {
    riskFactors.push({
      feature: 'Bakmakla Yükümlü Kişi Sayısı',
      icon: '👨‍👩‍👧‍👦',
      severity: 'info',
      currentValue: `${dependents} kişi`,
      idealRange: 'Gelire orantılı',
      status: 'Yüksek Yük',
      explanation: `${dependents} kişiye bakmakla yükümlüsünüz. Fazla bağımlı birey, sabit giderleri artırarak finansal esnekliği azaltır.`,
      advice: [
        'Aile bütçesini detaylı planlayın ve takip edin.',
        'Eğitim ve sağlık giderleri için önceden birikim yapın.',
        'Devlet desteklerinden ve vergi indirimlerinden faydalanın.',
        'Aile sigortası (hayat, sağlık) ile riskleri güvence altına alın.'
      ]
    });
  }

  // ─── Genel Tavsiye Özeti ───
  let overallSummary;
  let overallAdvice;

  if (riskLevel === 'high') {
    overallSummary = 'Yüksek risk profili tespit edildi. Aşağıdaki adımları öncelik sırasına göre uygulamak, risk puanınızı önemli ölçüde düşürebilir.';
    overallAdvice = [
      'Öncelik 1: Gecikmeli tüm ödemeleri hemen güncelleyin.',
      'Öncelik 2: Kredi kartı bakiyelerini limitin %30\'unun altına düşürün.',
      'Öncelik 3: Yeni borçlanmadan kaçının ve mevcut borçları azaltma planı yapın.',
      'Öncelik 4: Acil durum fonu oluşturmaya başlayın (en az 3 aylık gider).',
      'Öncelik 5: Gelir artırma fırsatlarını araştırın.'
    ];
  } else if (riskLevel === 'medium') {
    overallSummary = 'Orta düzey risk profili tespit edildi. Bazı alanlarda iyileştirme yaparak risk puanınızı düşürebilirsiniz.';
    overallAdvice = [
      'Ödeme disiplinini koruyun — tek bir gecikme bile puanı düşürebilir.',
      'Borç/gelir oranınızı %35\'in altında tutmaya çalışın.',
      'Kredi kartı kullanım oranını düşük tutun.',
      'Düzenli birikim yaparak mali güvenlik ağınızı güçlendirin.'
    ];
  } else {
    overallSummary = 'Düşük risk profili — finansal durumunuz sağlıklı görünüyor. Mevcut disiplini korumaya devam edin.';
    overallAdvice = [
      'Mevcut ödeme düzeninizi korumaya devam edin.',
      'Uzun vadeli yatırım planları oluşturun.',
      'Emeklilik ve birikim hesaplarını değerlendirin.',
      'Kredi puanınızı periyodik olarak kontrol edin.'
    ];
  }

  return {
    riskFactors,
    positiveFactors,
    overallSummary,
    overallAdvice,
    riskScore: Math.round(riskProbability * 100),
    riskLevel,
    totalRiskFactors: riskFactors.length,
    totalPositiveFactors: positiveFactors.length,
  };
}

module.exports = { generateRecommendations };
