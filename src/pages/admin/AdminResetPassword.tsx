import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { resetPassword } from '../../lib/api';

interface ResetPasswordForm {
  password: string;
  password_confirmation: string;
}

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const password = watch('password');
  const hasResetData = Boolean(email && token);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!hasResetData) {
      setError('Link za reset lozinke nije potpun.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await resetPassword(email, token, data.password, data.password_confirmation);
      setMessage(response.data.message || 'Lozinka je uspjesno promijenjena.');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Lozinku trenutno nije moguce promijeniti.'
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
              <KeyRound className="h-8 w-8 text-pius" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Nova lozinka</h1>
            <p className="text-gray-400">Postavite novu admin lozinku.</p>
          </div>

          <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!hasResetData && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                Link za reset lozinke nije potpun.
              </div>
            )}

            {message && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 text-green-300 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Nova lozinka
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Lozinka je obavezna',
                  minLength: { value: 8, message: 'Lozinka mora imati najmanje 8 karaktera' },
                })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                placeholder="Unesite novu lozinku"
                disabled={!hasResetData || Boolean(message)}
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Ponovite lozinku
              </label>
              <input
                type="password"
                {...register('password_confirmation', {
                  required: 'Potvrda lozinke je obavezna',
                  validate: value => value === password || 'Lozinke se ne poklapaju',
                })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                placeholder="Ponovite novu lozinku"
                disabled={!hasResetData || Boolean(message)}
              />
              {errors.password_confirmation && (
                <p className="text-red-400 text-sm mt-1">{errors.password_confirmation.message}</p>
              )}
            </div>

            {!message ? (
              <motion.button
                type="submit"
                disabled={loading || !hasResetData}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                ) : (
                  <>
                    <KeyRound className="h-5 w-5 mr-2" />
                    Promijeni lozinku
                  </>
                )}
              </motion.button>
            ) : (
              <Link
                to="/admin/login"
                className="w-full bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold flex items-center justify-center"
              >
                Idi na prijavu
              </Link>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <Link to="/admin/login" className="inline-flex items-center text-sm text-gray-400 hover:text-pius">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad na prijavu
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
