import { useState } from 'react';

function FeatureImportance({ importances }) {
  // Başlangıçta kapalı (false) olarak ayarlıyoruz
  const [isOpen, setIsOpen] = useState(false);

  if (!importances || importances.length === 0) return null;

  // Çubukların genişliğini en yüksek değere göre oranlamak için
  const maxImp = Math.max(...importances.map(i => i.importance));

  // Siberpunk/Dark temana uygun renk paleti
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4fd1c5', '#68d391', '#fbd38d', '#f6ad55', '#fc8181'];

  return (
    <div className="glass-card" style={{ padding: isOpen ? '24px' : '16px 24px', transition: 'all 0.3s ease' }}>
      
      {/* Tıklanabilir Başlık Alanı */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="section-icon" style={{ width: '40px', height: '40px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-4"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Özellik Önem Sıralaması</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modelin karar verirken baz aldığı ağırlıklar</p>
          </div>
        </div>
        
        {/* Dönen Ok İkonu */}
        <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--text-secondary)' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Açılır İçerik */}
      {isOpen && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.4s ease' }}>
          {importances.map((item, index) => {
            const percentage = (item.importance / maxImp) * 100;
            const displayValue = (item.importance * 100).toFixed(1);
            const color = colors[index % colors.length];

            return (
              <div key={item.feature} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{index + 1}</span>
                <span style={{ width: '160px', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                
                {/* Animasyonlu Bar */}
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-glass-strong)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '4px',
                      transition: 'width 1s ease-out'
                    }}
                  />
                </div>
                
                <span style={{ width: '45px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold', color }}>
                  %{displayValue}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeatureImportance;