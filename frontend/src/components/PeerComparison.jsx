import React from 'react';

function PeerComparison({ features, riskProbability }) {
  if (!features) return null;

  // Kullanıcı Verileri
  const age = parseFloat(features.age) || 30;
  const userRisk = Math.round(riskProbability * 100);
  const userUtil = (parseFloat(features.RevolvingUtilizationOfUnsecuredLines) || 0) * 100;
  const userDebt = (parseFloat(features.DebtRatio) || 0) * 100;

  // Dinamik "Akran" Ortalamaları (Yaşa ve Genel İstatistiklere Göre Simüle Edilmiş)
  let avgRisk = 45;
  let avgUtil = 40;
  let avgDebt = 35;

  let groupName = "Genel Yaş Ortalaması";
  if (age < 30) {
    avgRisk = 55; avgUtil = 60; avgDebt = 45; groupName = "20-29 Yaş Grubu";
  } else if (age >= 30 && age < 45) {
    avgRisk = 40; avgUtil = 45; avgDebt = 40; groupName = "30-44 Yaş Grubu";
  } else if (age >= 45 && age < 60) {
    avgRisk = 30; avgUtil = 25; avgDebt = 30; groupName = "45-59 Yaş Grubu";
  } else {
    avgRisk = 20; avgUtil = 15; avgDebt = 20; groupName = "60+ Yaş Grubu";
  }

  // Kullanıcının başarı yüzdesini (Percentile) hesapla
  let percentile = 50 + (avgRisk - userRisk);
  if (percentile > 99) percentile = 99;
  if (percentile < 1) percentile = 1;

  // Tasarım renkleri
  const getScoreColor = (userVal, avgVal, isReversed = false) => {
    // Normalde düşük değer iyidir (Risk, Borç vb.)
    const diff = avgVal - userVal;
    if (diff > 5) return '#10b981'; // Daha iyi (Yeşil)
    if (diff < -5) return '#ef4444'; // Daha kötü (Kırmızı)
    return '#f59e0b'; // Ortalama (Sarı)
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>Akran Karşılaştırması</h3>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
        Sizinle benzer demografik özelliklere (<strong style={{color: '#38bdf8'}}>{groupName}</strong>) sahip diğer kullanıcıların ortalamalarına göre durumunuz:
      </p>

      {/* Ana Skor Başarı Yüzdesi */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '16px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#cbd5e1', fontSize: '0.95rem' }}>Toplumsal Sıralama</h4>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Aynı yaş grubundaki kullanıcıların</span>
        </div>
        <div style={{ 
          background: percentile >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          border: `1px solid ${percentile >= 50 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          padding: '8px 16px', borderRadius: '8px', textAlign: 'center'
        }}>
          <div style={{ color: percentile >= 50 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
            %{(100 - percentile).toFixed(0)}'undan
          </div>
          <div style={{ color: percentile >= 50 ? '#10b981' : '#ef4444', fontSize: '0.8rem' }}>
            Daha İyi Durumdasınız
          </div>
        </div>
      </div>

      {/* Detaylı Karşılaştırma Barları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Risk Puanı Barı */}
        <ComparisonBar 
          label="Genel Risk Puanı" 
          userVal={userRisk} 
          avgVal={avgRisk} 
          unit="%" 
          color={getScoreColor(userRisk, avgRisk)} 
        />

        {/* Kredi Kartı Kullanımı Barı */}
        <ComparisonBar 
          label="Kart Kullanım Oranı" 
          userVal={userUtil} 
          avgVal={avgUtil} 
          unit="%" 
          color={getScoreColor(userUtil, avgUtil)} 
        />

        {/* Borç/Gelir Oranı Barı */}
        <ComparisonBar 
          label="Borç / Gelir Oranı" 
          userVal={userDebt} 
          avgVal={avgDebt} 
          unit="%" 
          color={getScoreColor(userDebt, avgDebt)} 
        />

      </div>
    </div>
  );
}

// Alt Bileşen: Karşılaştırma Çubukları
function ComparisonBar({ label, userVal, avgVal, unit, color }) {
  // Grafik çubuğunun genişliğini sınırlar (taşıp ekranı bozmasın diye)
  const safeUserWidth = Math.min(Math.max(userVal, 5), 100);
  const safeAvgWidth = Math.min(Math.max(avgVal, 5), 100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
        <span style={{ color: '#cbd5e1' }}>{label}</span>
        <span style={{ color: color, fontWeight: 'bold' }}>Siz: {userVal.toFixed(0)}{unit}</span>
      </div>
      
      {/* Kullanıcı Barı */}
      <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', marginBottom: '4px' }}>
        <div style={{ width: `${safeUserWidth}%`, background: color, height: '100%', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
      </div>
      
      {/* Ortalama Barı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '4px' }}>
          <div style={{ width: `${safeAvgWidth}%`, background: '#64748b', height: '100%', borderRadius: '4px' }}></div>
        </div>
        <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Akran Ort.: {avgVal.toFixed(0)}{unit}</span>
      </div>
    </div>
  );
}

export default PeerComparison;