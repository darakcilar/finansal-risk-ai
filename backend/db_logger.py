import sqlite3
import json
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "risk_logs.db")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # 1. TAHMİNLER TABLOSU (Mevcut)
        c.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                features_json TEXT,
                risk_probability REAL,
                risk_level TEXT
            )
        ''')
        
        # 2. YÖNETİCİLER TABLOSU (Yeni Eklendi)
        c.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        ''')
        
        # Varsayılan Admini Ekle (Eğer tabloda yoksa otomatik ekler)
        c.execute("INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)", ('Furkan', 'Thorinfrkn4!'))
        
        conn.commit()
        conn.close()
        print("✅ SQLite Veritabanı aktif. Tablolar ve yönetici hesabı hazır.")
    except Exception as e:
        print(f"❌ Veritabanı başlatılma hatası: {e}")

def log_prediction(features, risk_probability, risk_level):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now = datetime.now().isoformat()
        features_json = json.dumps(features)
        
        c.execute('''
            INSERT INTO predictions (timestamp, features_json, risk_probability, risk_level)
            VALUES (?, ?, ?, ?)
        ''', (now, features_json, risk_probability, risk_level))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Log kayıt hatası: {e}")