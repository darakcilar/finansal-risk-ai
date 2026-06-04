import React from 'react';

function XAIAssistant({ advice }) {
  // Eğer tavsiye metni yoksa bileşeni ekranda boş yere gösterme
  if (!advice) return null;

  return (
    <div style={{
      background: 'rgba(16, 185, 129, 0.05)', // Çok hafif saydam yeşil arka plan
      border: '1px solid rgba(16, 185, 129, 0.3)', // Yeşil ince sınır çizgisi
      borderRadius: '12px',
      padding: '20px', // İçeriden nefes alması için geniş boşluk
      marginBottom: '24px', // Alttaki "Risk Puanı" ile arasına boşluk
      display: 'flex',
      flexDirection: 'column',
      gap: '12px' // Başlık ve yazı arasındaki mesafe
    }}>
      
      {/* BAŞLIK VE İKON ALANI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* İkon Kutusu */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>

        {/* Başlık Metni */}
        <h3 style={{
          margin: 0,
          color: '#10b981', // Canlı yeşil renk
          fontSize: '1.1rem',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          XAI YÖNETİCİ ÖZETİ
        </h3>
      </div>

      {/* AÇIKLAMA METNİ ALANI */}
      <div style={{
        color: '#e2e8f0', // Açık gri okunabilir metin rengi
        fontSize: '0.95rem',
        lineHeight: '1.6', // Satır aralığı ferahlatıldı
        marginTop: '4px'
      }}>
        {advice}
      </div>

    </div>
  );
}

export default XAIAssistant;