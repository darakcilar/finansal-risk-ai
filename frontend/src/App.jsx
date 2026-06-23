import { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

// Pages
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import AdminDashboard from './components/AdminDashboard';
import Settings from './pages/Settings';
import MarketData from './pages/MarketData';
import Stats from './pages/Stats';
import FormPage from './pages/FormPage';

// ==========================================================================
// 🚀 YENİ: İLK AÇILIŞ (COLD START) AKILLI YÜKLEME EKRANI (GERÇEKÇİ SÜRELER)
// ==========================================================================
const InitialLoadingScreen = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 Gerçekçi Render (Cold Start) ve ML Modeli Yükleme Süreleri
  let timeStatus = "Sunucuya uyanma sinyali gönderiliyor..."; 
  
  if (seconds >= 5 && seconds < 15) {
    timeStatus = `Yapay zeka motoru (Cold Start) başlatılıyor... (${seconds} sn)`;
  } else if (seconds >= 15 && seconds < 30) {
    timeStatus = `Model ağırlıkları (Random Forest) belleğe yükleniyor... (${seconds} sn)`;
  } else if (seconds >= 30 && seconds < 45) {
    timeStatus = `XAI (SHAP) motoru hazırlanıyor, az kaldı... (${seconds} sn)`;
  } else if (seconds >= 45) {
    timeStatus = `Sistem son ayarlarını yapıyor, lütfen ayrılmayın... (${seconds} sn)`;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      {/* Dönen Çember (Spinner) Animasyonu */}
      <style>
        {`@keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <div style={{
        width: '55px', height: '55px',
        border: '4px solid rgba(56, 189, 248, 0.15)',
        borderTop: '4px solid #38bdf8',
        borderRadius: '50%',
        marginBottom: '25px',
        animation: 'spin-loader 1s linear infinite'
      }}></div>
      
      <h2 style={{ 
        color: '#ffffff', fontSize: '26px', fontWeight: 'bold', 
        margin: '0 0 12px 0', letterSpacing: '1px', fontFamily: 'sans-serif'
      }}>
        Finansal Risk AI
      </h2>
      
      <p style={{
        color: seconds >= 30 ? '#f59e0b' : '#94a3b8',
        fontSize: '15px', fontStyle: 'italic', margin: 0,
        transition: 'color 0.3s ease', fontFamily: 'sans-serif',
        textAlign: 'center', maxWidth: '80%'
      }}>
        {timeStatus}
      </p>
    </div>
  );
};
// ==========================================================================

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  
  // 🚀 SABİT YAZI YERİNE AKILLI SAYAÇ EKLENDİ
  if (isLoading) return <InitialLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!user.hasSeenOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Auth Route Component (to prevent logged in users from seeing login/register)
const AuthRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  
  // 🚀 SABİT YAZI YERİNE AKILLI SAYAÇ EKLENDİ
  if (isLoading) return <InitialLoadingScreen />;
  if (user) {
    if (!user.hasSeenOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Sayfa Geçişleri (Page Transitions) Wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
};

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<AuthRoute><PageTransition><Login /></PageTransition></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><PageTransition><Register /></PageTransition></AuthRoute>} />
        
        {/* Onboarding */}
        <Route path="/onboarding" element={
          <AuthContext.Consumer>
            {({ user }) => user ? (user.hasSeenOnboarding ? <Navigate to="/dashboard" replace /> : <PageTransition><Onboarding /></PageTransition>) : <Navigate to="/login" replace />}
          </AuthContext.Consumer>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/form" element={user ? <PageTransition><FormPage user={user} /></PageTransition> : <Navigate to="/" />} />
        <Route path="/history" element={user ? <PageTransition><History user={user} /></PageTransition> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <PageTransition><Settings /></PageTransition> : <Navigate to="/" />} />
        <Route path="/market-data" element={user ? <PageTransition><MarketData /></PageTransition> : <Navigate to="/" />} />
        <Route path="/stats" element={user ? <PageTransition><Stats user={user} /></PageTransition> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to="/dashboard" />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}