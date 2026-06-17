import { useEffect, useRef } from 'react'
import './RiskResult.css'

function RiskResult({ riskProbability, riskLevel, riskLabel, localExplanation }) {
  const gaugeRef = useRef(null)
  const percentRef = useRef(null)

  useEffect(() => {
    // 1. İbre (Gauge) Animasyonu
    const circumference = 2 * Math.PI * 40
    const offset = circumference - (riskProbability * circumference)

    if (gaugeRef.current) {
      gaugeRef.current.style.strokeDasharray = `${circumference}`
      gaugeRef.current.style.strokeDashoffset = `${circumference}`
      
      // Tarayıcının diğer ağır grafikleri (SHAP vs.) çizmesi için ona 100ms nefes aldırıyoruz
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (gaugeRef.current) {
            gaugeRef.current.style.transition = 'stroke-dashoffset 2.0s cubic-bezier(0.25, 1, 0.5, 1)'
            gaugeRef.current.style.strokeDashoffset = `${offset}`
          }
        })
      }, 100)
    }

    // 2. Yüzdelik Rakamın YÜKSEK PERFORMANSLI Sayma Animasyonu
    if (percentRef.current) {
      const target = riskProbability * 100
      const duration = 2000 // 2 saniye
      let startTime = null

      // Animasyonun hızla başlayıp sonlara doğru yavaşlayarak durmasını sağlayan matematiksel formül (Ease-out)
      const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4)

      const animateNumber = (currentTime) => {
        if (!startTime) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        const easedProgress = easeOutQuart(progress)
        const currentVal = target * easedProgress

        if (percentRef.current) {
          percentRef.current.textContent = `${currentVal.toFixed(1)}%`
        }

        if (progress < 1) {
          requestAnimationFrame(animateNumber) // Ekran yenileme hızına (60fps/120fps) senkronize ol
        }
      }

      // Sayacın da diğer çizimler bittikten sonra pürüzsüzce başlaması için 100ms bekletiyoruz
      setTimeout(() => {
        requestAnimationFrame(animateNumber)
      }, 100)
    }
  }, [riskProbability])

  const gaugeColor = 
    riskLevel === 'high' ? '#fc8181' :
    riskLevel === 'medium' ? '#fbd38d' :
    '#68d391'

  const bgGradient = 
    riskLevel === 'high' ? 'var(--gradient-risk-high)' :
    riskLevel === 'medium' ? 'var(--gradient-risk-medium)' :
    'var(--gradient-risk-low)'

  return (
    <div className={`risk-result glass-card risk-result-${riskLevel}`} id="risk-result">
      <div className="result-header">
        <h3>Risk Puanı</h3>
        <span 
          className={`risk-badge risk-badge-${riskLevel}`}
          style={{ background: bgGradient }}
        >
          {riskLabel}
        </span>
      </div>

      <div className="gauge-container" key={riskProbability}>
        <svg className="gauge-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            ref={gaugeRef}
            cx="50" cy="50" r="40" fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}40)` }}
          />
        </svg>
        <div className="gauge-label">
          <span ref={percentRef} className="gauge-percent" style={{ color: gaugeColor, fontSize: '2.2rem', fontWeight: 'bold' }}>
            0%
          </span>
          <span className="gauge-text" style={{ fontSize: '0.9rem', opacity: 0.8 }}>Risk Olasılığı</span>
        </div>
      </div>

      {localExplanation?.summary && (
        <div className="result-summary" style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '1rem',
            color: 'var(--text-primary)'
        }}>
          <p style={{ margin: 0 }}>{localExplanation.summary}</p>
        </div>
      )}
    </div>
  )
}

export default RiskResult