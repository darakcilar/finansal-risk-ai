import { useState } from 'react';
import './Recommendations.css';

function Recommendations({ recommendations, geminiAdvice }) {
  if (!recommendations) return null;

  const {
    riskFactors,
    positiveFactors,
    overallSummary,
    overallAdvice,
    riskLevel,
    totalRiskFactors,
    totalPositiveFactors,
  } = recommendations;

  const severityConfig = {
    critical: { color: '#fc8181', bg: 'rgba(252, 129, 129, 0.08)', border: 'rgba(252, 129, 129, 0.25)', label: 'Kritik' },
    warning: { color: '#fbd38d', bg: 'rgba(251, 211, 141, 0.08)', border: 'rgba(251, 211, 141, 0.25)', label: 'Uyarı' },
    info: { color: '#a5b4fc', bg: 'rgba(165, 180, 252, 0.08)', border: 'rgba(165, 180, 252, 0.25)', label: 'Bilgi' },
  };

  return (
    <div className="recommendations" id="recommendations-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ✨ GEMINI AI ÖZEL ASİSTAN KARTI ✨ */}
      {geminiAdvice && (
        <div className="glass-card" style={{ 
          border: '1px solid rgba(165, 180, 252, 0.3)', 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.6s ease'
        }}>
          {/* Arka plan parıltı efekti */}
          <div style={{ 
            position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', 
            background: 'var(--accent-blue)', filter: 'blur(60px)', opacity: '0.15', pointerEvents: 'none' 
          }} />
          
          <div className="rec-header" style={{ marginBottom: '16px' }}>
            <div className="rec-icon" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.7 19.8t-.3-7.8h9.6z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-accent)', marginBottom: '2px' }}>AI FİNANSAL ASİSTAN</h3>
              <p className="rec-subtitle">Gemini 1.5 Flash tarafından kişiselleştirildi</p>
            </div>
          </div>

          <p style={{ 
            margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', 
            lineHeight: '1.6', fontStyle: 'italic', position: 'relative', zIndex: 1 
          }}>
            "{geminiAdvice}"
          </p>
        </div>
      )}

      {/* Ana Analiz Kartı */}
      <div className="glass-card">
        {/* Header */}
        <div className="rec-header">
          <div className="rec-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div>
            <h3>Sistem Analizi & Tavsiyeler</h3>
            <p className="rec-subtitle">
              {totalRiskFactors} risk faktörü · {totalPositiveFactors} olumlu faktör tespit edildi
            </p>
          </div>
        </div>

        {/* Overall Summary */}
        <div className={`rec-overall rec-overall-${riskLevel}`} style={{ marginTop: '20px' }}>
          <div className="overall-icon">
            {riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢'}
          </div>
          <div className="overall-content">
            <p className="overall-text">{overallSummary}</p>
            {overallAdvice && overallAdvice.length > 0 && (
              <ul className="overall-steps">
                {overallAdvice.map((advice, idx) => (
                  <li key={idx}>{advice}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Risk Faktörleri Bölümü */}
      {riskFactors && riskFactors.length > 0 && (
        <div className="rec-section">
          <h4 className="rec-section-title" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Kritik Bulgular
          </h4>

          {riskFactors.map((factor, idx) => {
            const config = severityConfig[factor.severity] || severityConfig.info;
            return (
              <div
                className="risk-factor-card"
                key={idx}
                style={{
                  '--card-border': config.border,
                  '--card-bg': config.bg,
                  animationDelay: `${idx * 0.1}s`,
                  marginBottom: '16px'
                }}
              >
                <div className="factor-top">
                  <div className="factor-title-row">
                    <span className="factor-icon">{factor.icon}</span>
                    <h5 className="factor-title">{factor.feature}</h5>
                    <span
                      className="factor-severity"
                      style={{ color: config.color, borderColor: config.border }}
                    >
                      {config.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="factor-metrics">
                    <div className="metric">
                      <span className="metric-label">Mevcut Değer</span>
                      <span className="metric-value" style={{ color: config.color }}>{factor.currentValue}</span>
                    </div>
                    <div className="metric-divider">&rarr;</div>
                    <div className="metric">
                      <span className="metric-label">İdeal Aralık</span>
                      <span className="metric-value ideal">{factor.idealRange}</span>
                    </div>
                  </div>
                </div>

                <p className="factor-explanation">{factor.explanation}</p>

                {factor.advice && factor.advice.length > 0 && (
                  <div className="factor-advice">
                    <span className="advice-label">📋 Aksiyon Planı:</span>
                    <ul>
                      {factor.advice.map((adv, i) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Olumlu Faktörler Bölümü */}
      {positiveFactors && positiveFactors.length > 0 && (
        <div className="rec-section">
          <h4 className="rec-section-title" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#68d391" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Güçlü Yönler
          </h4>

          <div className="positive-grid">
            {positiveFactors.map((factor, idx) => (
              <div className="positive-card" key={idx} style={{ animationDelay: `${idx * 0.08}s` }}>
                <span className="positive-icon">{factor.icon}</span>
                <div className="positive-content">
                  <div className="positive-title">
                    {factor.feature}
                    <span className="positive-value">{factor.currentValue}</span>
                  </div>
                  <p className="positive-msg">{factor.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;