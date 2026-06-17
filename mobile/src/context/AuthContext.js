import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

// Backend API
const API_BASE = 'https://finansal-risk-ai.onrender.com/api'; 
// Eğer yerel test yapacaksanız bilgisayarınızın IP adresini kullanın (örn: 'http://192.168.1.x:5002/api')

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user');
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

  const login = async (email, password, role = 'user', rememberMe = true) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      if (data.success) {
        const userData = { ...data.user, hasSeenOnboarding: true, history: [] };
        if (rememberMe) {
          await AsyncStorage.setItem('@user', JSON.stringify(userData));
        }
        setUser(userData);
        await fetchUserHistory(data.user.id);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Giriş başarısız' };
      }
    } catch (e) {
      return { success: false, error: 'Sunucu bağlantı hatası (Backend çalışmıyor olabilir)' };
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
        await AsyncStorage.setItem('@user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Kayıt başarısız' };
      }
    } catch (e) {
      return { success: false, error: 'Sunucu bağlantı hatası (Backend çalışmıyor olabilir)' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const completeOnboarding = async () => {
    if (user) {
      const updatedUser = { ...user, hasSeenOnboarding: true };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const addHistoryItem = async (analysisResult) => {
    if (!user) return;
    
    const newItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...analysisResult
    };
    
    const updatedUser = { ...user, history: [newItem, ...(user.history || [])] };
    await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
    setUser(updatedUser);
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
