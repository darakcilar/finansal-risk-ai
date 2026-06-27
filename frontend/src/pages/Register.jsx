import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, Smartphone } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    
    const result = await register(name, email, password);
    if (!result.success) {
      setError(result.error);
    } else {
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
            Finansın <br /><span className="gradient-text">Geleceğine</span> Adım Atın
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '3rem' }}>
            Hemen kayıt olun ve XAI (Açıklanabilir Yapay Zeka) teknolojisi ile finansal risk analizinde sınırları kaldırın.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="feature-card">
               <div className="feature-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                 <ShieldCheck size={24} />
               </div>
               <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Güvenli Altyapı</h3>
               <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>Tüm müşteri verileriniz en üst düzey endüstri standartlarıyla şifrelenir ve korunur.</p>
            </div>
            <div className="feature-card">
               <div className="feature-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                 <Smartphone size={24} />
               </div>
               <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kusursuz Deneyim</h3>
               <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>Gelişmiş kullanıcı arayüzümüz ile masaüstü veya mobilde benzersiz bir akıcılık yaşayın.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="auth-box"
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <div className="auth-header">
          <div style={{ fontSize: '60px', marginBottom: '15px', textAlign: 'center' }}>
            🏦
          </div>
          <h1 className="auth-title">Kayıt Ol</h1>
          <p className="auth-subtitle">Yeni bir hesap oluşturun</p>
        </div>

        <form onSubmit={handleRegister}>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="error-box">
              {error}
            </motion.div>
          )}

          <div className="form-group">
            <label>Ad Soyad</label>
            <div className="form-input-container">
              <User className="form-input-icon" size={20} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Adınız Soyadınız"
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-posta</label>
            <div className="form-input-container">
              <Mail className="form-input-icon" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="ornek@email.com"
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

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="auth-btn"
            style={{ background: 'linear-gradient(135deg, var(--accent-green), #0d9488)' }}
          >
            Hesap Oluştur
          </motion.button>
        </form>

        <div className="auth-footer">
          Zaten hesabınız var mı? <Link to="/login" className="auth-link" style={{ color: 'var(--accent-green)' }}>Giriş Yap</Link>
        </div>
        </motion.div>
      </div>
    </div>
  );
}
