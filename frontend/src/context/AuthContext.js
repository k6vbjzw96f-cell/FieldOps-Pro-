import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('fieldops_token');
      const storedUser = localStorage.getItem('fieldops_user');
      
      if (token && storedUser) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('fieldops_token');
          localStorage.removeItem('fieldops_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('fieldops_token', access_token);
    localStorage.setItem('fieldops_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { access_token, user: newUser } = response.data;
    
    localStorage.setItem('fieldops_token', access_token);
    localStorage.setItem('fieldops_user', JSON.stringify(newUser));
    setUser(newUser);
    
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('fieldops_token');
    localStorage.removeItem('fieldops_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
