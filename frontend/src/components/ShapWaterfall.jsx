import React from 'react';

function ShapWaterfall({ shapValues }) {
  // Eğer henüz SHAP verisi gelmediyse bileşeni gizle
  if (!shapValues || shapValues.length === 0) return null;

  // Backend'den veri "value" veya "shap_value" olarak gelebilir, güvenli okuma yapıyoruz
  const getVal = (item) => item.value !== undefined ? item.value : (item.shap_value || 0);

  // Çubukların genişliğini orantılamak için en büyük SHAP değerini buluyoruz
  const maxAbsValue = Math.max(...shapValues.map(s => Math.abs(getVal(s))));

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.4)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* BAŞLIK KISMI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#8b5cf6', color: 'white', padding: '8px', borderRadius: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Bireysel Risk Etkenleri (SHAP)</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mevcut skorunuzu doğrudan artıran ve azaltan faktörler</p>
        </div>
      </div>

      {/* GRAFİK KISMI */}
      <div style={{ marginTop: '20px' }}>
        {shapValues.map((item, index) => {
          const val = getVal(item);
          const isPositive = val > 0; // Riski artıranlar pozitif (Kırmızı)
          const barWidth = maxAbsValue === 0 ? 0 : (Math.abs(val) / maxAbsValue) * 100; // Yüzdelik genişlik
          const barColor = isPositive ? '#ef4444' : '#10b981'; // Kırmızı : Yeşil

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '14px', fontSize: '0.9rem' }}>
              
              {/* Değişken İsmi (Uzun yazılar sığsın diye width %40 yapıldı) */}
              <div style={{ 
                width: '40%', 
                textAlign: 'right', 
                paddingRight: '15px', 
                color: '#cbd5e1', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {item.feature}
              </div>

              {/* Çubuk Grafiği Alanı */}
              <div style={{ width: '60%', display: 'flex', alignItems: 'center' }}>
                
                {/* Sol Taraf (Riski Azaltanlar - Yeşil) */}
                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                  {!isPositive && val !== 0 && (
                    <>
                      {/* position absolute kaldırıldı, sayı direkt çubuğun yanına eklendi */}
                      <span style={{ fontSize: '0.75rem', color: barColor, whiteSpace: 'nowrap' }}>
                        {val.toFixed(3)}
                      </span>
                      <div style={{ height: '16px', width: `${barWidth}%`, backgroundColor: barColor, borderRadius: '4px 0 0 4px' }}></div>
                    </>
                  )}
                </div>

                {/* Merkez Çizgisi (flexShrink eklendi ezilmemesi için) */}
                <div style={{ width: '2px', height: '24px', backgroundColor: '#475569', margin: '0 8px', flexShrink: 0 }}></div>

                {/* Sağ Taraf (Riski Artıranlar - Kırmızı) */}
                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '6px' }}>
                  {isPositive && val !== 0 && (
                    <>
                      {/* Çubuk ve sayının yeri değiştirildi, böylece sayı daima çubuğun bitişinde yer alır */}
                      <div style={{ height: '16px', width: `${barWidth}%`, backgroundColor: barColor, borderRadius: '0 4px 4px 0' }}></div>
                      <span style={{ fontSize: '0.75rem', color: barColor, whiteSpace: 'nowrap' }}>
                        +{val.toFixed(3)}
                      </span>
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
      
      {/* ALT BİLGİ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.8rem' }}>
         <span style={{ color: '#10b981' }}>← Riski Düşürenler</span>
         <span style={{ color: '#ef4444' }}>Riski Artıranlar →</span>
      </div>
    </div>
  );
}

export default ShapWaterfall;