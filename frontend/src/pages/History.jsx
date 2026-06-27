import { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { History as HistoryIcon, Download } from 'lucide-react';
import { generateFullRiskReportPDF } from '../utils/pdfGenerator';

const API_BASE = 'https://finansal-risk-ai.onrender.com/api';

export default function History() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div className="dashboard-container">
      <header className="history-header">
        <Link to="/dashboard" className="back-btn-glass">
          <span style={{ fontSize: '18px' }}>←</span>
          Geri
        </Link>
        <h1 className="history-title">
          <HistoryIcon style={{ color: 'var(--violet)' }} /> Geçmiş Analizler
        </h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(!user.history || user.history.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', border: '1px dashed var(--border-glass)' }}>
            <div style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '1rem' }}>📭</div>
            <p style={{ color: 'var(--text-muted)' }}>Henüz geçmiş analiziniz bulunmuyor.</p>
          </div>
        ) : (
          user.history.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="history-item"
            >
              <div className="history-item-left">
                <div className="history-date">
                  {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`history-badge ${
                  item.risk_level === 'high' ? 'high' :
                  item.risk_level === 'medium' ? 'medium' : 'low'
                }`}>
                  {item.risk_label || item.risk_level.toUpperCase()}
                </div>
              </div>
              
              <div className="history-item-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>Risk Olasılığı:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                    %{(item.risk_probability * 100).toFixed(1)}
                  </span>
                </div>
                {index === 0 && (
                  <button 
                    onClick={() => downloadSummaryPDF(item)}
                    style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                    title="Bu analizin özet raporunu PDF olarak indir"
                  >
                    <Download size={16} /> İndir
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
