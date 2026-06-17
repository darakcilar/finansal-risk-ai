import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PieChart, Activity, Target, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

export default function Stats({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/user/history?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const totalAnalyses = history.length;
  const avgRisk = totalAnalyses > 0 ? (history.reduce((sum, item) => sum + (item.risk_probability * 100), 0) / totalAnalyses).toFixed(1) : 0;
  const highRiskCount = history.filter(h => h.risk_level === 'high').length;
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #050a1a)', padding: '1.5rem', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '1rem' }}>
        
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', marginBottom: '2rem', fontSize: '1rem' }}>
          <ArrowLeft size={20} style={{ marginRight: '8px' }} />
          Ana Ekrana Dön
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <PieChart size={28} color="#a78bfa" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'white' }}>İstatistiklerim</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>Yükleniyor...</div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={cardStyle}>
              <div style={iconBoxStyle('#38bdf8')}><Target size={24} color="#38bdf8" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Toplam Analiz Sayısı</div>
                <div style={valueStyle}>{totalAnalyses}</div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBoxStyle('#a78bfa')}><Activity size={24} color="#a78bfa" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Ortalama Risk Skoru</div>
                <div style={valueStyle}>%{avgRisk}</div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={iconBoxStyle('#f43f5e')}><ShieldAlert size={24} color="#f43f5e" /></div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Yüksek Riskli Analizler</div>
                <div style={valueStyle}>{highRiskCount}</div>
              </div>
            </div>
          </motion.div>
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
  backgroundColor: `${color}20`,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});

const labelStyle = { color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.3rem' };
const valueStyle = { color: 'white', fontSize: '1.5rem', fontWeight: 'bold' };
