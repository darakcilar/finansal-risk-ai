import sqlite3
import json
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "risk_logs.db")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # 1. TAHMİNLER TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                features_json TEXT,
                risk_probability REAL,
                risk_level TEXT
            )
        ''')
        
        # Sütun yoksa ekle (Geriye dönük uyumluluk)
        try:
            c.execute('ALTER TABLE predictions ADD COLUMN user_id INTEGER')
        except sqlite3.OperationalError:
            pass # Sütun zaten var
        
        # 2. YÖNETİCİLER TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        ''')
        
        # Varsayılan Admin
        c.execute("INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)", ('Furkan', 'Thorinfrkn4!'))
        c.execute("DELETE FROM admins WHERE username != 'Furkan'")
        
        # 3. KULLANICILAR TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password_hash TEXT,
                created_at TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ SQLite Veritabanı aktif. Tablolar ve yönetici hesabı hazır.")
    except Exception as e:
        print(f"❌ Veritabanı başlatılma hatası: {e}")

def log_prediction(features, risk_probability, risk_level, user_id=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now = datetime.now().isoformat()
        features_json = json.dumps(features)
        
        c.execute('''
            INSERT INTO predictions (timestamp, features_json, risk_probability, risk_level, user_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (now, features_json, risk_probability, risk_level, user_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Log kayıt hatası: {e}")
