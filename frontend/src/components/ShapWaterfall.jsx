import React from 'react';

function ShapWaterfall({ shapValues }) {
  // Eğer henüz SHAP verisi gelmediyse bileşeni gizle
  if (!shapValues || shapValues.length === 0) return null;

  // Backend'den veri "value" veya "shap_value" olarak gelebilir, güvenli okuma yapıyoruz
  const getVal = (item) => item.value !== undefined ? item.value : (item.shap_value || 0);

  // Çubukların genişliğini orantılamak için en büyük SHAP değerini buluyoruz
  const maxAbsValue = Math.max(...shapValues.map(s => Math.abs(getVal(s))));

  return (
    <div className="glass-card shap-container">
      {/* BAŞLIK KISMI */}
      <div className="shap-header">
        <div className="shap-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <div>
          <h3>Bireysel Risk Etkenleri (SHAP)</h3>
          <p>Mevcut skorunuzu doğrudan artıran ve azaltan faktörler</p>
        </div>
      </div>

      {/* GRAFİK KISMI */}
      <div className="shap-chart-area">
        {shapValues.map((item, index) => {
          const val = getVal(item);
          const isPositive = val > 0; // Riski artıranlar pozitif (Kırmızı)
          const barWidth = maxAbsValue === 0 ? 0 : (Math.abs(val) / maxAbsValue) * 100; // Yüzdelik genişlik

          return (
            <div key={index} className="shap-row">
              
              {/* Değişken İsmi */}
              <div className="shap-feature-name" title={item.feature}>
                {item.feature}
              </div>

              {/* Çubuk Grafiği Alanı */}
              <div className="shap-bar-container">
                
                {/* Sol Taraf (Riski Azaltanlar - Yeşil) */}
                <div className="shap-bar-half left">
                  {!isPositive && val !== 0 && (
                    <>
                      <span className="shap-value green">
                        {val.toFixed(3)}
                      </span>
                      <div className="shap-bar green" style={{ width: `${barWidth}%` }}></div>
                    </>
                  )}
                </div>

                {/* Merkez Çizgisi */}
                <div className="shap-center-line"></div>

                {/* Sağ Taraf (Riski Artıranlar - Kırmızı) */}
                <div className="shap-bar-half right">
                  {isPositive && val !== 0 && (
                    <>
                      <div className="shap-bar red" style={{ width: `${barWidth}%` }}></div>
                      <span className="shap-value red">
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
      <div className="shap-footer">
         <span className="green-text">← Riski Düşürenler</span>
         <span className="red-text">Riski Artıranlar →</span>
      </div>
    </div>
  );
}

export default ShapWaterfall;