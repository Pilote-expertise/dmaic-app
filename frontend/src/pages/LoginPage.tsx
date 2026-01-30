import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { LoginCredentials } from '@/types';

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      await login(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-define to-control flex items-center justify-center">
              <span className="text-white font-bold">6σ</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">DMAIC Manager</h1>
              <p className="text-gray-500 text-sm">Lean Six Sigma</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">Connexion</h2>
          <p className="text-gray-500 mb-8">
            Entrez vos identifiants pour accéder à votre espace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="votre@email.com"
                {...register('email', {
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                })}
              />
              {errors.email && (
                <p className="text-control text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Le mot de passe est requis',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-control text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-define hover:underline font-medium">
              Créer un compte
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Comptes de démonstration :</p>
            <p className="text-xs text-gray-500">Admin : admin@dmaic.local / admin123</p>
            <p className="text-xs text-gray-500">Chef projet : chef@dmaic.local / admin123</p>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sidebar-dark to-sidebar items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="flex justify-center gap-3 mb-8">
            {['D', 'M', 'A', 'I', 'C'].map((letter, i) => {
              const colors = ['bg-define', 'bg-measure', 'bg-analyze', 'bg-improve', 'bg-control'];
              return (
                <div
                  key={letter}
                  className={`w-16 h-16 ${colors[i]} rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Gérez vos projets d'amélioration continue
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Une plateforme complète pour piloter vos projets DMAIC, de la définition du problème
            jusqu'au contrôle des résultats.
          </p>
        </div>
      </div>
    </div>
  );
}
