import React, { useState, useEffect } from 'react';

function TrainingStatsView({ apiBase }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/admin/training-stats`)
      .then(res => {
        if (!res.ok) throw new Error('Veriler sunucudan alınamadı.');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiBase]);

  if (loading) return <div style={{ color: '#38bdf8', padding: '20px' }}>Eğitim metrikleri yükleniyor...</div>;
  if (error) return <div style={{ color: '#ef4444', padding: '20px' }}>Hata: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
      
      {/* ÜST ÖZET KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Toplam Eğitim Verisi</h4>
          <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>
            {stats.total_samples.toLocaleString()} Satır
          </p>
        </div>
        {stats.class_distribution.map((cls, idx) => (
          <div key={idx} className="stat-card" style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{cls.name}</h4>
            <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: cls.color }}>
              %{cls.percentage} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>({cls.count.toLocaleString()})</span>
            </p>
          </div>
        ))}
      </div>

      {/* 2 SÜTUNLU GRAFİK ALANI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* 1. GRAFİK: Sınıf Dağılım Barı (Balans Kontrolü) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#e2e8f0' }}>⚖️ Veri Seti Risk Dengesi (Class Imbalance)</h3>
          <div style={{ display: 'flex', height: '35px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            {stats.class_distribution.map((cls, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: `${cls.percentage}%`, 
                  background: cls.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
                title={`${cls.name}: ${cls.count}`}
              >
                %{cls.percentage}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', fontSize: '0.85rem' }}>
            {stats.class_distribution.map((cls, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: cls.color, borderRadius: '3px' }}></span>
                <span style={{ color: '#94a3b8' }}>{cls.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. GRAFİK: Düşük vs Yüksek Risk Metrik Karşılaştırması */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#e2e8f0' }}>📊 Profil Karşılaştırma Analizi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.feature_comparisons.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{item.metric}</span>
                  <span style={{ color: '#64748b' }}>
                    <span style={{ color: '#10b981' }}>{item.low_risk}{item.unit}</span> vs <span style={{ color: '#ef4444' }}>{item.high_risk}{item.unit}</span>
                  </span>
                </div>
                {/* Çift yönlü ilerleme çubuğu */}
                <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(item.low_risk / (item.low_risk + item.high_risk)) * 100}%`, background: '#10b981' }}></div>
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(item.high_risk / (item.low_risk + item.high_risk)) * 100}%`, background: '#ef4444' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TrainingStatsView;