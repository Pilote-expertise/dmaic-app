import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dmaic_token');
      const savedUser = localStorage.getItem('dmaic_user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem('dmaic_user', JSON.stringify(currentUser));
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('dmaic_token');
          localStorage.removeItem('dmaic_user');
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user, token } = await authApi.login(credentials);
      localStorage.setItem('dmaic_token', token);
      localStorage.setItem('dmaic_user', JSON.stringify(user));
      setUser(user);
      toast.success(`Bienvenue, ${user.firstName} !`);
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { user, token } = await authApi.register(data);
      localStorage.setItem('dmaic_token', token);
      localStorage.setItem('dmaic_user', JSON.stringify(user));
      setUser(user);
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('dmaic_token');
    localStorage.removeItem('dmaic_user');
    setUser(null);
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('dmaic_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
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
