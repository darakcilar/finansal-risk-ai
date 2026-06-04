/**
 * python_bridge.js
 * ----------------
 * Manages communication between Node.js and the Python ML microservice.
 * Python Flask runs on internal port (default 5002); this module forwards requests.
 */

// .env dosyasını sisteme dahil ediyoruz
require('dotenv').config();

const http = require('http');

// Artık port ve host bilgilerini .env dosyasından alıyoruz.
// Eğer bulamazsa (yedek plan olarak) eski değerleri kullanacak.
const PYTHON_HOST = process.env.PYTHON_HOST || '127.0.0.1';
const PYTHON_PORT = process.env.PYTHON_PORT || 5002;

/**
 * Send a request to the Python ML service
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g. '/api/predict')
 * @param {object|null} body - Request body for POST
 * @returns {Promise<object>} Parsed JSON response
 */
function callPython(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: PYTHON_HOST,
      port: PYTHON_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Python yanıtı parse edilemedi: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Python ML servisi bağlantı hatası: ${err.message}. Python servisinin çalıştığından emin olun (port ${PYTHON_PORT}).`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Python ML servisi zaman aşımı (30s)'));
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

module.exports = { callPython, PYTHON_PORT };