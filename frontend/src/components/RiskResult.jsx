import { useEffect, useRef } from 'react'
import './RiskResult.css'

function RiskResult({ riskProbability, riskLevel, riskLabel, localExplanation }) {
  const gaugeRef = useRef(null)
  const percentRef = useRef(null)

  useEffect(() => {
    // Animate the gauge
    const circumference = 2 * Math.PI * 40 // radius = 40
    const offset = circumference - (riskProbability * circumference)

    if (gaugeRef.current) {
      gaugeRef.current.style.strokeDasharray = `${circumference}`
      gaugeRef.current.style.strokeDashoffset = `${circumference}`
      
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gaugeRef.current.style.transition = 'stroke-dashoffset 1.5s ease-out'
          gaugeRef.current.style.strokeDashoffset = `${offset}`
        })
      })
    }

    // Animate the percentage counter
    if (percentRef.current) {
      const target = Math.round(riskProbability * 100)
      let current = 0
      const duration = 1500
      const step = target / (duration / 16)
      
      const timer = setInterval(() => {
        current += step
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        if (percentRef.current) {
          percentRef.current.textContent = `${Math.round(current)}%`
        }
      }, 16)

      return () => clearInterval(timer)
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

      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Animated progress circle */}
          <circle
            ref={gaugeRef}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{
              filter: `drop-shadow(0 0 8px ${gaugeColor}40)`,
            }}
          />
        </svg>
        <div className="gauge-label">
          <span ref={percentRef} className="gauge-percent" style={{ color: gaugeColor }}>
            0%
          </span>
          <span className="gauge-text">Risk Olasılığı</span>
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
