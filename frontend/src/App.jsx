import { useContext, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { AuthProvider, AuthContext } from './context/AuthContext';

import './App.css';

// Pages
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import MarketData from './pages/MarketData';
import Stats from './pages/Stats';
import FormPage from './pages/FormPage';

// Components
import AdminDashboard from './components/AdminDashboard';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5002'
).replace(/\/$/, '');

/**
 * Uygulama açılır açılmaz backend'i arka planda ısıtır.
 * Bu işlem kullanıcıyı bloklamaz.
 */
const BackendWarmup = () => {
  useEffect(() => {
    const controller = new AbortController();

    const warmupBackend = async () => {
      try {
        console.log('Backend warmup başlatıldı:', `${API_BASE_URL}/api/warmup`);

        const response = await fetch(`${API_BASE_URL}/api/warmup`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          console.log('Backend warmup tamamlandı.');
        } else {
          console.warn('Backend warmup başarılı dönmedi:', response.status);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Backend warmup hatası:', error.message);
        }
      }
    };

    warmupBackend();

    return () => {
      controller.abort();
    };
  }, []);

  return null;
};

const InitialLoadingScreen = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  let timeStatus = 'Oturum bilgileri kontrol ediliyor...';

  if (seconds >= 5 && seconds < 15) {
    timeStatus = `Sunucu hazırlanıyor... (${seconds} sn)`;
  } else if (seconds >= 15 && seconds < 30) {
    timeStatus = `Yapay zeka motoru hazırlanıyor... (${seconds} sn)`;
  } else if (seconds >= 30 && seconds < 45) {
    timeStatus = `XAI modülü hazırlanıyor, az kaldı... (${seconds} sn)`;
  } else if (seconds >= 45) {
    timeStatus = `Sistem son ayarlarını yapıyor, lütfen bekleyin... (${seconds} sn)`;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 35%), linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)',
        color: '#e5e7eb',
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          border: '5px solid rgba(148, 163, 184, 0.25)',
          borderTopColor: '#38bdf8',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px',
        }}
      />

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <h2
        style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
        }}
      >
        Finansal Risk AI
      </h2>

      <p
        style={{
          margin: 0,
          maxWidth: '520px',
          color: seconds >= 30 ? '#f59e0b' : '#94a3b8',
          fontSize: '15px',
          fontStyle: 'italic',
          transition: 'color 0.3s ease',
        }}
      >
        {timeStatus}
      </p>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <InitialLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.hasSeenOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <InitialLoadingScreen />;
  }

  if (user) {
    if (!user.hasSeenOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -12,
      }}
      transition={{
        duration: 0.22,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
};

function HomeRedirect() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <InitialLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.hasSeenOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function AppContent() {
  const location = useLocation();

  return (
    <>
      <BackendWarmup />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomeRedirect />
              </PageTransition>
            }
          />

          <Route
            path="/login"
            element={
              <PageTransition>
                <AuthRoute>
                  <Login />
                </AuthRoute>
              </PageTransition>
            }
          />

          <Route
            path="/register"
            element={
              <PageTransition>
                <AuthRoute>
                  <Register />
                </AuthRoute>
              </PageTransition>
            }
          />

          <Route
            path="/onboarding"
            element={
              <PageTransition>
                <Onboarding />
              </PageTransition>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/form"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <FormPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/risk-analysis"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <FormPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/analysis"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <FormPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/history"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/market"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <MarketData />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/market-data"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <MarketData />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/stats"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/settings"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/admin"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="*"
            element={
              <PageTransition>
                <HomeRedirect />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}