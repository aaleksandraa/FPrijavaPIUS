import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { createInvoice } from '../lib/api';
import type { Student } from '../types';

interface AddManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess: () => void;
}

export default function AddManualPaymentModal({ isOpen, onClose, student, onSuccess }: AddManualPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomNumber, setUseCustomNumber] = useState(false);
  
  const [formData, setFormData] = useState({
    installment_number: 1,
    total_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    invoice_date: new Date().toISOString().split('T')[0],
    custom_invoice_number: '',
    description: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createInvoice({
        student_id: student.id,
        installment_number: formData.installment_number,
        total_amount: parseFloat(formData.total_amount),
        payment_date: formData.payment_date,
        invoice_date: formData.invoice_date,
        description: formData.description || `${formData.installment_number}. rata`,
        notes: formData.notes,
        mark_as_paid: true,
        use_custom_number: useCustomNumber,
        custom_invoice_number: useCustomNumber ? formData.custom_invoice_number : undefined,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        installment_number: 1,
        total_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        invoice_date: new Date().toISOString().split('T')[0],
        custom_invoice_number: '',
        description: '',
        notes: '',
      });
      setUseCustomNumber(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri dodavanju plaćanja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-pius" />
                Dodaj ručno plaćanje
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400">Student:</p>
                <p className="text-white font-medium">{student.first_name} {student.last_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broj rate *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={formData.installment_number}
                  onChange={(e) => setFormData({ ...formData, installment_number: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Iznos (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  placeholder="740.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Datum fakture *
                </label>
                <input
                  type="date"
                  required
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Datum plaćanja *
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <input
                    type="checkbox"
                    checked={useCustomNumber}
                    onChange={(e) => setUseCustomNumber(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-800 text-pius focus:ring-pius"
                  />
                  Koristi custom broj fakture (npr. iz 2025)
                </label>
              </div>

              {useCustomNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom broj fakture *
                  </label>
                  <input
                    type="text"
                    required={useCustomNumber}
                    value={formData.custom_invoice_number}
                    onChange={(e) => setFormData({ ...formData, custom_invoice_number: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                    placeholder="2025/001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unesite broj fakture iz prošle godine (npr. 2025/001)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opis
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  placeholder="1. rata"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Napomena
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  placeholder="Plaćanje iz prošle godine..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Dodavanje...' : 'Dodaj plaćanje'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
