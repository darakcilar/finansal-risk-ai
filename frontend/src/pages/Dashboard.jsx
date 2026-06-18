import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Download, Clock, ArrowRight, Activity, Settings as SettingsIcon, Menu } from 'lucide-react';
import AdminDashboard from '../components/AdminDashboard';
import WebDrawerMenu from '../components/WebDrawerMenu';
import Chatbot from '../components/Chatbot';
import { generateFullRiskReportPDF } from '../utils/pdfGenerator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      const fetchMarketData = async () => {
        try {
          const response = await fetch(`${API_BASE}/market-data`);
          const data = await response.json();
          
          if (response.ok) {
            setMarketData({
              USD: parseFloat(data.USD).toFixed(2),
              EUR: parseFloat(data.EUR).toFixed(2),
              FAIZ: data.FAIZ ? parseFloat(data.FAIZ).toFixed(2) : '--'
            });
          } else {
            console.error("API Error:", data.error);
          }
        } catch (error) {
          console.error("Piyasa verileri çekilemedi:", error);
        } finally {
          setMarketLoading(false);
        }
      };
      fetchMarketData();
    }
  }, [user]);

  const latestAnalysis = user?.history && user.history.length > 0 ? user.history[0] : null;

  // Calculate Quick Stats
  const history = user?.history || [];
  const totalAnalyses = history.length;
  const avgRisk = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.risk_probability, 0) / history.length * 100).toFixed(1) 
    : 0;
  const lastRiskStr = latestAnalysis ? (latestAnalysis.risk_probability * 100).toFixed(1) : '0';

  // Prepare Chart Data (reverse so oldest is first, newest is last)
  const chartData = [...history].reverse().map((item, index) => ({
    name: `A${index + 1}`,
    risk: parseFloat((item.risk_probability * 100).toFixed(1)),
    date: new Date(item.date).toLocaleDateString('tr-TR')
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const downloadSummaryPDF = async (item) => {
    if (!item.features || Object.keys(item.features).length === 0) {
      alert("Bu analiz için detaylı veri bulunmuyor. Lütfen yeni bir analiz yapın.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: { ...item.features, __skip_log: true }, user_id: user.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        generateFullRiskReportPDF(data, item.features, new Date(item.date));
      } else {
        alert("Rapor oluşturulurken hata: " + data.error);
      }
    } catch(e) {
      console.error(e);
      alert("Rapor oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <WebDrawerMenu 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        user={user} 
        handleLogout={handleLogout} 
      />

      {isMobile ? (
        <header className="dashboard-header" style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <button 
            className="no-mobile-full"
            onClick={() => setIsDrawerOpen(true)} 
            style={{ display: 'flex', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, marginBottom: '20px' }}
          >
            <Menu size={32} />
          </button>
          <h2 className="dashboard-greeting" style={{ margin: 0, color: 'var(--sky-blue)', fontSize: '1.15rem' }}>Merhaba,</h2>
          <h1 className="dashboard-name" style={{ margin: '5px 0 10px 0', fontSize: '2.2rem', fontWeight: 800 }}>{user.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, textAlign: 'left' }}>Bugün risk analizi yapmak için harika bir gün!</p>
        </header>
      ) : (
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem' }}>
              <h2 className="dashboard-greeting" style={{ margin: 0 }}>Merhaba,</h2>
              <h1 className="dashboard-name" style={{ margin: 0, wordBreak: 'break-word' }}>{user.name}</h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/settings" className="btn-logout" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-glass)' }}>
              <SettingsIcon size={16} />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={16} />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </header>
      )}

      {user.role === 'admin' ? (
        <AdminDashboard apiBase={API_BASE} alreadyLoggedIn={true} />
      ) : isMobile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '2rem' }}>
          <div className="action-cards" style={{ flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto' }}>
            <Link to="/form" className="action-card new" style={{ padding: '2rem', background: 'rgba(15, 23, 55, 0.8)', borderColor: 'var(--border-glass)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                <span style={{ fontSize: '35px' }}>🚀</span>
              </div>
              <span className="action-text" style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Yeni Analiz Yap</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Yeni bir finansal risk değerlendirmesi başlatın</span>
            </Link>

            <Link to="/history" className="action-card history" style={{ padding: '2rem', marginTop: '1.2rem', background: 'rgba(15, 23, 55, 0.8)', borderColor: 'var(--border-glass)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                <span style={{ fontSize: '35px' }}>📊</span>
              </div>
              <span className="action-text" style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Geçmiş Analizlerim</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Önceki analiz sonuçlarınızı inceleyin</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* Slim Market Data Banner */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.8rem 1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
              <Activity size={18} /> Canlı Piyasa
            </div>
            {marketLoading ? (
              <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Yükleniyor...</span>
            ) : marketData ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🇺🇸 USD/TRY</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{marketData.USD}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🇪🇺 EUR/TRY</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{marketData.EUR}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🏦 TCMB Faiz</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>%{marketData.FAIZ}</span>
                </div>
              </div>
            ) : (
              <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Veri alınamadı</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

            <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#38bdf8', marginBottom: '0.5rem' }}>{totalAnalyses}</div>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>Toplam Analiz</div>
            </div>
            <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#a78bfa', marginBottom: '0.5rem' }}>%{avgRisk}</div>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>Ortalama Risk Skoru</div>
            </div>
            <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f472b6', marginBottom: '0.5rem' }}>%{lastRiskStr}</div>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>Son Risk Skoru</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* Feature 1: Risk Trend Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard-card"
            >
              <h3 className="dashboard-card-title">Risk Trend Grafiği</h3>
              <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
                 {history.length > 1 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                       <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                       <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `%${val}`} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                          itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                       />
                       <Line 
                          type="monotone" 
                          dataKey="risk" 
                          name="Risk Skoru"
                          stroke="#38bdf8" 
                          strokeWidth={4} 
                          dot={{ fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 2, r: 5 }} 
                          activeDot={{ r: 8, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={1500}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 ) : (
                   <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                     Grafik oluşturmak için en az 2 analiz yapmalısınız.
                   </div>
                 )}
              </div>
            </motion.div>

            {/* Feature 3: Recent Activity (Son İşlemler Özeti) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="dashboard-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h3 className="dashboard-card-title" style={{ margin: 0 }}>Son İşlemler Özeti</h3>
                 <Link to="/history" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    Tümünü Gör <ArrowRight size={16} />
                 </Link>
              </div>
              
              {history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '1rem',
                      border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease'
                    }} className="hover-highlight">
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: item.risk_level === 'high' ? 'rgba(244, 63, 94, 0.1)' : item.risk_level === 'medium' ? 'rgba(250, 204, 21, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: item.risk_level === 'high' ? '#f43f5e' : item.risk_level === 'medium' ? '#facc15' : '#10b981'
                          }}>
                             <Clock size={20} />
                          </div>
                          <div>
                             <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.2rem' }}>{item.risk_label || item.risk_level.toUpperCase()}</div>
                             <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                               {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                            %{(item.risk_probability * 100).toFixed(1)}
                          </div>
                          <button 
                            onClick={() => downloadSummaryPDF(item)}
                            style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                            title="PDF Olarak İndir"
                            className="hover-sky-blue"
                          >
                            <Download size={14} /> İndir
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                  Henüz bir analiz yapmadınız.
                </div>
              )}
            </motion.div>
          </div>

          {/* Action cards for Desktop */}
          <div className="action-cards" style={{ flexDirection: 'row', marginTop: '1.5rem' }}>
            <Link to="/form" className="action-card new">
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</span>
              <span className="action-text">Yeni Analiz</span>
            </Link>

            <Link to="/history" className="action-card history">
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>📊</span>
              <span className="action-text">Geçmiş Analizlerim</span>
            </Link>
          </div>
        </div>
      )}
      
      {/* AI Chatbot Assistant */}
      <Chatbot user={user} apiBase={API_BASE} />

      {/* Welcome Splash Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#050a1a', // var(--bg-primary)
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              style={{ textAlign: 'center' }}
            >
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '10px' }}>
                Hoşgeldin, <span style={{ color: '#38bdf8' }}>{user.name.split(' ')[0]}</span> 👋
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                Finansal verilerin hazırlanıyor...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
