import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Email envoy&eacute;</h2>
            <p className="text-gray-500 mb-8">
              Si un compte existe avec cette adresse email, vous recevrez un lien de r&eacute;initialisation
              dans quelques instants. Pensez &agrave; v&eacute;rifier vos spams.
            </p>
            <Link to="/login" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Retour &agrave; la connexion
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
              R&eacute;cup&eacute;ration de compte
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Nous vous aiderons &agrave; r&eacute;cup&eacute;rer l'acc&egrave;s &agrave; votre compte en toute s&eacute;curit&eacute;.
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

          <h2 className="text-xl font-semibold mb-2">Mot de passe oubli&eacute;</h2>
          <p className="text-gray-500 mb-8">
            Entrez votre adresse email et nous vous enverrons un lien de r&eacute;initialisation.
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Envoyer le lien
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link to="/login" className="text-define hover:underline font-medium flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour &agrave; la connexion
            </Link>
          </p>
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
            R&eacute;cup&eacute;ration de compte
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Nous vous aiderons &agrave; r&eacute;cup&eacute;rer l'acc&egrave;s &agrave; votre compte en toute s&eacute;curit&eacute;.
          </p>
        </div>
      </div>
    </div>
  );
}
