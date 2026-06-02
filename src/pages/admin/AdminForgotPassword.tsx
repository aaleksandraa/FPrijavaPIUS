import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { forgotPassword } from '../../lib/api';

interface ForgotPasswordForm {
  email: string;
}

export default function AdminForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(data.email);
      setMessage(response.data.message || 'Ako nalog postoji, poslali smo instrukcije za reset lozinke.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset trenutno nije moguce poslati.');
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
              <Mail className="h-8 w-8 text-pius" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Reset lozinke</h1>
            <p className="text-gray-400">Unesite admin email adresu.</p>
          </div>

          <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <Send className="h-5 w-5 mr-2" />
                  Posalji link
                </>
              )}
            </motion.button>
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
