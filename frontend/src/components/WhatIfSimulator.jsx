import React, { useState } from 'react';

function WhatIfSimulator({ originalFeatures, originalProb, apiBase }) {
  // Orijinal özellikleri simülasyon state'ine kopyalıyoruz
  const [simulatedFeatures, setSimulatedFeatures] = useState({ ...originalFeatures });
  const [simulatedProb, setSimulatedProb] = useState(originalProb);
  const [simulatedLevel, setSimulatedLevel] = useState(null);
  const [loading, setLoading] = useState(false);

  // Değer değiştiğinde state'i güncelleyen fonksiyon
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setSimulatedFeatures(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Simülasyonu çalıştırıp backend'den yeni sonucu alan fonksiyon
  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: simulatedFeatures }),
      });
      
      const data = await response.json();
      setSimulatedProb(data.risk_probability);
      setSimulatedLevel(data.risk_level);
    } catch (err) {
      console.error("Simülasyon Hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // Güvenlik: Eğer orijinal veriler henüz gelmediyse bileşeni render etme
  if (!originalFeatures) return null;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="5"/>
          </svg>
        </div>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>"What-If" Simülasyonu</h3>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Mevcut verilerinizle oynayarak algoritmik risk skorunuzun nasıl değiştiğini canlı olarak test edin.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        {/* Kredi Kartı Kullanım Oranı Slider (Eğer veri setinde varsa) */}
        {simulatedFeatures.RevolvingUtilizationOfUnsecuredLines !== undefined && (
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '5px' }}>
              <span>Kredi Kartı Limit Kullanım Oranı</span>
              <span style={{ fontWeight: 'bold' }}>%{(simulatedFeatures.RevolvingUtilizationOfUnsecuredLines * 100).toFixed(0)}</span>
            </label>
            <input 
              type="range" name="RevolvingUtilizationOfUnsecuredLines" 
              min="0" max="2" step="0.05" 
              value={simulatedFeatures.RevolvingUtilizationOfUnsecuredLines} 
              onChange={handleSliderChange}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}

        {/* Aylık Gelir Slider */}
        {simulatedFeatures.MonthlyIncome !== undefined && (
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '5px' }}>
              <span>Aylık Gelir (TL/USD)</span>
              <span style={{ fontWeight: 'bold' }}>{simulatedFeatures.MonthlyIncome}</span>
            </label>
            <input 
              type="range" name="MonthlyIncome" 
              min="0" max="50000" step="1000" 
              value={simulatedFeatures.MonthlyIncome} 
              onChange={handleSliderChange}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '15px', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orijinal Risk</p>
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#94a3b8' }}>%{(originalProb * 100).toFixed(1)}</p>
        </div>
        
        <button 
          onClick={runSimulation}
          disabled={loading}
          style={{
            background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          {loading ? 'Hesaplanıyor...' : 'Simüle Et'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Yeni Senaryo</p>
          <p style={{ 
            margin: 0, fontSize: '1.2rem', fontWeight: 'bold', 
            color: simulatedProb < originalProb ? '#10b981' : simulatedProb > originalProb ? '#ef4444' : '#3b82f6'
          }}>
            %{(simulatedProb * 100).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default WhatIfSimulator;