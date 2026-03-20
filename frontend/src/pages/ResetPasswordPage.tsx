import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Page de succès
  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Mot de passe modifié</h2>
            <p className="text-gray-500 mb-8">
              Votre mot de passe a été réinitialisé avec succès.
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Link to="/login" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Se connecter
            </Link>
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
              Compte sécurisé
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Votre compte est maintenant protégé par votre nouveau mot de passe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Page d'erreur (token manquant ou invalide)
  if (error && !token) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Lien invalide</h2>
            <p className="text-gray-500 mb-8">
              {error}
            </p>
            <Link to="/forgot-password" className="btn btn-primary w-full py-3">
              Demander un nouveau lien
            </Link>
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
              Réinitialisation du mot de passe
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Définissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-define to-control flex items-center justify-center">
              <span className="text-white font-bold">6&sigma;</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">DMAIC Manager</h1>
              <p className="text-gray-500 text-sm">Lean Six Sigma</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">Nouveau mot de passe</h2>
          <p className="text-gray-500 mb-8">
            Choisissez un mot de passe sécurisé d'au moins 8 caractères.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 8,
                      message: 'Le mot de passe doit contenir au moins 8 caractères',
                    },
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Veuillez confirmer le mot de passe',
                    validate: (value) =>
                      value === password || 'Les mots de passe ne correspondent pas',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-control text-sm mt-1">{errors.confirmPassword.message}</p>
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
                  Réinitialisation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Réinitialiser le mot de passe
                </span>
              )}
            </button>
          </form>
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
            Réinitialisation du mot de passe
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Définissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>
      </div>
    </div>
  );
}
