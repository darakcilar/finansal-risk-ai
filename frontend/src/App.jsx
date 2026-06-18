import React, { useContext } from 'react';
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) return <div className="min-h-screen bg-[#050a1a] flex items-center justify-center text-white">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!user.hasSeenOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Auth Route Component (to prevent logged in users from seeing login/register)
const AuthRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) return <div className="min-h-screen bg-[#050a1a] flex items-center justify-center text-white">Yükleniyor...</div>;
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
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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