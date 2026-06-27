/**
 * server.js — Finansal Risk AI Node.js Backend
 * =============================================
 * Microservice Architecture:
 * - Node.js (Express): Bağımsız API & Açıklanabilir Metin (NLG) Motoru
 * - Python (Flask): Bağımsız ML Servisi (Random Forest)
 */

// .env dosyasını sisteme dahil ediyoruz (En üstte olmalı!)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { callPython, PYTHON_PORT } = require('./python_bridge');
const { generateRecommendations } = require('./recommendations');


const app = express();

// Portu artık .env dosyasından çekiyoruz, bulamazsa 5001 kullanıyor
const PORT = process.env.NODE_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ─── Health Check ───
app.get('/api/health', async (req, res) => {
  let pythonHealth = null;
  try {
    const result = await callPython('GET', '/api/health');
    pythonHealth = result.data;
  } catch (e) {
    pythonHealth = { status: 'unavailable', error: e.message };
  }

  res.json({
    status: 'ok',
    server: 'Node.js Express',
    architecture: 'Microservices (Decoupled)',
    python_service: pythonHealth
  });
});

// ─── Feature Names ───
app.get('/api/feature-names', async (req, res) => {
  try {
    const result = await callPython('GET', '/api/feature-names');
    res.json(result.data);
  } catch (err) {
    res.status(503).json({ error: `Python servisi erişilemez: ${err.message}` });
  }
});

// ─── Feature Importance ───
app.get('/api/feature-importance', async (req, res) => {
  try {
    const result = await callPython('GET', '/api/feature-importance');
    res.json(result.data);
  } catch (err) {
    res.status(503).json({ error: `Python servisi erişilemez: ${err.message}` });
  }
});

// ─── Predict (Main Endpoint) ───
app.post('/api/predict', async (req, res) => {
  try {
    const { features } = req.body;

    if (!features) {
      return res.status(400).json({ error: "Geçersiz istek. 'features' alanı gerekli." });
    }

    console.log('📊 Tahmin isteği alındı, Python servisine yönlendiriliyor...');
    const pythonResult = await callPython('POST', '/api/predict', { features });

    if (pythonResult.status !== 200) {
      return res.status(pythonResult.status).json(pythonResult.data);
    }

    const prediction = pythonResult.data;

    console.log('💡 Teknik Tavsiyeler oluşturuluyor...');
    
    // Sadece Eylem Planı (Teknik Tavsiyeler) Node.js'te üretilmeye devam ediyor
    const recommendations = generateRecommendations(
      features,
      prediction.risk_probability,
      prediction.risk_level,
      prediction.feature_importances
    );

    // Response objesini hazırlıyoruz (Python'dan gelen xai_advice zaten prediction içinde var!)
    const response = {
      ...prediction,
      recommendations,
      server_info: {
        prediction_by: 'Python (Random Forest)',
        nlg_engine: 'Python SHAP Dynamic Engine', // Güncelledik!
        architecture: 'Microservice'
      }
    };

    console.log(`✅ Sonuç: Risk = ${prediction.risk_level} (${(prediction.risk_probability * 100).toFixed(1)}%)`);
    res.json(response);

  } catch (err) {
    console.error('❌ Tahmin hatası:', err.message);
    res.status(503).json({
      error: `İşlem hatası: ${err.message}`,
      hint: 'Python ML servisinin çalıştığından emin olun.'
    });
  }

  // ─── Admin: Training Data Stats ───
app.get('/api/admin/training-stats', async (req, res) => {
  try {
    console.log('📦 Eğitim verisi istatistikleri Python servisinden çekiliyor...');
    const result = await callPython('GET', '/api/admin/training-stats');
    res.json(result.data);
  } catch (err) {
    res.status(503).json({ error: `Python servisi erişilemez: ${err.message}` });
  }
});
});

// ─── Explain (Detailed) ───
app.post('/api/explain', async (req, res) => {
  try {
    const { features } = req.body;
    const result = await callPython('POST', '/api/explain', { features });
    
    const recommendations = generateRecommendations(
      features,
      result.data.risk_probability,
      result.data.local_explanation?.risk_level || 'medium',
      result.data.feature_importances
    );

    // Aynı şekilde buradaki xai_advice ezme işlemini de sildik.
    res.json({
      ...result.data,
      recommendations
    });
  } catch (err) {
    res.status(503).json({ error: `İşlem hatası: ${err.message}` });
  }
});

// ─── Start Server ───
console.log('═══════════════════════════════════════════');
console.log('  Finansal Risk AI — Bağımsız Node.js Backend');
console.log('  Mod: Strict Explainable AI (XAI)');
console.log('═══════════════════════════════════════════');

app.listen(PORT, () => {
  console.log(`\n🚀 Node.js API sunucusu başlatıldı: http://localhost:${PORT}`);
  console.log(`📡 Python ML servisinin (${PYTHON_PORT || '5002'}) ayrı bir terminalde çalıştığı varsayılıyor.\n`);
});