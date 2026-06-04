import { useState } from 'react';

function DecisionPath({ explanations, summary, decisionPath }) {
  // Ağaç algoritması başlangıçta gizli
  const [isTreeOpen, setIsTreeOpen] = useState(false);

  if (!explanations || explanations.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. KISIM: İnsani Açıklamalar (Hep Açık Kalacak) */}
      <div className="glass-card">
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <div className="section-icon" style={{ background: 'var(--gradient-purple)', width: '40px', height: '40px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Neden Bu Sonuç?</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modelin kararını etkileyen temel faktörler</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {explanations.map((exp, idx) => {
            const isCritical = exp.impact === 'critical';
            const isIncrease = exp.direction === 'increase';
            
            let borderColor = 'rgba(255,255,255,0.1)';
            let iconColor = 'var(--text-secondary)';
            
            if (isCritical) {
              borderColor = 'rgba(252, 129, 129, 0.3)';
              iconColor = 'var(--accent-red)';
            } else if (isIncrease) {
              borderColor = 'rgba(246, 173, 85, 0.3)';
              iconColor = 'var(--accent-orange)';
            } else {
              borderColor = 'rgba(104, 211, 145, 0.3)';
              iconColor = 'var(--accent-green)';
            }

            return (
              <div key={idx} style={{ padding: '16px', background: 'var(--bg-glass)', borderLeft: `4px solid ${borderColor}`, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: iconColor }}>
                    {isCritical ? '🚨' : isIncrease ? '⚠️' : '✅'}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {exp.label} {isIncrease ? '↑' : '↓'}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {exp.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. KISIM: Teknik Karar Ağacı (Açılır/Kapanır) */}
      {decisionPath && decisionPath.length > 0 && (
        <div className="glass-card" style={{ padding: isTreeOpen ? '24px' : '16px 24px', transition: 'all 0.3s ease' }}>
          
          {/* Tıklanabilir Ağaç Başlığı */}
          <div 
            onClick={() => setIsTreeOpen(!isTreeOpen)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="section-icon" style={{ background: 'transparent', border: '1px solid var(--border-glass)', width: '40px', height: '40px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Yapay Zeka Karar Ağacı (İleri Düzey)</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matematiksel eşik değerleri ve algoritma yolu</p>
              </div>
            </div>
            
            {/* Dönen Ok İkonu */}
            <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isTreeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--text-secondary)' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {/* Açılır Ağaç İçeriği */}
          {isTreeOpen && (
            <div style={{ marginTop: '24px', paddingLeft: '10px', borderLeft: '2px dashed var(--border-glass)', animation: 'fadeIn 0.4s ease' }}>
              {decisionPath.map((step, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: '20px', paddingBottom: idx === decisionPath.length - 1 ? '0' : '20px' }}>
                  {/* Ağaç Düğümü (Nokta) */}
                  <div style={{ 
                    position: 'absolute', left: '-7px', top: '4px', width: '12px', height: '12px', 
                    background: step.type === 'leaf' ? 'var(--accent-blue)' : 'var(--bg-primary)', 
                    border: `2px solid ${step.type === 'leaf' ? 'var(--accent-blue)' : 'var(--text-muted)'}`, 
                    borderRadius: '50%' 
                  }}/>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Adım {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: step.type === 'leaf' ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: step.type === 'leaf' ? '600' : 'normal' }}>
                    {step.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default DecisionPath;