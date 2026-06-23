try:
    import psycopg2 # pyright: ignore[reportMissingModuleSource]
    import psycopg2.extras # pyright: ignore[reportMissingModuleSource]
except ImportError:
    psycopg2 = None
    psycopg2_extras = None
    print("❌ psycopg2 paketi bulunamadı. Lütfen `pip install psycopg2-binary` komutunu çalıştırın.")

import json
from datetime import datetime
import os

def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL ortam değişkeni bulunamadı. Lütfen PostgreSQL bağlantı adresini ekleyin.")
        return None
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"❌ Veritabanı bağlantı hatası: {e}")
        return None

def get_db_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

def init_db():
    conn = get_db_connection()
    if not conn:
        return
    try:
        c = conn.cursor()
        
        # 1. TAHMİNLER TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                timestamp TEXT,
                features_json TEXT,
                risk_probability REAL,
                risk_level TEXT,
                user_id INTEGER
            )
        ''')
        
        # 2. YÖNETİCİLER TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
            )
        ''')
        
        # Varsayılan Admin (PostgreSQL ON CONFLICT)
        c.execute('''
            INSERT INTO admins (username, password) 
            VALUES (%s, %s) 
            ON CONFLICT (username) DO NOTHING
        ''', ('Furkan', 'Thorinfrkn4!'))
        c.execute("DELETE FROM admins WHERE username != 'Furkan'")
        
        # 3. KULLANICILAR TABLOSU
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password_hash TEXT,
                created_at TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ PostgreSQL Veritabanı aktif. Tablolar ve yönetici hesabı hazır.")
    except Exception as e:
        print(f"❌ Veritabanı başlatılma hatası: {e}")

def log_prediction(features, risk_probability, risk_level, user_id=None):
    conn = get_db_connection()
    if not conn:
        return
    try:
        c = conn.cursor()
        now = datetime.now().isoformat()
        features_json = json.dumps(features)
        
        c.execute('''
            INSERT INTO predictions (timestamp, features_json, risk_probability, risk_level, user_id)
            VALUES (%s, %s, %s, %s, %s)
        ''', (now, features_json, risk_probability, risk_level, user_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Log kayıt hatası: {e}")
