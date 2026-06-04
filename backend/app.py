"""
Finansal Risk AI — Flask Backend
---------------------------------
Loads the trained model and exposes REST API endpoints for:
  - /api/predict          → risk prediction + probability + SHAP values + DB Logging
  - /api/feature-importance → global feature importances
  - /api/explain          → local explanation for a single customer
  - /api/logs             → admin paneli için son denetim kayıtları
  - /api/logs/clear       → admin panelinden eski kayıtları temizleme
  - /api/login            → admin paneli için güvenli giriş kontrolü
"""

import os
import traceback
import joblib
import numpy as np
import sqlite3
import json
from flask import Flask, jsonify, request
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS # 1. Burayı ekle

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# .env dosyasını sisteme dahil ediyoruz
load_dotenv()

from model_explainer import (
    FEATURE_LABELS_TR,
    FEATURE_NAMES,
    generate_local_explanation,
    get_decision_path,
    get_feature_importance,
    get_shap_values,
)

# VERİTABANI MODÜLÜ
from db_logger import init_db, log_prediction

# Sistemin başında veritabanını ve tabloları hazırla
init_db()

# ---------------------------------------------------------------------------
# Load model at startup
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "advanced_risk_model.joblib")

print(f"📦 Model yükleniyor: {MODEL_PATH}")
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model başarıyla yüklendi: {type(model).__name__}")
    
    if hasattr(model, "n_features_in_"):
        print(f"   Beklenen özellik sayısı: {model.n_features_in_}")
    if hasattr(model, "feature_names_in_"):
        print(f"   Özellik adları: {list(model.feature_names_in_)}")
except Exception as e:
    print(f"❌ Model yüklenemedi: {e}")
    model = None

# Cache feature importance at startup
_cached_importance = None

def _get_importance():
    global _cached_importance
    if _cached_importance is None and model is not None:
        _cached_importance = get_feature_importance(model)
    return _cached_importance or []

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model else None,
    })


@app.route("/api/feature-names", methods=["GET"])
def feature_names():
    """Return feature names and Turkish labels for the form."""
    features = []
    
    if model and hasattr(model, "feature_names_in_"):
        names = list(model.feature_names_in_)
    else:
        names = FEATURE_NAMES
    
    for name in names:
        features.append({
            "name": name,
            "label": FEATURE_LABELS_TR.get(name, name),
        })
    return jsonify({"features": features})


@app.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    """Return global feature importances from the model."""
    if model is None:
        return jsonify({"error": "Model yüklenmedi"}), 500
    
    importances = _get_importance()
    return jsonify({"importances": importances})


