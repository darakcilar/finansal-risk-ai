import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import TrainingStatsView from './TrainingStatsView'; // Eğitim İstatistikleri Bileşeni

function AdminDashboard({ onBack, apiBase = '/api' }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // KESİNLİKLE FALSE BAŞLAMALI
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isClearing, setIsClearing] = useState(false); // Silme animasyonu için state

  // Konsoldan durumu izlemek için koruma logu
  console.log("🔐 Admin Giriş Kontrolü (isLoggedIn):", isLoggedIn);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        setLoading(true);
      } else {
        alert('Hatalı kullanıcı adı veya şifre!');
      }
    } catch (err) {
      alert('Giriş servisine ulaşılamadı. Python sunucusunun çalıştığından emin olun.');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLogs();
    }
  }, [isLoggedIn, apiBase]);

  const fetchLogs = () => {
    setLoading(true);
    fetch(`${apiBase}/logs`)
      .then(res => {
        if (!res.ok) throw new Error("API yanıt vermedi veya bulunamadı.");
        return res.json();
      })
      .then(data => {
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Log çekme hatası:", err);
        setLoading(false);
      });
  };

  const handleClearLogs = async () => {
    const isConfirmed = window.confirm("⚠️ DİKKAT!\nŞu ana kadar yapılan tüm analiz kayıtları kalıcı olarak silinecektir. Bu işlem geri alınamaz.\n\nOnaylıyor musunuz?");
    
    if (!isConfirmed) return;

    setIsClearing(true);
    try {
      const response = await fetch(`${apiBase}/logs/clear`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLogs([]);
        alert("Başarılı: Tüm analiz kayıtları veritabanından silindi.");
      } else {
        alert("Hata: Kayıtlar silinemedi.");
      }
    } catch (err) {
      console.error("Silme hatası:", err);
      alert("Sunucuya bağlanırken bir hata oluştu.");
    } finally {
      setIsClearing(false);
    }
  };

  // =========================================================================
  // 🛡️ 1. KORUMA DUVARI: Kullanıcı giriş yapmadıysa AŞAĞIDAKİ KODLARI ASLA ÇALIŞTIRMA
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div style={{ width: '100%', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
        <form onSubmit={handleLogin} style={{ 
          background: 'rgba(15, 23, 42, 0.95)', padding: '50px', borderRadius: '24px', 
          border: '1px solid rgba(56, 189, 248, 0.5)', boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.1)',
          width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '20px', borderRadius: '50%', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '35px', lineHeight: '1' }}>🔐</span>
          </div>
          
          <h2 style={{ color: '#38bdf8', margin: '0 0 35px 0', fontSize: '26px', letterSpacing: '1px' }}>Yetkili Girişi</h2>
          
          <input 
            type="text" placeholder="Kullanıcı Adı" required
            style={{ width: '100%', padding: '16px', marginBottom: '20px', borderRadius: '12px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none', fontSize: '15px' }}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Şifre" required
            style={{ width: '100%', padding: '16px', marginBottom: '30px', borderRadius: '12px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none', fontSize: '15px' }}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          
          <button type="submit" style={{ 
            width: '100%', padding: '16px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)' 
          }}
          onMouseOver={(e) => { e.target.style.background = '#0ea5e9'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.target.style.background = '#38bdf8'; e.target.style.transform = 'translateY(0)'; }}
          >
            Sisteme Giriş Yap
          </button>
          
          <button type="button" onClick={onBack} style={{ marginTop: '20px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }}
          onMouseOver={(e) => e.target.style.color = '#94a3b8'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
          >
            İptal Et ve Geri Dön
          </button>
        </form>
      </div>
    );
  }

  // 🛡️ 2. KORUMA DUVARI: Yükleme veya veri temizleme anında animasyon ekranı
  if (loading || isClearing) {
    return <div style={{ textAlign: 'center', padding: '100px', color: '#38bdf8', fontSize: '20px' }}>{isClearing ? 'Kayıtlar siliniyor...' : 'Veriler çekiliyor...'}</div>;
  }

  // --- İSTATİSTİK HESAPLAMALARI ---
  const stats = {
    total: logs.length,
    highRisk: logs.filter(l => l.risk_level === 'high').length,
    highRiskRatio: logs.length ? ((logs.filter(l => l.risk_level === 'high').length / logs.length) * 100).toFixed(1) : 0,
    avgIncome: logs.length ? (logs.reduce((s, l) => {
        const income = l.features && l.features.MonthlyIncome ? parseFloat(l.features.MonthlyIncome) : 0;
        return s + (isNaN(income) ? 0 : income);
    }, 0) / logs.length).toFixed(0) : 0
  };

  const riskDistribution = [
    { name: 'Düşük', count: logs.filter(l => l.risk_level === 'low').length, color: '#10b981' },
    { name: 'Orta', count: logs.filter(l => l.risk_level === 'medium').length, color: '#f59e0b' },
    { name: 'Yüksek', count: logs.filter(l => l.risk_level === 'high').length, color: '#ef4444' }
  ];

  // =========================================================================
  // 🎉 ANA PANEL EKRANI: Sadece ve sadece giriş başarılıysa render edilir
  // =========================================================================
  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-in', paddingBottom: '40px' }}>
      
      {/* BAŞLIK VE BUTONLAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', margin: '0 0 5px 0' }}>🛡️ XAI Sistem Denetimi</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Canlı Log Analizi ve Model Sağlığı</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={handleClearLogs} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span>🗑️</span> Kayıtları Temizle
          </button>

          <button onClick={onBack} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
          >
            Kapat
          </button>
        </div>
      </div>

      {/* VERİ DURUM KONTROLÜ */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '15px', border: '1px dashed #334155', marginBottom: '40px' }}>
          <h2 style={{ color: '#f8fafc' }}>Henüz Sistemde Canlı Kayıt Yok</h2>
          <p style={{ color: '#94a3b8' }}>Veritabanında müşteri analiz kaydı bulunamadı. Yeni analizler yapıldıkça canlı grafikler burada listelenecektir.</p>
        </div>
      ) : (
        <>
          {/* İSTATİSTİK KARTLARI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' }}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', borderLeft: '5px solid #3b82f6' }}>
              <span style={{ color: '#94a3b8' }}>Toplam İşlem</span>
              <h2 style={{ fontSize: '36px', margin: '10px 0 0 0' }}>{stats.total}</h2>
            </div>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', borderLeft: '5px solid #ef4444' }}>
              <span style={{ color: '#94a3b8' }}>Yüksek Risk Oranı</span>
              <h2 style={{ fontSize: '36px', margin: '10px 0 0 0' }}>%{stats.highRiskRatio}</h2>
            </div>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', borderLeft: '5px solid #10b981' }}>
              <span style={{ color: '#94a3b8' }}>Ortalama Kullanıcı Geliri</span>
              <h2 style={{ fontSize: '36px', margin: '10px 0 0 0' }}>{Number(stats.avgIncome).toLocaleString('tr-TR')} ₺</h2>
            </div>
          </div>

          {/* GRAFİKLER */}
          <div style={{ display: 'flex', gap: '25px', height: '350px', marginBottom: '40px' }}>
            <div style={{ flex: 1, background: '#1e293b', padding: '25px', borderRadius: '15px' }}>
              <h3 style={{ marginTop: 0, color: '#94a3b8', marginBottom: '20px' }}>Risk Seviyesi Dağılımı</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={riskDistribution} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ dy: 10, fontSize: 13 }} />
                  <YAxis stroke="#64748b" tick={{ dx: -10, fontSize: 13 }} />
                  <Tooltip cursor={{fill: '#334155'}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: '#1e293b', padding: '25px', borderRadius: '15px' }}>
              <h3 style={{ marginTop: 0, color: '#94a3b8', marginBottom: '20px' }}>Zaman İçinde Risk Skoru Trendi</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={[...logs].reverse().map((l, i) => ({ n: `Kayıt ${i+1}`, r: (l.risk_probability * 100).toFixed(0) }))} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="n" stroke="#64748b" fontSize={11} tick={{ angle: -45, textAnchor: 'end', fontSize: 11, dy: 10 }} />
                  <YAxis stroke="#64748b" tick={{ dx: -5, fontSize: 13 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="r" name="Risk %" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* YAPAY ZEKA MODEL EĞİTİM TEMELLERİ (MLOPS VIEW) */}
      <div className="admin-section-box" style={{ marginTop: '20px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontSize: '24px' }}>🧠</span>
          <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', margin: 0 }}>Yapay Zeka Model Eğitim Temelleri</h2>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px 34px' }}>
          Modelin örüntüleri ezberlediği ana veri havuzunun (Kaggle Dataset) istatistiksel mimarisi ve dağılımı.
        </p>
        <TrainingStatsView apiBase={apiBase} />
      </div>

    </div>
  );
}

export default AdminDashboard;