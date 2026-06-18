import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Activity, PieChart, Shield, Settings, LogOut, X } from 'lucide-react';

export default function WebDrawerMenu({ isOpen, onClose, user, handleLogout }) {
  const navigate = useNavigate();

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleMenuClick = (path) => {
    onClose();
    if (path) {
      navigate(path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(3px)',
              zIndex: 9999
            }}
          />

          {/* Drawer Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0, left: 0, bottom: 0,
              width: '80%', maxWidth: '300px',
              backgroundColor: 'var(--bg-primary, #050a1a)',
              borderRight: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
              zIndex: 10000,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--sky-blue, #38bdf8)', fontWeight: 'bold', margin: 0, marginBottom: '4px' }}>Finansal Risk AI</h3>
                <h2 style={{ fontSize: '1.4rem', color: 'white', fontWeight: '800', margin: 0 }}>{user?.name}</h2>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => handleMenuClick('/dashboard')} style={menuItemStyle}>
                <Home size={20} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                Ana Ekran
              </button>

              <button onClick={() => handleMenuClick('/market-data')} style={menuItemStyle}>
                <Activity size={20} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                Canlı Piyasa (TCMB)
              </button>

              <button onClick={() => handleMenuClick('/stats')} style={menuItemStyle}>
                <PieChart size={20} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                İstatistiklerim
              </button>

              {user?.role === 'admin' && (
                <button onClick={() => handleMenuClick('/admin')} style={menuItemStyle}>
                  <Shield size={20} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                  Yönetici Paneli
                </button>
              )}

              <button onClick={() => handleMenuClick('/settings')} style={menuItemStyle}>
                <Settings size={20} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                Ayarlar
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass, rgba(255,255,255,0.1))', paddingTop: '1rem', marginTop: 'auto' }}>
              <button 
                onClick={() => {
                  onClose();
                  handleLogout();
                }} 
                style={{ ...menuItemStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut size={20} style={{ marginRight: '1rem', color: '#f87171' }} />
                Çıkış Yap
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.02)',
  color: 'white',
  fontSize: '1rem',
  fontWeight: '500',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'background 0.2s'
};
