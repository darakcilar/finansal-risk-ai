import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../App.css'
import Header from '../components/Header'
import RiskForm from '../components/RiskForm'
import RiskResult from '../components/RiskResult'
import DecisionPath from '../components/DecisionPath'
import Recommendations from '../components/Recommendations'
import XAIAssistant from '../components/XAIAssistant' 
import WhatIfSimulator from '../components/WhatIfSimulator'
import ShapWaterfall from '../components/ShapWaterfall'
import PeerComparison from '../components/PeerComparison'
import { generateFullRiskReportPDF } from '../utils/pdfGenerator'

const API_BASE = 'https://finansal-risk-ai.onrender.com/api' // Canlı sunucu

// ==========================================================================
// 🚀 ULTRA-PROFESYONEL FINTECH YÜKLEME EKRANI (STEPPER & PROGRESS BAR)
// ==========================================================================
const ProfessionalLoadingScreen = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Güvenli bağlantı tescilleniyor",
    "Geçmiş kredi veritabanı taranıyor",
    "Random Forest modeli çalıştırılıyor",
    "XAI motoru kararları analiz ediyor",
    "Nihai risk raporu derleniyor"
  ];

  useEffect(() => {
    // 2.5 saniye sürecek şekilde adımları 500ms arayla ilerletiyoruz
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 500); 
    return () => clearInterval(timer);
  }, []);

  // İlerleme çubuğunun yüzdesini hesaplama
  const progressPercentage = ((step + 1) / steps.length) * 100;

  return (
    <section className="results-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', background: 'var(--bg-glass)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: responsive-box */}
      <div className="responsive-box" style={{ padding: '40px', width: '100%', maxWidth: '480px' }}>
        
        {/* Üst Başlık Kısmı */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div className="modern-spinner" style={{ margin: '0 auto 15px', width: '40px', height: '40px', borderWidth: '3px' }}></div>
          {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: responsive-title */}
          <h3 className="responsive-title" style={{ color: 'var(--text-primary)', fontSize: '1.4rem', margin: 0, fontWeight: '700' }}>
            Sistem Analizi
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Yapay zeka finansal verilerinizi işliyor
          </p>
        </div>

        {/* Üst İlerleme Çubuğu (Progress Bar) */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '30px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progressPercentage}%`, 
            background: 'linear-gradient(90deg, #38bdf8, #10b981)', 
            transition: 'width 0.5s ease-in-out' 
          }}></div>
        </div>
        
        {/* Timeline (Stepper) Kontrol Listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '10px' }}>
          
          {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: stepper-line */}
          <div className="stepper-line" style={{ position: 'absolute', left: '25px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>

          {steps.map((text, index) => {
            const isActive = index === step;
            const isCompleted = index < step;
            const isPending = index > step;
            
            return (
              // 🚀 MOBİL UYUM SINIFI EKLENDİ: stepper-item
              <div key={index} className="stepper-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                padding: '12px 0',
                position: 'relative',
                zIndex: 1,
                opacity: isPending ? 0.4 : 1,
                transform: isActive ? 'translateX(5px)' : 'translateX(0)',
                transition: 'all 0.4s ease'
              }}>
                
                {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: stepper-icon */}
                <div className="stepper-icon" style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: isCompleted ? '#10b981' : (isActive ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'),
                  border: isActive ? '2px solid #38bdf8' : (isCompleted ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)'),
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {isCompleted && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {isActive && (
                    <div style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 8px #38bdf8' }}></div>
                  )}
                </div>
                
                {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: stepper-text */}
                <span className="stepper-text" style={{ 
                  color: isActive ? '#ffffff' : (isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)'), 
                  fontSize: '0.95rem',
                  fontWeight: isActive ? '600' : '400',
                  letterSpacing: '0.3px'
                }}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

function App() {
  const { addHistoryItem, user } = useContext(AuthContext);
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [currentFeatures, setCurrentFeatures] = useState(null)

  useEffect(() => {
    // Kullanıcı siteye girdiği an, arka planda API'ye görünmez bir ping atarak uykudan uyandırır.
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => console.log("🤖 Sunucu başarıyla uyandırıldı:", data))
      .catch(() => console.log("⏳ Sunucu uyanıyor..."));
  }, []);

  const handlePredict = async (features, isQuickFill = false) => {
    setLoading(true) 
    setError(null)
    setShowResults(false)
    setCurrentFeatures(features)
    
    // Yükleme animasyonunu ve sonuçları görmek için sayfayı aşağı sonuçlar alanına kaydır
    setTimeout(() => {
      const resultsEl = document.getElementById('results-section');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      const payload = { 
        features: { ...features, __skip_log: isQuickFill },
        user_id: user ? user.id : null 
      };

      // API isteği ile 3 saniyelik zorunlu bekleme (Animasyon) süresini aynı anda başlatıyoruz
      const [response] = await Promise.all([
        fetch(`${API_BASE}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Animasyonun izlenmesi için en az 3 sn bekle
      ]);

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Sunucu hatası oluştu')
      }

      const data = await response.json()
      setResult(data)
      addHistoryItem({ ...data, features: features })
      
      setShowResults(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!result || !currentFeatures) {
      alert("Lütfen önce bir analiz gerçekleştirin.");
      return;
    }
    generateFullRiskReportPDF(result, currentFeatures, new Date());
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
      <div className="app dark">
        <div className="bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <header className="header" style={{ position: 'relative' }}>
          <Link to="/dashboard" className="back-btn-glass" style={{ position: 'absolute', left: '20px', top: '20px' }}>
            <span style={{ fontSize: '18px' }}>←</span>
            Geri
          </Link>
          <Header />
        </header>

        <main 
          className="main-content" 
          style={{ 
            width: '100%', display: 'flex', justifyContent: 'center', 
            alignItems: 'flex-start', minHeight: 'auto'
          }}
        >
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

                <RiskForm onSubmit={handlePredict} loading={false} />
                
                {error && (
                  <div className="error-banner" role="alert">
                    <span>{error}</span>
                  </div>
                )}
              </section>

              {loading ? (
                <ProfessionalLoadingScreen />
              ) : result && showResults ? (
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
              ) : (
                <section className="results-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed rgba(148, 163, 184, 0.2)', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.2)' }}>
                  {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: responsive-box */}
                  <div className="responsive-box" style={{ textAlign: 'center', padding: '40px' }}>
                    {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: robot-icon */}
                    <div className="robot-icon" style={{ fontSize: '4rem', marginBottom: '15px', animation: 'float 6s ease-in-out infinite' }}>
                      🤖
                    </div>
                    {/* 🚀 MOBİL UYUM SINIFI EKLENDİ: responsive-title */}
                    <h3 className="responsive-title" style={{ color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '10px' }}>Yapay Zeka Analize Hazır</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '350px', margin: '0 auto', lineHeight: '1.6' }}>
                      Müşterinin finansal verilerini sol taraftaki forma girerek <b>"Risk Analizi Yap"</b> butonuna tıklayın.
                    </p>
                    
                    {/* 🚀 MOBİL UYUM SINIFLARI EKLENDİ: badge-container, badge-item */}
                    <div className="badge-container" style={{ display: 'flex', gap: '10px', marginTop: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span className="badge-item" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>🌳 Random Forest</span>
                      <span className="badge-item" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>🧠 SHAP XAI</span>
                      <span className="badge-item" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>📄 PDF Raporu</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
        </main>

        <footer className="app-footer" style={{ 
          position: 'relative', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0 }}>Finansal Risk AI — Explainable Artificial Intelligence (XAI)</p>
            <p className="footer-sub" style={{ margin: '4px 0 0 0' }}>Mimarisi: Node.js + Python (Random Forest) + Rule-based NLG</p>
          </div>
        </footer>

      </div>
    </>
  );
}

export default App;


//admin