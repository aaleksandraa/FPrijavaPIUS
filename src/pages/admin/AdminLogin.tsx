import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import { getMe, login } from '../../lib/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    const authError = sessionStorage.getItem('pius_admin_auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('pius_admin_auth_error');
    }

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (email && token) {
      navigate(
        `/admin/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
        { replace: true }
      );
    }
  }, [navigate, searchParams]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await login(data.email, data.password);
      const token = response.data?.token;

      if (!token) {
        throw new Error('Login odgovor ne sadrzi token.');
      }

      localStorage.setItem('pius_admin_token', token);
      localStorage.setItem('pius_admin_session', JSON.stringify({
        ...response.data.user,
        loginTime: new Date().toISOString(),
      }));

      await getMe({ skipAuthRedirect: true });

      window.location.href = '/admin';
    } catch (err: any) {
      localStorage.removeItem('pius_admin_token');
      localStorage.removeItem('pius_admin_session');

      setError(
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Neispravni podaci za prijavu.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-poppins flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-pius/30 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pius/20 border border-pius rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-pius" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              <span className="text-pius">PIUS</span> Admin
            </h1>
            <p className="text-gray-400">Prijavite se za pristup admin panelu</p>
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onSubmit)(event);
            }}
            className="space-y-6"
          >
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email adresa
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Email je obavezan' })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                placeholder="info@pius-academy.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Lozinka
                </label>
                <Link to="/admin/forgot-password" className="text-sm text-pius hover:text-pius-light">
                  Zaboravili ste lozinku?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', { required: 'Lozinka je obavezana' })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white pr-12"
                  placeholder="Unesite lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Prijavite se
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">
              PIUS Academy Admin Panel - Sigurno okruženje
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
