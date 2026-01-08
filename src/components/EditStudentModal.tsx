import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Building, Loader2 } from 'lucide-react';
import { updateStudent, getPackages } from '../lib/api';
import type { Student, Package } from '../types';

interface Props {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStudentModal({ isOpen, student, onClose, onSuccess }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    id_document_number: '',
    entity_type: 'individual' as 'individual' | 'company',
    payment_method: 'installments' as 'full' | 'installments',
    package_type: '',
    status: 'enrolled' as 'enrolled' | 'contract_signed' | 'completed' | 'cancelled',
    company_name: '',
    vat_number: '',
    company_address: '',
    company_postal_code: '',
    company_city: '',
    company_country: '',
    company_registration: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        postal_code: student.postal_code || '',
        city: student.city || '',
        country: student.country || '',
        id_document_number: student.id_document_number || '',
        entity_type: student.entity_type || 'individual',
        payment_method: student.payment_method || 'installments',
        package_type: student.package_type || '',
        status: student.status || 'enrolled',
        company_name: student.company_name || '',
        vat_number: student.vat_number || '',
        company_address: student.company_address || '',
        company_postal_code: student.company_postal_code || '',
        company_city: student.company_city || '',
        company_country: student.company_country || '',
        company_registration: student.company_registration || '',
      });
    }
  }, [student]);

  const loadPackages = async () => {
    try {
      const res = await getPackages();
      setPackages(res.data.filter((p: Package) => p.is_active));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    
    setLoading(true);
    setError('');

    try {
      await updateStudent(student.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri ažuriranju studenta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-white">Uredi studenta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
              required
            >
              <option value="enrolled">Upisan</option>
              <option value="contract_signed">Ugovor potpisan</option>
              <option value="completed">Završen</option>
              <option value="cancelled">Otkazan</option>
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Tip registracije *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, entity_type: 'individual' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.entity_type === 'individual'
                    ? 'border-pius bg-pius/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <User className="h-6 w-6 mx-auto mb-2 text-pius" />
                <div className="text-white font-medium">Fizičko lice</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, entity_type: 'company' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.entity_type === 'company'
                    ? 'border-pius bg-pius/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Building className="h-6 w-6 mx-auto mb-2 text-pius" />
                <div className="text-white font-medium">Pravno lice</div>
              </button>
            </div>
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Kurs *</label>
            <select
              value={formData.package_type}
              onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
              required
            >
              <option value="">Odaberi kurs</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.slug}>
                  {pkg.name} - €{Number(pkg.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Način plaćanja *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'installments' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.payment_method === 'installments'
                    ? 'border-pius bg-pius/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">Na rate</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'full' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.payment_method === 'full'
                    ? 'border-pius bg-pius/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">U cjelosti</div>
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ime *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prezime *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Adresa *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Poštanski broj *</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Grad *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Država *</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Broj ličnog dokumenta *</label>
            <input
              type="text"
              value={formData.id_document_number}
              onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
              placeholder="Broj pasoša ili lične karte"
              required
            />
          </div>

          {/* Company Info */}
          {formData.entity_type === 'company' && (
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-pius">Podaci o firmi</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Naziv firme *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                    required={formData.entity_type === 'company'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">PDV broj</label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresa firme</label>
                <input
                  type="text"
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Poštanski broj</label>
                  <input
                    type="text"
                    value={formData.company_postal_code}
                    onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Grad</label>
                  <input
                    type="text"
                    value={formData.company_city}
                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Država</label>
                  <input
                    type="text"
                    value={formData.company_country}
                    onChange={(e) => setFormData({ ...formData, company_country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Registracijski broj</label>
                <input
                  type="text"
                  value={formData.company_registration}
                  onChange={(e) => setFormData({ ...formData, company_registration: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ažuriranje...
                </>
              ) : (
                'Sačuvaj izmjene'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
