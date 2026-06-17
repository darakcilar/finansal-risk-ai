import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_BASE = 'https://finansal-risk-ai.onrender.com/api'; // Canlı sunucu

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = localStorage.getItem('@web_user') || sessionStorage.getItem('@web_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Refresh history from DB
        await fetchUserHistory(parsedUser.id);
      }
    } catch (e) {
      console.error("User check error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserHistory = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/user/history?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, history: data.history || [] } : null);
      }
    } catch (e) {
      console.error("History fetch error:", e);
    }
  };

  const login = async (email, password, role = 'user', rememberMe = false) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      if (data.success) {
        const userData = { ...data.user, hasSeenOnboarding: true, history: [] }; // Set default
        if (rememberMe) {
          localStorage.setItem('@web_user', JSON.stringify(userData));
        } else {
          sessionStorage.setItem('@web_user', JSON.stringify(userData));
        }
        setUser(userData);
        await fetchUserHistory(data.user.id);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Giriş başarısız' };
      }
    } catch (e) {
      return { success: false, error: 'Sunucu bağlantı hatası' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (data.success) {
        const userData = { ...data.user, hasSeenOnboarding: false, history: [] };
        localStorage.setItem('@web_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Kayıt başarısız' };
      }
    } catch (e) {
      return { success: false, error: 'Sunucu bağlantı hatası' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('@web_user');
      sessionStorage.removeItem('@web_user');
      setUser(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const completeOnboarding = () => {
    if (user) {
      const updatedUser = { ...user, hasSeenOnboarding: true };
      if (localStorage.getItem('@web_user')) localStorage.setItem('@web_user', JSON.stringify(updatedUser));
      else sessionStorage.setItem('@web_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const addHistoryItem = (analysisResult) => {
    if (!user) return;
    // We can also fetch history from server again, but optimistic update is faster
    const newItem = {
      id: Date.now().toString(), // Temp ID until next refresh
      date: new Date().toISOString(),
      ...analysisResult
    };
    
    setUser(prev => {
      const updatedUser = { ...prev, history: [newItem, ...(prev.history || [])] };
      if (localStorage.getItem('@web_user')) localStorage.setItem('@web_user', JSON.stringify(updatedUser));
      else sessionStorage.setItem('@web_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      completeOnboarding,
      addHistoryItem,
      fetchUserHistory
    }}>
      {children}
    </AuthContext.Provider>
  );
};
