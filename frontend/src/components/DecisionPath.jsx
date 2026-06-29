import { useState } from 'react';

function DecisionPath({ explanations, summary, decisionPath }) {
  const [isTreeOpen, setIsTreeOpen] = useState(false);

  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(96,165,250,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#93c5fd',
            fontSize: '1.3rem',
          }}
        >
          ⓘ
        </div>

        <div>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Neden Bu Sonuç?</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Modelin kararını etkileyen temel faktörler
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.9rem' }}>
        {explanations.map((exp, idx) => {
          const isIncrease = exp.direction === 'increase';
          const isCritical = exp.impact === 'critical';

          const title =
            exp.label ||
            exp.feature ||
            exp.raw_feature ||
            `Faktör ${idx + 1}`;

          const message =
            exp.message ||
            exp.description ||
            'Bu değişken model kararında etkili olmuştur.';

          const value =
            typeof exp.value === 'number'
              ? exp.value.toFixed(4)
              : exp.value;

          let borderColor = 'rgba(255,255,255,0.1)';
          let iconColor = 'var(--text-secondary)';
          let icon = 'ℹ️';

          if (isCritical) {
            borderColor = 'rgba(252, 129, 129, 0.35)';
            iconColor = 'var(--accent-red)';
            icon = '🚨';
          } else if (isIncrease) {
            borderColor = 'rgba(246, 173, 85, 0.35)';
            iconColor = 'var(--accent-orange)';
            icon = '⚠️';
          } else {
            borderColor = 'rgba(104, 211, 145, 0.35)';
            iconColor = 'var(--accent-green)';
            icon = '✅';
          }

          return (
            <div
              key={idx}
              style={{
                borderLeft: `4px solid ${borderColor}`,
                background: 'rgba(30, 41, 59, 0.65)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#f8fafc',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: iconColor }}>{icon}</span>
                  <span>{title}</span>
                </div>

                <span
                  style={{
                    color: isIncrease ? '#fbbf24' : '#22c55e',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  {isIncrease ? '↑' : '↓'}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  color: '#cbd5e1',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                }}
              >
                {message}
              </p>

              {value !== undefined && (
                <small style={{ color: '#94a3b8' }}>
                  SHAP katkı değeri: {value}
                </small>
              )}
            </div>
          );
        })}
      </div>

      {decisionPath && decisionPath.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div
            onClick={() => setIsTreeOpen(!isTreeOpen)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>
                Yapay Zeka Karar Ağacı (İleri Düzey)
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Matematiksel eşik değerleri ve algoritma yolu
              </p>
            </div>

            <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>
              {isTreeOpen ? '▲' : '▼'}
            </span>
          </div>

          {isTreeOpen && (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              {decisionPath.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.55)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: '10px',
                    padding: '0.9rem',
                  }}
                >
                  <strong style={{ color: '#93c5fd' }}>Adım {idx + 1}</strong>
                  <p style={{ margin: '0.4rem 0 0', color: '#cbd5e1' }}>
                    {step.description}
                  </p>
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