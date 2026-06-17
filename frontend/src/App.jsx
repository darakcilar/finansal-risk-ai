import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
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

function AppContent() {
  const { user } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      
      {/* Onboarding */}
      <Route path="/onboarding" element={
        <AuthContext.Consumer>
          {({ user }) => user ? (user.hasSeenOnboarding ? <Navigate to="/dashboard" replace /> : <Onboarding />) : <Navigate to="/login" replace />}
        </AuthContext.Consumer>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/form" element={user ? <FormPage user={user} /> : <Navigate to="/" />} />
      <Route path="/history" element={user ? <History user={user} /> : <Navigate to="/" />} />
      <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
      <Route path="/market-data" element={user ? <MarketData /> : <Navigate to="/" />} />
      <Route path="/stats" element={user ? <Stats user={user} /> : <Navigate to="/" />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
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