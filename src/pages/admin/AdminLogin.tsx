import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import { login } from '../../lib/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await login(data.email, data.password);
      localStorage.setItem('pius_admin_token', response.data.token);
      localStorage.setItem('pius_admin_session', JSON.stringify({
        ...response.data.user,
        loginTime: new Date().toISOString(),
      }));
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neispravni podaci za prijavu.');
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pius/20 border border-pius rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-pius" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              <span className="text-pius">PIUS</span> Admin
            </h1>
            <p className="text-gray-400">Prijavite se za pristup admin panelu</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register('email', { required: 'Email je obavezan' })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                placeholder="info@pius-academy.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Lozinka
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Lozinka je obavezna' })}
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

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Prijavite se
                </>
              )}
            </motion.button>
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
