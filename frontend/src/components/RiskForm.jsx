import { useState } from 'react';

function RiskForm({ onSubmit, loading }) {
  // Modelin beklediği oranlar yerine, kullanıcının kolayca girebileceği gerçek değerleri tutuyoruz
  const [formData, setFormData] = useState({
    creditCardBalance: '', // Kullanıcının güncel kredi kartı borcu
    creditCardLimit: '',   // Kullanıcının toplam kredi kartı limiti
    age: '',
    monthlyDebt: '',       // Aylık ödediği toplam borç taksiti
    monthlyIncome: '',     // Aylık net geliri
    late3059: '0',
    late6089: '0',
    late90: '0',
    openCreditLines: '',
    realEstateLoans: '0',
    dependents: '0'
  });

  // YENİ EKLENEN HAFIZA: Bu form hızlı doldur ile mi dolduruldu?
  const [isTestMode, setIsTestMode] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Eğer kullanıcı hızlı doldurdan sonra formla manuel oynamaya başlarsa, test modunu iptal edebiliriz 
    // (Böylece değişiklikleri veritabanına kaydeder). Eğer test olarak kalsın dersen bu satırı silebilirsin.
    setIsTestMode(false); 
  };

  // Mouse tekerleği ile sayıların değişmesini engellemek için
  const handleWheel = (e) => {
    e.target.blur(); // Input'tan odağı çeker, böylece sayfa kaymaya devam eder
  };

  const handleFastFill = (type) => {
    // 1. Seçilen tipe göre veriyi bir değişkende topluyoruz
    const selectedData = type === 'lowRisk' 
      ? {
          creditCardBalance: '2000',
          creditCardLimit: '10000',
          age: '35',
          monthlyDebt: '1500',
          monthlyIncome: '8000',
          late3059: '0',
          late6089: '0',
          late90: '0',
          openCreditLines: '4',
          realEstateLoans: '1',
          dependents: '1'
        }
      : {
          creditCardBalance: '18000',
          creditCardLimit: '20000',
          age: '24',
          monthlyDebt: '4500',
          monthlyIncome: '5000',
          late3059: '3',
          late6089: '1',
          late90: '0',
          openCreditLines: '8',
          realEstateLoans: '0',
          dependents: '2'
        };

    // 2. Ekrandaki kutucukların dolması için state'i güncelliyoruz
    setFormData(selectedData);

    // 3. KRİTİK NOKTA: Sadece formun dolduğunu ve bunun bir TEST olduğunu sisteme bildiriyoruz. 
    // OTOMATİK OLARAK ONSUBMIT YAPMIYORUZ!
    setIsTestMode(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Gerekli verileri sayıya çeviriyoruz (Boş bırakılmışsa 0 sayıyoruz)
    const ccBalance = parseFloat(formData.creditCardBalance) || 0;
    const ccLimit = parseFloat(formData.creditCardLimit) || 0;
    const debt = parseFloat(formData.monthlyDebt) || 0;
    const income = parseFloat(formData.monthlyIncome) || 0;

    // 2. Arka planda modelin (Python) beklediği zor oranları (Ratios) biz hesaplıyoruz
    // Limit 0'dan büyükse borcu limite böl, yoksa 0 veya 1 yap.
    const ccUtilizationRatio = ccLimit > 0 ? (ccBalance / ccLimit) : (ccBalance > 0 ? 1 : 0);
    
    // Gelir 0'dan büyükse borcu gelire böl, yoksa doğrudan borcu kullan.
    const debtRatio = income > 0 ? (debt / income) : debt;

    // --- KISITLAMALAR VE DOĞRULAMALAR ---
    if (ccBalance > ccLimit) {
      alert("Hata: Güncel kart borcunuz, toplam kart limitinizden yüksek olamaz.");
      return;
    }
    if (parseFloat(formData.age) < 18 || parseFloat(formData.age) > 100) {
      alert("Hata: Lütfen 18 ile 100 arasında geçerli bir yaş girin.");
      return;
    }
    if (income === 0 && debt > 100000) {
      alert("Hata: Aylık net gelir 0 iken girilen borç miktarı gerçekçi değil. Lütfen kontrol edin.");
      return;
    }
    if (income > 0 && debt > income * 20) {
      alert("Hata: Aylık borç ödemeniz, aylık gelirinizin 20 katından fazla olamaz. Bu sistem tarafından geçersiz sayılır.");
      return;
    }
    if (income > 10000000 || debt > 10000000) {
      alert("Hata: Lütfen 10,000,000 TL'den daha düşük, gerçekçi değerler girin.");
      return;
    }
    // ------------------------------------

    // 3. Python ML Modelinin tam olarak beklediği formatta objeyi oluşturuyoruz
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
      "NumberOfDependents": parseFloat(formData.dependents) || 0
    };

    // App.jsx'e mlFeatures'ı VE isTestMode bilgisini (skip_log olarak) gönderiyoruz
    onSubmit(mlFeatures, isTestMode);

    // Gönderim yapıldıktan sonra test modunu tekrar sıfırlıyoruz ki bir sonraki işlem normal kaydedilsin
    setIsTestMode(false);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hızlı Doldur:</span>
        <button 
          type="button" 
          onClick={() => handleFastFill('lowRisk')}
          style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Düşük Risk
        </button>
        <button 
          type="button" 
          onClick={() => handleFastFill('highRisk')}
          style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Yüksek Risk
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* --- KREDİ KARTI BİLGİLERİ (Hesaplama için iki ayrı alan) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>💳 Güncel Kart Borcu (₺)</label>
            <input type="number" name="creditCardBalance" value={formData.creditCardBalance} onChange={handleChange} onWheel={handleWheel} required placeholder="Örn: 2500" min="0" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>🏦 Toplam Kart Limiti (₺)</label>
            <input type="number" name="creditCardLimit" value={formData.creditCardLimit} onChange={handleChange} onWheel={handleWheel} required placeholder="Örn: 10000" min="0" />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-12px' }}>Kredi kartı kullanım oranınız arka planda otomatik hesaplanacaktır.</p>

        {/* --- GELİR VE BORÇ BİLGİLERİ (Hesaplama için iki ayrı alan) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>💰 Aylık Net Gelir (₺)</label>
            <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} onWheel={handleWheel} required placeholder="Örn: 35000" min="0" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>📊 Aylık Borç Ödemesi (₺)</label>
            <input type="number" name="monthlyDebt" value={formData.monthlyDebt} onChange={handleChange} onWheel={handleWheel} required placeholder="Kredi, fatura vb." min="0" />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-12px' }}>Borç/Gelir oranınız arka planda otomatik hesaplanacaktır.</p>

        {/* --- DİĞER BİLGİLER --- */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>👤 Yaş</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} onWheel={handleWheel} required placeholder="Müşterinin yaşı" min="18" max="120" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>⏰ 30-59 Gün Gecikme</label>
            <input type="number" name="late3059" value={formData.late3059} onChange={handleChange} onWheel={handleWheel} min="0" title="Son 2 yılda 30-59 gün arası gecikme sayısı" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>⚠️ 60-89 Gün Gecikme</label>
            <input type="number" name="late6089" value={formData.late6089} onChange={handleChange} onWheel={handleWheel} min="0" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>🚨 90+ Gün Gecikme</label>
            <input type="number" name="late90" value={formData.late90} onChange={handleChange} onWheel={handleWheel} min="0" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>📑 Açık Kredi/Kart Sayısı</label>
            <input type="number" name="openCreditLines" value={formData.openCreditLines} onChange={handleChange} onWheel={handleWheel} required min="0" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>🏠 İpotekli Kredi Sayısı</label>
            <input type="number" name="realEstateLoans" value={formData.realEstateLoans} onChange={handleChange} onWheel={handleWheel} min="0" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>👨‍👩‍👧‍👦 Bakmakla Yükümlü Kişi Sayısı</label>
          <input type="number" name="dependents" value={formData.dependents} onChange={handleChange} onWheel={handleWheel} min="0" />
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          {loading ? <div className="spinner"></div> : 'Risk Analizi Yap 🚀'}
        </button>
      </form>
    </div>
  );
}

export default RiskForm;