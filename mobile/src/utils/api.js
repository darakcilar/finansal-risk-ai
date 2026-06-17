/**
 * Finansal Risk AI — API Yardımcı Modülü
 * Render.com'daki backend'e istek atan fonksiyonlar
 */

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

/**
 * Sunucu sağlık kontrolü (uykudan uyandırma)
 */
export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    console.log('🤖 Sunucu başarıyla uyandırıldı:', data);
    return data;
  } catch (err) {
    console.log('⏳ Sunucu uyanıyor...');
    return null;
  }
}

/**
 * Risk tahmini yap
 * @param {Object} features - ML modeline gönderilecek özellikler
 * @param {boolean} isQuickFill - Hızlı doldur mu?
 */
export async function predict(features, isQuickFill = false, user_id = null) {
  const featuresWithFlag = { ...features, __skip_log: isQuickFill };
  
  const payload = { 
    features: featuresWithFlag,
    user_id: user_id
  };

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Sunucu hatası oluştu');
  }

  return response.json();
}

/**
 * What-If simülasyonu çalıştır
 * @param {Object} features - Simüle edilen özellikler
 */
export async function simulatePredict(features) {
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });

  return response.json();
}

export { API_BASE };
