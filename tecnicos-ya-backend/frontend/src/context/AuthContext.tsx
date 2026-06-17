import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/src/services/api';
import { storage } from '@/src/utils/storage';

type User = {
  _id: string;
  email: string;
  full_name: string;
  role: 'client' | 'technician';
  rating_avg?: number;
  rating_count?: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('auth_token', null);
      const storedUser = await storage.getItem('auth_user', null);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      await storage.setItem('auth_token', response.access_token);
      await storage.setItem('auth_user', JSON.stringify(response.user));
      setToken(response.access_token);
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      await storage.setItem('auth_token', response.access_token);
      await storage.setItem('auth_user', JSON.stringify(response.user));
      setToken(response.access_token);
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  };

  const logout = async () => {
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}