# Yönetici Girişi İçin Veritabanı Kontrolü
@app.route("/api/login", methods=["POST"])
def login():
    """Veritabanındaki admins tablosundan kullanıcıyı doğrular."""
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        db_path = os.path.join(os.path.dirname(__file__), "risk_logs.db")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("SELECT * FROM admins WHERE username = ? AND password = ?", (username, password))
        user = c.fetchone()
        conn.close()
        
        if user:
            return jsonify({"success": True, "message": "Giriş başarılı"})
        else:
            return jsonify({"success": False, "message": "Hatalı kullanıcı adı veya şifre"}), 401
            
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Giriş işlemi sırasında hata oluştu: {str(e)}"}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accept customer data and return risk prediction + SHAP explanations + Log to DB.
    """
    if model is None:
        return jsonify({"error": "Model yüklenmedi"}), 500

    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Geçersiz istek. 'features' alanı gerekli."}), 400

        features = data["features"]
        
        # 1. KONTROL: Node.js'ten sağ çıkabilen gizli bayrak varsa al ve sil
        skip_log = features.pop("__skip_log", False)
        if not skip_log:
            skip_log = data.get("skip_log", False)

        # 2. %100 KESİN ÇÖZÜM: Test Verilerini Matematiksel İmza İle Tanı
        is_low_test = (features.get("age") == 35 and features.get("MonthlyIncome") == 8000 and features.get("NumberOfOpenCreditLinesAndLoans") == 4)
        is_high_test = (features.get("age") == 24 and features.get("MonthlyIncome") == 5000 and features.get("NumberOfOpenCreditLinesAndLoans") == 8)

        # Eğer gelen veri test profillerinden biriyse, veritabanı kaydını KESİNLİKLE durdur!
        if is_low_test or is_high_test:
            skip_log = True

        if hasattr(model, "feature_names_in_"):
            feature_order = list(model.feature_names_in_)
        else:
            feature_order = FEATURE_NAMES

        input_values = []
        for fname in feature_order:
            val = features.get(fname, 0)
            try:
                val = float(val)
            except (TypeError, ValueError):
                val = 0.0
            input_values.append(val)

        input_array = np.array([input_values])

        # Predict
        prediction = int(model.predict(input_array)[0])

        # Probability
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            risk_probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
        else:
            risk_probability = float(prediction)

        # Risk level
        if risk_probability >= 0.7:
            risk_level = "high"
            risk_label = "Yüksek Risk"
        elif risk_probability >= 0.4:
            risk_level = "medium"
            risk_label = "Orta Risk"
        else:
            risk_level = "low"
            risk_label = "Düşük Risk"

        # Decision path
        decision_path = get_decision_path(model, input_array)

        # Local explanation (ARTIK DÖNGÜSEL İÇE AKTARMA YOK, MODELİ BURADAN GÖNDERİYORUZ)
        importances = _get_importance()
        local_explanation = generate_local_explanation(
            model, input_array, importances, risk_probability
        )

        # SHAP Değerlerini Hesapla
        shap_values_result = get_shap_values(model, input_array)

        # KARAR ANI: Test verisiyse kaydetme, manuel gerçek veriyse kaydet
        if not skip_log:
            log_prediction(features, risk_probability, risk_level)
            print("📝 MANUEL GİRİŞ: Analiz veritabanına kaydedildi.")
        else:
            print("🚀 OTOMATİK TEST VERİSİ TESPİT EDİLDİ: Veritabanına kaydedilmedi.")

        # DÜZELTİLDİ: xai_advice ve summary ayrımı kusursuz yapıldı
        return jsonify({
            "prediction": prediction,
            "risk_probability": round(risk_probability, 4),
            "risk_level": risk_level,
            "risk_label": risk_label,
            "decision_path": decision_path,
            "local_explanation": local_explanation, # İçinde kısa 'summary' barındırır
            "xai_advice": local_explanation.get("xai_advice", ""), # Uzun dinamik metni buradan çeker
            "feature_importances": importances,
            "shap_values": shap_values_result,
            "recommendations": local_explanation.get("recommendations", [])
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Tahmin hatası: {str(e)}"}), 500


@app.route("/api/explain", methods=["POST"])
def explain():
    """
    Detailed explanation endpoint
    """
    if model is None:
        return jsonify({"error": "Model yüklenmedi"}), 500

    try:
        data = request.get_json()
        features = data.get("features", {})

        if hasattr(model, "feature_names_in_"):
            feature_order = list(model.feature_names_in_)
        else:
            feature_order = FEATURE_NAMES

        input_values = []
        for fname in feature_order:
            val = features.get(fname, 0)
            try:
                val = float(val)
            except (TypeError, ValueError):
                val = 0.0
            input_values.append(val)

        input_array = np.array([input_values])

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            risk_probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
        else:
            risk_probability = float(model.predict(input_array)[0])

        decision_path = get_decision_path(model, input_array)
        importances = _get_importance()
        
        # DÜZELTİLDİ: Burada da 'model' parametresi eklendi
        local_explanation = generate_local_explanation(
             model, input_array, importances, risk_probability
        )
        
        # Explain endpointine de SHAP ekliyoruz
        shap_values_result = get_shap_values(model, input_array)

        return jsonify({
            "risk_probability": round(risk_probability, 4),
            "decision_path": decision_path,
            "local_explanation": local_explanation,
            "xai_advice": local_explanation.get("xai_advice", ""), # Ekstra güvenlik için buraya da eklendi
            "feature_importances": importances,
            "shap_values": shap_values_result,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Açıklama hatası: {str(e)}"}), 500
    
    
@app.route("/api/admin/training-stats", methods=["GET"])
def get_training_stats():
    """
    Modelin eğitiminde kullanılan ana veri setinin (Kaggle) 
    dağılım istatistiklerini ve grafik verilerini döndürür.
    """
    try:
        training_data_summary = {
            "total_samples": 150000, # Toplam veri sayısı
            "class_distribution": [
                {"name": "Düşük Risk (Normal)", "count": 139974, "percentage": 93.3, "color": "#10b981"},
                {"name": "Yüksek Risk (Temerrüt)", "count": 10026, "percentage": 6.7, "color": "#ef4444"}
            ],
            "feature_comparisons": [
                {"metric": "Ortalama Yaş", "low_risk": 52.7, "high_risk": 45.9, "unit": "Yaş"},
                {"metric": "Ort. Kart Kullanım Oranı", "low_risk": 30.2, "high_risk": 72.5, "unit": "%"},
                {"metric": "Ort. Borç/Gelir Oranı", "low_risk": 34.1, "high_risk": 55.4, "unit": "%"},
                {"metric": "Ort. Aylık Net Gelir", "low_risk": 6800, "high_risk": 5100, "unit": "$"}
            ]
        }
        return jsonify(training_data_summary)
    except Exception as e:
        return jsonify({"error": f"Eğitim verileri yüklenemedi: {str(e)}"}), 500

@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Admin Paneli için son logları getirir. Kırılmaz (Crash-proof) versiyon."""
    try:
        db_path = os.path.join(os.path.dirname(__file__), "risk_logs.db")
        
        # Veritabanı dosyası yoksa sunucuyu çökertmek yerine boş liste dön
        if not os.path.exists(db_path):
            print("⚠️ Veritabanı dosyası henüz oluşturulmamış.")
            return jsonify({"logs": []})

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row 
        c = conn.cursor()
        
        c.execute('SELECT * FROM predictions ORDER BY id DESC LIMIT 50')
        rows = c.fetchall()
        
        logs = []
        for row in rows:
            r_dict = dict(row)
            try:
                r_dict["features"] = json.loads(r_dict.get("features_json", "{}"))
            except:
                r_dict["features"] = {}
                
            logs.append(r_dict)
            
        conn.close()
        return jsonify({"logs": logs})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Loglar okunamadı: {str(e)}"}), 500

# Yönetici Panelinden Kayıtları Silme Rotası
@app.route("/api/logs/clear", methods=["DELETE"])
def clear_logs():
    """Veritabanındaki 'predictions' (tahminler) tablosunu tamamen boşaltır."""
    try:
        db_path = os.path.join(os.path.dirname(__file__), "risk_logs.db")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Sadece analizleri siliyoruz, admin şifresi (admins tablosu) güvende kalıyor
        c.execute('DELETE FROM predictions')
        conn.commit()
        conn.close()
        
        print("🗑️ Yönetici paneli üzerinden tüm analiz kayıtları silindi!")
        return jsonify({"success": True, "message": "Tüm kayıtlar başarıyla silindi."})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Silme işlemi başarısız: {str(e)}"}), 500

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    flask_port = int(os.environ.get("PYTHON_PORT", 5002))
    flask_host = os.environ.get("PYTHON_HOST", "127.0.0.1")
    
    print(f"🚀 Python ML Servisi başlatılıyor (host: {flask_host}, port {flask_port})...")
    app.run(debug=False, host=flask_host, port=flask_port, use_reloader=False)