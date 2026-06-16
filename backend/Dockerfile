# Python 3.9 tabanlı hafif bir işletim sistemi kullanıyoruz
FROM python:3.9-slim

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Gerekli C++ derleyicilerini yüklüyoruz (SHAP ve Scikit-Learn için gerekebilir)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılık listesini kopyalayıp yüklüyoruz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Geri kalan tüm backend kodlarını ve model dosyasını kopyalıyoruz
COPY . .

# Flask'ın dışarıya açılacağı port
EXPOSE 5002

# Sunucuyu başlatan komut
CMD ["python", "app.py"]