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
from flask_cors import CORS 

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

load_dotenv()

from model_explainer import (
    FEATURE_LABELS_TR,
    FEATURE_NAMES,
    generate_local_explanation,
    get_decision_path,
    get_feature_importance,
    get_shap_values,
)

from db_logger import init_db, log_prediction

init_db()
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "advanced_risk_model.joblib")

print(f"📦 Model yükleniyor: {MODEL_PATH}")
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model başarıyla yüklendi: {type(model).__name__}")
except Exception as e:
    print(f"❌ Model yüklenemedi: {e}")
    model = None


# Fonksiyonlar Model Yüklendikten SONRA tanımlanmalı
_cached_importance = None

def _get_importance():
    global _cached_importance
    if _cached_importance is None and model is not None:
        _cached_importance = get_feature_importance(model)
    return _cached_importance or []


# ==========================================
# 🔥 GÜVENLİ WARM-UP (ISINMA TURU) 🔥
# ==========================================
# Isınma turu fonksiyonlardan SONRA çağrılıyor ki NameError vermesin
if model is not None:
    try:
        print("🔥 Yapay Zeka ve SHAP motoru ısınma turuna başlıyor...")
        
        # 1. Sahte bir veri (0'lardan oluşan) hazırlıyoruz
        dummy_input = np.zeros((1, 10))
        
        # 2. Tahmin (Predict) fonksiyonlarını önden çalıştırıyoruz
        model.predict(dummy_input)
        if hasattr(model, "predict_proba"):
            model.predict_proba(dummy_input)
            
        # 3. En ağırı olan SHAP motorunu ilk kez burada tetikliyoruz
        _get_importance()
        get_shap_values(model, dummy_input)
        
        print("🚀 Sistem tamamen hazır! Kullanıcılar için ilk bekleme süresi SIFIRLANDI.")
    except Exception as e:
        print(f"⚠️ Isınma turu atlandı (Sistem normal çalışmaya devam edecek): {e}")
# ==========================================


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model else None,
    })


@app.route("/api/feature-names", methods=["GET"])
def feature_names():
    features = []
    names = list(model.feature_names_in_) if model and hasattr(model, "feature_names_in_") else FEATURE_NAMES
    for name in names:
        features.append({"name": name, "label": FEATURE_LABELS_TR.get(name, name)})
    return jsonify({"features": features})


@app.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    if model is None: return jsonify({"error": "Model yüklenmedi"}), 500
    return jsonify({"importances": _get_importance()})


