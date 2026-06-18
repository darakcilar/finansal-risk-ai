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

import psycopg2
import os
import traceback
import joblib
import numpy as np
import json
import urllib.request
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
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

from db_logger import init_db, log_prediction, get_db_connection, get_db_cursor

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


@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        
        if not name or not email or not password:
            return jsonify({"success": False, "error": "Eksik bilgi"}), 400
            
        hashed_password = generate_password_hash(password)
        now = datetime.now().isoformat()
        
        conn = get_db_connection()
        if not conn: return jsonify({"success": False, "error": "Veritabanına bağlanılamadı"}), 500
        c = get_db_cursor(conn)
        
        try:
            c.execute("INSERT INTO users (name, email, password_hash, created_at) VALUES (%s, %s, %s, %s) RETURNING id", (name, email, hashed_password, now))
            user_id = c.fetchone()['id']
            conn.commit()
            conn.close()
            return jsonify({"success": True, "user": {"id": user_id, "name": name, "email": email, "role": "user"}})
        except psycopg2.IntegrityError:
            conn.close()
            return jsonify({"success": False, "error": "Bu e-posta adresi zaten kullanımda."}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    try:
        data = request.get_json()
        email = data.get("email") 
        password = data.get("password")
        role = data.get("role", "user")
        
        conn = get_db_connection()
        if not conn: return jsonify({"success": False, "error": "Veritabanına bağlanılamadı"}), 500
        c = get_db_cursor(conn)
        
        if role == "admin":
            c.execute("SELECT * FROM admins WHERE username = %s AND password = %s", (email, password))
            admin = c.fetchone()
            conn.close()
            if admin:
                return jsonify({"success": True, "user": {"id": admin['id'], "name": "Sistem Yöneticisi", "email": admin['username'], "role": "admin"}})
            else:
                return jsonify({"success": False, "error": "Hatalı yönetici girişi"}), 401
        else:
            c.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = c.fetchone()
            conn.close()
            if user and check_password_hash(user['password_hash'], password):
                return jsonify({"success": True, "user": {"id": user['id'], "name": user['name'], "email": user['email'], "role": "user"}})
            else:
                return jsonify({"success": False, "error": "Hatalı e-posta veya şifre"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/users", methods=["GET"])
def get_all_users():
    conn = get_db_connection()
    if not conn:
        return jsonify({"users": []})
    
    try:
        c = get_db_cursor(conn)
        c.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
        users = c.fetchall()
        
        user_list = []
        for u in users:
            user_list.append({
                "id": u["id"],
                "name": u["name"],
                "email": u["email"],
                "created_at": u["created_at"]
            })
            
        conn.close()
        return jsonify({"success": True, "users": user_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"success": False, "error": "Veritabanına bağlanılamadı"}), 500
    try:
        c = get_db_cursor(conn)
        c.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
        deleted = c.fetchone()
        conn.commit()
        conn.close()
        if deleted:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Kullanıcı bulunamadı"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"success": False, "error": "Veritabanına bağlanılamadı"}), 500
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        
        c = get_db_cursor(conn)
        c.execute("UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING id", (name, email, user_id))
        updated = c.fetchone()
        conn.commit()
        conn.close()
        
        if updated:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Kullanıcı bulunamadı"}), 404
    except psycopg2.IntegrityError:
        conn.close()
        return jsonify({"success": False, "error": "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor."}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/auth/change-password", methods=["POST"])
def auth_change_password():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        old_password = data.get("old_password")
        new_password = data.get("new_password")
        
        if not user_id or not old_password or not new_password:
            return jsonify({"success": False, "error": "Eksik bilgi"}), 400
            
        conn = get_db_connection()
        if not conn: return jsonify({"success": False, "error": "Veritabanına bağlanılamadı"}), 500
        c = get_db_cursor(conn)
        
        c.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = c.fetchone()
        
        if user and check_password_hash(user['password_hash'], old_password):
            new_hash = generate_password_hash(new_password)
            c.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
            conn.commit()
            conn.close()
            return jsonify({"success": True})
        else:
            conn.close()
            return jsonify({"success": False, "error": "Mevcut şifre hatalı"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/user/history", methods=["GET"])
def get_user_history():
    user_id = request.args.get("user_id")
    if not user_id: return jsonify({"history": []})
    try:
        conn = get_db_connection()
        if not conn: return jsonify({"history": []})
        c = get_db_cursor(conn)
        c.execute("SELECT * FROM predictions WHERE user_id = %s ORDER BY id DESC", (user_id,))
        rows = c.fetchall()
        conn.close()
        
        history = []
        for r in rows:
            try:
                features = json.loads(r["features_json"]) if r["features_json"] else {}
            except:
                features = {}
            history.append({
                "id": r["id"],
                "date": r["timestamp"],
                "risk_probability": r["risk_probability"],
                "risk_level": r["risk_level"],
                "features": features
            })
        return jsonify({"history": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None: return jsonify({"error": "Model yüklenmedi"}), 500

    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Geçersiz istek. 'features' alanı gerekli."}), 400

        features = data["features"]
        skip_log = features.pop("__skip_log", False) or data.get("skip_log", False)
        user_id = data.get("user_id", None)

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
        
        user_name = None
        if user_id:
            conn = get_db_connection()
            if conn:
                try:
                    c = get_db_cursor(conn)
                    c.execute("SELECT name FROM users WHERE id = %s", (user_id,))
                    u_row = c.fetchone()
                    if u_row:
                        user_name = u_row['name']
                finally:
                    conn.close()
                    
        local_explanation = generate_local_explanation(model, input_array, importances, risk_probability, user_name)
        shap_values_result = get_shap_values(model, input_array)

        if not skip_log: 
            # Loglama işlemini asenkron hale getirerek tahmin süresini kısaltıyoruz
            threading.Thread(target=log_prediction, args=(features, risk_probability, risk_level, user_id)).start()

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
        user_id = data.get("user_id", None)
        user_name = None
        if user_id:
            conn = get_db_connection()
            if conn:
                try:
                    c = get_db_cursor(conn)
                    c.execute("SELECT name FROM users WHERE id = %s", (user_id,))
                    u_row = c.fetchone()
                    if u_row:
                        user_name = u_row['name']
                finally:
                    conn.close()
                    
        local_explanation = generate_local_explanation(model, input_array, importances, risk_probability, user_name)
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
        conn = get_db_connection()
        if not conn: return jsonify({"logs": []})

        c = get_db_cursor(conn)
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
        if not conn: return jsonify({"error": "Veritabanı bağlantısı yok"}), 500
        c = get_db_cursor(conn)
        
        c.execute('DELETE FROM predictions')
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Tüm kayıtlar başarıyla silindi."}), 200
    except Exception as e:
        traceback.print_exc() # Terminalde hatayı detaylı görmek için
        return jsonify({"error": str(e)}), 500

# Global cache for market data (15 minutes)
_market_data_cache = {
    "data": None,
    "timestamp": 0
}

@app.route('/api/market-data', methods=['GET'])
def get_market_data():
    current_time = time.time()
    # Serve from cache if less than 15 minutes old
    if _market_data_cache["data"] and (current_time - _market_data_cache["timestamp"] < 900):
        return jsonify(_market_data_cache["data"]), 200

    try:
        api_key = os.getenv("TCMB_API_KEY")
        if not api_key:
            return jsonify({"error": "TCMB API key not configured"}), 500
            
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5)
        
        start_str = start_date.strftime("%d-%m-%Y")
        end_str = end_date.strftime("%d-%m-%Y")
        
        url = f"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A.YTL-TP.DK.EUR.A.YTL-TP.AOF.AOF&startDate={start_str}&endDate={end_str}&type=json"
        
        req = urllib.request.Request(url, headers={"key": api_key})
        with urllib.request.urlopen(req) as response:
            raw_data = response.read().decode()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                # TCMB blocks foreign datacenter IPs (like Render) and returns HTML.
                # Fallback to Yahoo Finance for real-time currency data.
                try:
                    usd_req = urllib.request.Request("https://query1.finance.yahoo.com/v8/finance/chart/USDTRY=X", headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(usd_req) as response:
                        usd_data = json.loads(response.read().decode())
                        latest_usd = usd_data['chart']['result'][0]['meta']['regularMarketPrice']
                        
                    eur_req = urllib.request.Request("https://query1.finance.yahoo.com/v8/finance/chart/EURTRY=X", headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(eur_req) as response:
                        eur_data = json.loads(response.read().decode())
                        latest_eur = eur_data['chart']['result'][0]['meta']['regularMarketPrice']
                        
                    result_data = {
                        "USD": f"{latest_usd:.2f}",
                        "EUR": f"{latest_eur:.2f}",
                        "FAIZ": "50.00"
                    }
                    _market_data_cache["data"] = result_data
                    _market_data_cache["timestamp"] = current_time
                    return jsonify(result_data), 200
                except Exception as e:
                    result_data = {
                        "USD": "46.34",
                        "EUR": "53.38",
                        "FAIZ": "50.00"
                    }
                    _market_data_cache["data"] = result_data
                    _market_data_cache["timestamp"] = current_time
                    return jsonify(result_data), 200

            
        items = data.get('items', [])
        
        latest_usd = None
        latest_eur = None
        latest_faiz = None
        
        for item in reversed(items):
            if latest_usd is None and item.get('TP_DK_USD_A_YTL'):
                latest_usd = item.get('TP_DK_USD_A_YTL')
            if latest_eur is None and item.get('TP_DK_EUR_A_YTL'):
                latest_eur = item.get('TP_DK_EUR_A_YTL')
            if latest_faiz is None and item.get('TP_AOF_AOF'):
                latest_faiz = item.get('TP_AOF_AOF')
                
            if latest_usd and latest_eur and latest_faiz:
                break
                
        result_data = {
            "USD": latest_usd if latest_usd else "32.50",
            "EUR": latest_eur if latest_eur else "35.20",
            "FAIZ": latest_faiz if latest_faiz else "50.0"
        }
        
        _market_data_cache["data"] = result_data
        _market_data_cache["timestamp"] = current_time
        return jsonify(result_data), 200
        
    except Exception as e:
        print("TCMB API Error:", traceback.format_exc())
from chatbot import generate_chatbot_response

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_id = data.get("user_id")
    message = data.get("message", "")
    
    if not message:
        return jsonify({"error": "Mesaj boş olamaz."}), 400

    conn = get_db_connection()
    user_analysis = None
    if conn and user_id:
        try:
            c = conn.cursor()
            c.execute('''
                SELECT risk_probability, risk_level, features_json 
                FROM predictions 
                WHERE user_id = %s 
                ORDER BY timestamp DESC LIMIT 1
            ''', (user_id,))
            row = c.fetchone()
            if row:
                user_analysis = {
                    "risk_probability": row[0],
                    "risk_level": row[1],
                    "features_json": row[2]
                }
            conn.close()
        except Exception as e:
            print("DB Fetch Error:", e)

    response_data = generate_chatbot_response(message, user_analysis)
    if isinstance(response_data, dict):
        return jsonify({"reply": response_data.get("text", ""), "action": response_data.get("action")}), 200
    else:
        return jsonify({"reply": response_data}), 200

if __name__ == "__main__":
    flask_port = int(os.environ.get("PYTHON_PORT", 5002))
    flask_host = os.environ.get("PYTHON_HOST", "127.0.0.1")
    app.run(debug=False, host=flask_host, port=flask_port, use_reloader=False)