# 🚀 Finansal Risk AI — Explainable Artificial Intelligence (XAI)

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)
![Flask](https://img.shields.io/badge/Flask-Backend-000000.svg)
![Machine Learning](https://img.shields.io/badge/ML-Random_Forest-green.svg)
![Status](https://img.shields.io/badge/Status-Live-brightgreen.svg)

🌐 **Canlı Demo:** [Finansal Risk AI Web Sitesi](https://finansal-risk-ai-furkand.onrender.com/)

Finansal Risk AI, kullanıcıların finansal verilerini analiz ederek kredi risklerini değerlendiren ve bu tahminleri **Explainable AI (XAI - Açıklanabilir Yapay Zeka)** teknikleri ile şeffaf bir şekilde gerekçelendiren "Full-Stack" bir analiz platformudur.

Makine öğrenimi modellerinin geleneksel "kara kutu" (black box) yapısını yıkarak, kullanıcılara risk skorlarının arkasındaki *matematiksel nedenleri* şeffaf, anlaşılır ve dinamik bir dille sunar.

## ✨ Öne Çıkan Özellikler

* 📊 **Anlık Risk Analizi:** Finansal göstergeleri işleyerek "Düşük", "Orta" veya "Yüksek" risk tahmini üretir.
* 🧠 **SHAP (Açıklanabilir YZ) Analizi:** Modelin kararlarını etkileyen faktörleri detaylı **SHAP Waterfall** grafikleri ile görselleştirir.
* 🔮 **What-If (Ne Olurdu?) Simülatörü:** Kullanıcıların verilerini (örneğin; "Borcum %10 daha az olsaydı riskim ne olurdu?") anlık olarak değiştirip yeni skoru milisaniyeler içinde görebilmesini sağlar.
* 🌳 **Karar Ağacı İzleme:** Algoritmanın hangi eşik değerlerine (threshold) göre karar verdiğini adım adım gösterir.
* 👥 **Akran Karşılaştırması:** Kullanıcının mevcut finansal durumunu, genel veri setindeki ideal ortalamalarla kıyaslar.
* 📄 **Profesyonel PDF Raporlama:** Analiz sonuçlarını, dinamik arka plan renkleri ve detaylı XAI tavsiyeleriyle birlikte tek tıkla PDF olarak dışa aktarır.
* 🔐 **Sistem Yöneticisi Paneli:** Geçmiş analizlerin denetim kayıtlarını (log) ve sistem eğitim istatistiklerini izleme imkanı sunar.
* 📱 **%100 Mobil Uyum (Responsive):** İster masaüstü ister mobil cihazlarda kusursuz bir kullanıcı deneyimi sunar.

## 🛠️ Teknoloji Yığını (Tech Stack)

Uygulama, modern ve ölçeklenebilir bir mikroservis (Microservice) mimarisi üzerine kurulmuştur:

**Frontend (Vitrin):**
- **React.js (Vite):** Hızlı ve modern kullanıcı arayüzü.
- **Recharts & HTML2PDF:** Grafiksel görselleştirmeler ve raporlama motoru.
- **Saf CSS3:** Cihaz bağımsız, esnek (responsive) tasarım.

**Backend (Beyin):**
- **Python & Flask:** RESTful API sunucusu ve veri yönlendirme.
- **Scikit-Learn:** 150.000 veri ile eğitilmiş Random Forest Sınıflandırma Modeli.
- **SHAP (SHapley Additive exPlanations):** Model açıklanabilirliği kütüphanesi.
- **SQLite:** Güvenli ve hafif log/denetim veritabanı.

## ⚙️ Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin. (Gereksinimler: Node.js v18+ ve Python 3.8+)

### 1. Backend Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
(Not: models/advanced_risk_model.joblib dosyasının ilgili dizinde bulunduğundan emin olun. API varsayılan olarak http://127.0.0.1:5002 adresinde çalışacaktır.)

### 2. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```
(Uygulama tarayıcınızda otomatik olarak açılacaktır.)

## 🏗️ Proje Yapısı
```text
Finansal_Risk_AI/
├── backend/          # Flask API, ML Modeli, XAI Mantığı ve Veritabanı
├── frontend/         # React.js Uygulaması, Komponentler ve Stiller
├── .gitignore        # Git takibi dışında tutulan dosyalar
└── README.md         # Proje dökümantasyonu
```

## 📝 Lisans
Bu proje **MIT Lisansı** altında lisanslanmıştır.

👨‍💻 Geliştirici
Furkan Darakcılar
