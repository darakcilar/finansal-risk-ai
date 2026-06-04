# Finansal Risk AI (XAI Destekli)

Finansal Risk AI, kullanıcıların finansal verilerini analiz ederek kredi risklerini değerlendiren ve bu kararları **Explainable AI (XAI - Açıklanabilir Yapay Zeka)** teknikleri ile gerekçelendiren uçtan uca bir analiz platformudur.

## 🚀 Proje Hakkında
Bu proje, makine öğrenimi modellerinin "kara kutu" (black box) yapısını şeffaf hale getirmeyi amaçlar. Kullanıcılar finansal bilgilerini girer, sistem Random Forest modeli ile risk skorunu hesaplar ve **SHAP (SHapley Additive exPlanations)** değerlerini kullanarak sonucun neden "yüksek" veya "düşük" riskli olduğunu detaylandırır.

## 🛠️ Teknoloji Yığını (Tech Stack)

### Frontend
- **React Native (Expo):** Web ve mobil platformlarda çalışan evrensel bir arayüz.
- **Expo Web:** Tarayıcı üzerinden hızlı analiz.
- **React Native SVG:** SHAP değerleri görselleştirmeleri için.

### Backend
- **Python (Flask):** API sunucusu.
- **Scikit-Learn:** Random Forest modeli (Kaggle "Give Me Some Credit" veri seti ile eğitilmiştir).
- **SHAP:** Modelin kararlarını açıklamak için kullanılan kütüphane.
- **SQLite:** Analiz geçmişini ve denetim kayıtlarını tutmak için.

## ✨ Özellikler
*   **Risk Analizi:** Finansal göstergelerle anlık risk tahmini.
*   **XAI (Açıklanabilir YZ):** Risk skorunun matematiksel nedenlerini gösteren SHAP Waterfall grafikleri.
*   **Karar Ağacı İzleme:** Modelin hangi eşik değerlerine göre karar verdiğini adım adım gösterir.
*   **PDF Raporlama:** Analiz sonuçlarını profesyonel bir rapor olarak dışa aktarma.
*   **Admin Paneli:** Geçmiş analizlerin denetimi ve sistem istatistikleri.
*   **Hızlı Doldur:** Test amaçlı hızlı veri girişi (Düşük/Yüksek risk).

## ⚙️ Kurulum

### Gereksinimler
- Node.js (v18+)
- Python 3.8+
- Git

### 1. Backend Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate
pip install -r requirements.txt
python app.py
