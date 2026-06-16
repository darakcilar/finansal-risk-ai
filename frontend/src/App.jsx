import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import RiskForm from './components/RiskForm'
import RiskResult from './components/RiskResult'
import DecisionPath from './components/DecisionPath'
import Recommendations from './components/Recommendations'
import XAIAssistant from './components/XAIAssistant' 
import WhatIfSimulator from './components/WhatIfSimulator'
import ShapWaterfall from './components/ShapWaterfall'
import AdminDashboard from './components/AdminDashboard' 
import html2pdf from 'html2pdf.js'
import PeerComparison from './components/PeerComparison'

const API_BASE = 'https://finansal-risk-ai.onrender.com/api'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [currentFeatures, setCurrentFeatures] = useState(null)
  const [isAdminView, setIsAdminView] = useState(false)
  
  // 🚀 TEMA STATE'İ (Varsayılan olarak karanlık başlar)
  const [theme, setTheme] = useState('dark')

  // HTML body rengini temaya göre kesin olarak ayarlayan kilit mekanizma
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'light' ? '#f8fafc' : '#0f172a';
    document.body.style.color = theme === 'light' ? '#0f172a' : '#f8fafc';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  const handlePredict = async (features, isQuickFill = false) => {
    setLoading(true)
    setError(null)
    setShowResults(false)
    setCurrentFeatures(features)

    try {
      const featuresWithFlag = { ...features, __skip_log: isQuickFill };

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featuresWithFlag }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Sunucu hatası oluştu')
      }

      const data = await response.json()
      setResult(data)
      setTimeout(() => setShowResults(true), 150)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- KUSURSUZ SAYFA YAPILI VE KUTUCUKLU PDF TASARIMI ---
  const handleDownloadPDF = () => {
    if (!result || !currentFeatures) {
      alert("Lütfen önce bir analiz gerçekleştirin.");
      return;
    }

    let recHtmlBlocks = '';
    
    if (result.recommendations) {
      const recs = result.recommendations;
      
      if (recs.overallAdvice && recs.overallAdvice.length > 0) {
        recHtmlBlocks += `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <h3 style="color: #0f172a; font-size: 14px; margin-bottom: 8px;">📌 Genel Değerlendirme ve Eylem Planı</h3>
            <p style="font-size: 12px; color: #334155; margin-bottom: 8px; font-weight: bold;">${recs.overallSummary || ''}</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
              ${recs.overallAdvice.map(a => `<li style="margin-bottom: 4px;">${a}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      if (recs.riskFactors && recs.riskFactors.length > 0) {
        recHtmlBlocks += `<h3 style="color: #e11d48; font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px dashed #fecdd3; padding-bottom: 5px; page-break-after: avoid;">⚠️ Öncelikli İyileştirme Alanları</h3>`;
        
        recs.riskFactors.forEach(rf => {
          const sev = String(rf.severity || '').toLowerCase().trim();
          let bgHex = '#fdf2f8'; 
          let borderHex = '#f43f5e';
          
          if (sev === 'warning') {
            bgHex = '#fffbeb'; 
            borderHex = '#f59e0b';
          } else if (sev === 'info') {
            bgHex = '#eef2ff'; 
            borderHex = '#3b82f6';
          }

          recHtmlBlocks += `
            <div style="margin-bottom: 15px; background: ${bgHex}; padding: 12px; border-left: 4px solid ${borderHex}; border-radius: 4px; page-break-inside: avoid;">
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 5px;">
                ${rf.icon} ${rf.feature} <span style="color: #64748b; font-weight: normal; font-size: 11px;">(Mevcut Değer: ${rf.currentValue})</span>
              </strong>
              <p style="font-size: 11px; color: #334155; margin: 0 0 8px 0; line-height: 1.5;">${rf.explanation}</p>
              <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #475569; line-height: 1.5;">
                ${(rf.advice || []).map(a => `<li style="margin-bottom: 3px;">${a}</li>`).join('')}
              </ul>
            </div>
          `;
        });
      }
    }

    if (!recHtmlBlocks) {
      recHtmlBlocks = `<p style="font-size: 12px;">Finansal verilerinizi düzenli takip etmeye devam edin.</p>`;
    }

    const riskIncreasers = result.shap_values?.filter(s => s.value > 0).slice(0, 3) || [];
    const riskDecreasers = result.shap_values?.filter(s => s.value < 0).slice(0, 3) || [];

    let shapHtml = '';
    if (riskIncreasers.length > 0 || riskDecreasers.length > 0) {
      shapHtml = `
        <div style="page-break-inside: avoid;">
          <h2 style="color: #0f172a; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">3. Bireysel Risk Etkenleri (SHAP Analizi)</h2>
          <div style="display: flex; gap: 15px; margin-top: 15px;">
              <div style="flex: 1; background: #fff1f2; border: 1px solid #ffe4e6; padding: 15px; border-radius: 8px;">
                  <strong style="color: #e11d48; font-size: 13px; display: block; border-bottom: 1px solid #fda4af; padding-bottom: 5px; margin-bottom: 8px;">📈 Riski Artıran Ana Faktörler</strong>
                  <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #4c0519; line-height: 1.6;">
                      ${riskIncreasers.map(s => `<li>${s.feature}</li>`).join('')}
                  </ul>
              </div>
              <div style="flex: 1; background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px;">
                  <strong style="color: #059669; font-size: 13px; display: block; border-bottom: 1px solid #6ee7b7; padding-bottom: 5px; margin-bottom: 8px;">📉 Riski Düşüren Ana Faktörler</strong>
                  <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #064e3b; line-height: 1.6;">
                      ${riskDecreasers.map(s => `<li>${s.feature}</li>`).join('')}
                  </ul>
              </div>
          </div>
        </div>
      `;
    }

    const totalDelays = (parseFloat(currentFeatures['NumberOfTime30-59DaysPastDueNotWorse']) || 0) + 
                        (parseFloat(currentFeatures['NumberOfTime60-89DaysPastDueNotWorse']) || 0) + 
                        (parseFloat(currentFeatures['NumberOfTimes90DaysLate']) || 0);

    const reportHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px 30px; color: #1e293b; background-color: white; box-sizing: border-box;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px;">
          <div>
            <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Finansal Risk Analiz Raporu</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">Explainable AI (XAI) Sistem Çıktısı</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 14px;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 11px;">Rapor ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between;">
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Yaş</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.age || '-'}</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Aylık Net Gelir</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.MonthlyIncome ? Number(currentFeatures.MonthlyIncome).toLocaleString('tr-TR') + ' ₺' : '-'}</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Toplam Gecikme</span><strong style="font-size:16px; color:#0f172a;">${totalDelays} Kez</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Açık Kredi/Kart</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.NumberOfOpenCreditLinesAndLoans || '0'} Adet</strong></div>
        </div>

        <h2 style="color: #0284c7; font-size: 16px; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">1. XAI Yönetici Özeti</h2>
        <p style="background-color: #f0f9ff; padding: 16px; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0; line-height: 1.6; font-size: 13px; margin-bottom: 0; page-break-inside: avoid;">
          ${result.xai_advice || "XAI motoru yanıt vermedi."}
        </p>

        <div style="page-break-inside: avoid;">
          <h2 style="color: #0f172a; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">2. İstatistiksel Model Çıktısı</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; background-color: #f1f5f9; width: 50%; color: #475569; font-weight: 500;">Risk Seviyesi Kategorisi</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; text-transform: uppercase; font-weight: bold; color: ${result.risk_level === 'low' ? '#059669' : result.risk_level === 'medium' ? '#d97706' : '#dc2626'}; text-align: right;">
                ${result.risk_label || result.risk_level}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; background-color: #f1f5f9; color: #475569; font-weight: 500;">Matematiksel Risk Olasılığı</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; font-size: 18px; color: #0f172a;">
                %${((result.risk_probability || 0) * 100).toFixed(1)}
              </td>
            </tr>
          </table>
        </div>

        ${shapHtml}

        <div class="html2pdf__page-break"></div>

        <h2 style="color: #0f172a; font-size: 16px; margin-top: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${shapHtml ? '4' : '3'}. Yapay Zeka Tavsiyeli Eylem Planı</h2>
        <div style="margin-top: 15px;">
          ${recHtmlBlocks}
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; page-break-inside: avoid;">
          <p style="margin: 0; font-weight: bold; color: #64748b;">Bu rapor, Explainable AI (XAI) destekli Random Forest algoritması tarafından otomatik olarak üretilmiştir.</p>
          <p style="margin: 4px 0 0 0;">Yasal Uyarı: Bu belge resmi bir finansal danışmanlık niteliği taşımaz, sadece girilen verilere dayalı istatistiksel bir risk projeksiyonu sunar.</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0.3, 
      filename: `Finansal_Risk_Raporu_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }, 
      pagebreak: { mode: ['css', 'legacy', 'avoid-all'] } 
    };
    
    html2pdf().set(opt).from(reportHtml).save();
  };

  const handleReset = () => {
    setResult(null)
    setShowResults(false)
    setError(null)
    setCurrentFeatures(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* 🚀 app class'ının yanına dinamik olarak 'light' veya 'dark' sınıfı ekleniyor */}
      <div className={`app ${theme}`}>
        
        {/* Güneş/Ay Tema Değiştirme Butonu */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? "Aydınlık Temaya Geç" : "Karanlık Temaya Geç"}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <Header />

        <main 
          className="main-content" 
          style={{ 
            width: '100%', display: 'flex', justifyContent: 'center', 
            alignItems: isAdminView ? 'center' : 'flex-start', minHeight: isAdminView ? '70vh' : 'auto'
          }}
        >
          {isAdminView ? (
            <div style={{ width: '100%', maxWidth: '1400px', display: 'flex', justifyContent: 'center', margin: '0 auto' }}>
              <AdminDashboard onBack={() => setIsAdminView(false)} apiBase={API_BASE} />
            </div>
          ) : (
            <div className="container" style={{ maxWidth: '1100px', width: '95%', transition: 'all 0.4s ease-in-out', margin: '0 auto' }}>
              
              <section className="form-section" id="risk-form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Müşteri Bilgileri</h2>
                    <p className="section-subtitle">Mali verileri girerek yapay zeka analizini başlatın</p>
                  </div>
                </div>

                <RiskForm onSubmit={handlePredict} loading={loading} />
                
                {error && (
                  <div className="error-banner" role="alert">
                    <span>{error}</span>
                  </div>
                )}
              </section>

              {result && showResults && (
                <section className="results-section" id="results-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Analiz Raporu</h3>
                    <button onClick={handleDownloadPDF} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      PDF İndir
                    </button>
                  </div>

                  <RiskResult riskProbability={result.risk_probability} riskLevel={result.risk_level} riskLabel={result.risk_label} localExplanation={result.local_explanation} />
                  <XAIAssistant advice={result.xai_advice} />
                  <PeerComparison features={currentFeatures} riskProbability={result.risk_probability} />
                  <ShapWaterfall shapValues={result.shap_values || []} />
                  <DecisionPath explanations={result.local_explanation?.explanations || []} summary={result.local_explanation?.summary || ''} decisionPath={result.decision_path || []} />
                  <WhatIfSimulator originalFeatures={currentFeatures} originalProb={result.risk_probability} apiBase={API_BASE} />
                  <Recommendations recommendations={result.recommendations} />

                  <button className="btn-reset" onClick={handleReset} style={{ marginTop: '10px' }}>Yeni Analiz Yap</button>
                </section>
              )}
            </div>
          )}
        </main>

        <footer className="app-footer" style={{ 
          position: 'relative', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          marginTop: 'auto',
          borderTop: '1px solid var(--border-glass)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0 }}>Finansal Risk AI — Explainable Artificial Intelligence (XAI)</p>
            <p className="footer-sub" style={{ margin: '4px 0 0 0' }}>Mimarisi: Node.js + Python (Random Forest) + Rule-based NLG</p>
          </div>

          <button 
            onClick={() => setIsAdminView(!isAdminView)}
            style={{ 
              position: 'absolute', 
              right: '24px', 
              top: '50%',
              transform: 'translateY(-50%)',
              background: isAdminView ? 'var(--bg-glass-strong)' : 'var(--bg-glass)', 
              border: '1px solid #38bdf8', 
              color: theme === 'light' ? '#0284c7' : '#38bdf8', 
              cursor: 'pointer', 
              borderRadius: '6px', 
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10
            }}
          >
            <span style={{ fontSize: '12px' }}>{isAdminView ? '❌' : '🔐'}</span> 
            {isAdminView ? 'KAPAT' : 'SİSTEM YÖNETİCİSİ'}
          </button>
        </footer>

      </div>
    </>
  );
}

export default App;