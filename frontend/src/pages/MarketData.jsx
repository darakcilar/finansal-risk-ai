import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

export default function MarketData() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/market-data`)
      .then(res => res.json())
      .then(data => {
        setMarketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Market data fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #050a1a)', padding: '1.5rem', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '1rem' }}>
        
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', marginBottom: '2rem', fontSize: '1rem' }}>
          <ArrowLeft size={20} style={{ marginRight: '8px' }} />
          Ana Ekrana Dön
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Activity size={28} color="#10b981" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Canlı Piyasa (TCMB)</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>Yükleniyor...</div>
        ) : marketData ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={cardStyle}>
              <div style={iconBoxStyle('#38bdf8')}><DollarSign size={24} color="#38bdf8" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>USD/TRY (Dolar)</div>
                <div style={valueStyle}>{marketData.USD} ₺</div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBoxStyle('#a78bfa')}><DollarSign size={24} color="#a78bfa" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>EUR/TRY (Euro)</div>
                <div style={valueStyle}>{marketData.EUR} ₺</div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBoxStyle('#f472b6')}><TrendingUp size={24} color="#f472b6" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>TCMB Günlük Faiz</div>
                <div style={valueStyle}>%{marketData.FAIZ}</div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', color: '#f87171', marginTop: '3rem' }}>Piyasa verileri alınamadı.</div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)'
};

const iconBoxStyle = (color) => ({
  width: '50px', height: '50px', borderRadius: '12px',
  backgroundColor: `${color}20`, // 20 is hex opacity
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});

const labelStyle = { color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.3rem' };
const valueStyle = { color: 'white', fontSize: '1.5rem', fontWeight: 'bold' };