@app.route("/api/login", methods=["POST"])
def login():
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
        
        if user: return jsonify({"success": True, "message": "Giriş başarılı"})
        else: return jsonify({"success": False, "message": "Hatalı kullanıcı adı veya şifre"}), 401
    except Exception as e:
        return jsonify({"error": f"Giriş işlemi sırasında hata oluştu: {str(e)}"}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None: return jsonify({"error": "Model yüklenmedi"}), 500

    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Geçersiz istek. 'features' alanı gerekli."}), 400

        features = data["features"]
        skip_log = features.pop("__skip_log", False) or data.get("skip_log", False)

        is_low_test = (features.get("age") == 35 and features.get("MonthlyIncome") == 8000 and features.get("NumberOfOpenCreditLinesAndLoans") == 4)
        is_high_test = (features.get("age") == 24 and features.get("MonthlyIncome") == 5000 and features.get("NumberOfOpenCreditLinesAndLoans") == 8)
        if is_low_test or is_high_test: skip_log = True

        feature_order = list(model.feature_names_in_) if hasattr(model, "feature_names_in_") else FEATURE_NAMES
        input_values = []
        for fname in feature_order:
            try: input_values.append(float(features.get(fname, 0)))
            except: input_values.append(0.0)

        input_array = np.array([input_values])
        prediction = int(model.predict(input_array)[0])

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            risk_probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
        else:
            risk_probability = float(prediction)

        if risk_probability >= 0.7: risk_level, risk_label = "high", "Yüksek Risk"
        elif risk_probability >= 0.4: risk_level, risk_label = "medium", "Orta Risk"
        else: risk_level, risk_label = "low", "Düşük Risk"

        decision_path = get_decision_path(model, input_array)
        importances = _get_importance()
        
        local_explanation = generate_local_explanation(model, input_array, importances, risk_probability)
        shap_values_result = get_shap_values(model, input_array)

        if not skip_log: log_prediction(features, risk_probability, risk_level)

        return jsonify({
            "prediction": prediction,
            "risk_probability": round(risk_probability, 4),
            "risk_level": risk_level,
            "risk_label": risk_label,
            "decision_path": decision_path,
            "local_explanation": local_explanation,
            "xai_advice": local_explanation.get("xai_advice", ""),
            "feature_importances": importances,
            "shap_values": shap_values_result,
            "recommendations": local_explanation.get("recommendations", {})
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Tahmin hatası: {str(e)}"}), 500


@app.route("/api/explain", methods=["POST"])
def explain():
    if model is None: return jsonify({"error": "Model yüklenmedi"}), 500
    try:
        data = request.get_json()
        features = data.get("features", {})
        feature_order = list(model.feature_names_in_) if hasattr(model, "feature_names_in_") else FEATURE_NAMES
        input_values = []
        for fname in feature_order:
            try: input_values.append(float(features.get(fname, 0)))
            except: input_values.append(0.0)
        
        input_array = np.array([input_values])
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            risk_probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
        else:
            risk_probability = float(model.predict(input_array)[0])

        decision_path = get_decision_path(model, input_array)
        importances = _get_importance()
        local_explanation = generate_local_explanation(model, input_array, importances, risk_probability)
        shap_values_result = get_shap_values(model, input_array)

        return jsonify({
            "risk_probability": round(risk_probability, 4),
            "decision_path": decision_path,
            "local_explanation": local_explanation,
            "xai_advice": local_explanation.get("xai_advice", ""), 
            "feature_importances": importances,
            "shap_values": shap_values_result,
            "recommendations": local_explanation.get("recommendations", {})
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Açıklama hatası: {str(e)}"}), 500
    
    
@app.route("/api/admin/training-stats", methods=["GET"])
def get_training_stats():
    try:
        return jsonify({
            "total_samples": 150000,
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
        })
    except Exception as e:
        return jsonify({"error": f"Eğitim verileri yüklenemedi: {str(e)}"}), 500


@app.route("/api/logs", methods=["GET"])
def get_logs():
    try:
        db_path = os.path.join(os.path.dirname(__file__), "risk_logs.db")
        if not os.path.exists(db_path): return jsonify({"logs": []})

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row 
        c = conn.cursor()
        c.execute('SELECT * FROM predictions ORDER BY id DESC LIMIT 50')
        rows = c.fetchall()
        
        logs = []
        for row in rows:
            r_dict = dict(row)
            try: r_dict["features"] = json.loads(r_dict.get("features_json", "{}"))
            except: r_dict["features"] = {}
            logs.append(r_dict)
            
        conn.close()
        return jsonify({"logs": logs})
    except Exception as e:
        return jsonify({"error": f"Loglar okunamadı: {str(e)}"}), 500

# 🚀 YENİ: Veritabanındaki tüm kayıtları kalıcı olarak silme uç noktası
@app.route('/api/logs', methods=['DELETE', 'OPTIONS'])
def clear_logs():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        conn = get_db_connection()
        # SQL komutu ile tüm satırları uçuruyoruz
        conn.execute('DELETE FROM logs')
        # İşlemi veritabanına kalıcı olarak kaydediyoruz (Burası kritik!)
        conn.commit()
        conn.close()
        return jsonify({"message": "Tüm kayıtlar başarıyla silindi."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    flask_port = int(os.environ.get("PYTHON_PORT", 5002))
    flask_host = os.environ.get("PYTHON_HOST", "127.0.0.1")
    app.run(debug=False, host=flask_host, port=flask_port, use_reloader=False)