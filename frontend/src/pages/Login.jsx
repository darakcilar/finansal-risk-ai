import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Zap, BarChart3 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState(localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState(localStorage.getItem('remembered_password') || '');
  const [error, setError] = useState('');
  const [role, setRole] = useState(localStorage.getItem('remembered_role') || 'user');
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('remembered_email') ? true : false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    
    const result = await login(email, password, role, rememberMe);
    if (!result.success) {
      setError(result.error);
    } else {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remembered_password', password);
        localStorage.setItem('remembered_role', role);
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remembered_password');
        localStorage.removeItem('remembered_role');
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Finansal Risk <br /><span className="gradient-text">Yapay Zeka</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '3rem' }}>
            Açıklanabilir Yapay Zeka (XAI) destekli güçlü motorumuz ile müşterilerinizin kredi risklerini saniyeler içinde analiz edin ve tamamen şeffaf kararlar alın.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="feature-card">
               <div className="feature-icon-wrapper">
                 <Zap size={24} />
               </div>
               <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Saniyeler İçinde Analiz</h3>
               <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>Karmaşık makine öğrenmesi algoritmaları saniyeler içinde kesin sonuç üretir.</p>
            </div>
            <div className="feature-card">
               <div className="feature-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                 <BarChart3 size={24} />
               </div>
               <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Şeffaf Kararlar</h3>
               <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>SHAP analizi ile kararların arkasındaki matematiksel nedenleri net bir şekilde görün.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="auth-box"
        >
          <div className="auth-header">
            <div style={{ fontSize: '60px', marginBottom: '15px', textAlign: 'center' }}>
              🏦
            </div>
            <h1 className="auth-title">Hoş Geldiniz</h1>
            <p className="auth-subtitle">Hesabınıza giriş yapın</p>
          </div>

          {/* Role Selection Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={() => setRole('user')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold',
                background: role === 'user' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                color: role === 'user' ? 'var(--sky-blue)' : 'var(--text-secondary)',
                border: role === 'user' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Kullanıcı
            </button>
            <button 
              type="button"
              onClick={() => setRole('admin')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold',
                background: role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                color: role === 'admin' ? 'var(--violet)' : 'var(--text-secondary)',
                border: role === 'admin' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Yönetici (Admin)
            </button>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="error-box">
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label>{role === 'admin' ? 'Kullanıcı Adı' : 'E-posta'}</label>
              <div className="form-input-container">
                {role === 'admin' ? (
                  <User className="form-input-icon" size={20} />
                ) : (
                  <Mail className="form-input-icon" size={20} />
                )}
                <input 
                  type={role === 'admin' ? 'text' : 'email'} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder={role === 'admin' ? "Yönetici Adı" : "ornek@email.com"}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <div className="form-input-container">
                <Lock className="form-input-icon" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '20px', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--sky-blue)', margin: 0 }}
              />
              <label htmlFor="rememberMe" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap', userSelect: 'none' }}>
                Beni Hatırla
              </label>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="auth-btn"
              style={role === 'admin' ? { background: 'linear-gradient(135deg, var(--violet), #d946ef)' } : {}}
            >
              Giriş Yap
            </motion.button>
          </form>

          {role === 'user' && (
            <div className="auth-footer">
              Hesabınız yok mu? <Link to="/register" className="auth-link">Kayıt Ol</Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
