import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit3, Trash2, X, Save, DollarSign, Calendar, CheckCircle, FileText } from 'lucide-react';
import { getPackages, createPackage, updatePackage, deletePackage } from '../../lib/api';
import type { Package as PackageType, PackageInstallment } from '../../types';

export default function AdminPackages() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageType | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyPackage: Partial<PackageType> = {
    name: '',
    slug: '',
    price: 0,
    payment_type: 'fixed',
    description: '',
    is_active: true,
    show_on_landing: false,
    has_contract: true,
    duration_days: 60,
    features: [],
    contract_template: '',
    installments: [],
  };

  const [newPackage, setNewPackage] = useState<Partial<PackageType>>(emptyPackage);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await getPackages(true); // Include inactive packages for admin
      const packagesData = Array.isArray(res.data) ? res.data : [];
      setPackages(packagesData);
    } catch (err) {
      console.error('Error loading packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPackage(newPackage);
      await loadPackages();
      setShowCreateModal(false);
      setNewPackage(emptyPackage);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editingPackage) return;
    setSaving(true);
    try {
      await updatePackage(editingPackage.id, editingPackage);
      await loadPackages();
      setEditingPackage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    try {
      await deletePackage(packageToDelete.id);
      await loadPackages();
      setShowDeleteModal(false);
      setPackageToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const addFeature = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void) => {
    if (!newFeature.trim()) return;
    setFn({ ...pkg, features: [...(pkg.features || []), newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void, index: number) => {
    const features = [...(pkg.features || [])];
    features.splice(index, 1);
    setFn({ ...pkg, features });
  };

  const addInstallment = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void) => {
    const installments = pkg.installments || [];
    const newInst: Partial<PackageInstallment> = {
      installment_number: installments.length + 1,
      amount: 0,
      due_description: '',
    };
    setFn({ ...pkg, installments: [...installments, newInst as PackageInstallment] });
  };

  const updateInstallment = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void, index: number, field: keyof PackageInstallment, value: any) => {
    const installments = [...(pkg.installments || [])];
    installments[index] = { ...installments[index], [field]: value };
    setFn({ ...pkg, installments });
  };

  const removeInstallment = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void, index: number) => {
    const installments = [...(pkg.installments || [])];
    installments.splice(index, 1);
    installments.forEach((inst, i) => inst.installment_number = i + 1);
    setFn({ ...pkg, installments });
  };

  const renderPackageForm = (pkg: Partial<PackageType>, setFn: (p: Partial<PackageType>) => void) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Naziv kursa *</label>
          <input type="text" value={pkg.name || ''} onChange={(e) => setFn({ ...pkg, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="npr. Online Marketing Kurs" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cijena (€) *</label>
          <input type="number" value={pkg.price || ''} onChange={(e) => setFn({ ...pkg, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">URL slike (opciono)</label>
        <input type="text" value={pkg.image_url || ''} onChange={(e) => setFn({ ...pkg, image_url: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="https://example.com/slika.jpg" />
        {pkg.image_url && (
          <div className="mt-2">
            <img src={pkg.image_url} alt="Preview" className="h-20 w-auto rounded-lg object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tip plaćanja *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={pkg.payment_type === 'fixed'} onChange={() => setFn({ ...pkg, payment_type: 'fixed', installments: [] })} className="text-pius" />
            <span className="text-gray-300">Fiksna cijena (jednokratno)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={pkg.payment_type === 'installments'} onChange={() => setFn({ ...pkg, payment_type: 'installments' })} className="text-pius" />
            <span className="text-gray-300">Na rate</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Opis</label>
        <textarea value={pkg.description || ''} onChange={(e) => setFn({ ...pkg, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20" placeholder="Kratak opis kursa..." />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2 cursor-pointer bg-gray-800/50 p-3 rounded-lg">
          <input type="checkbox" checked={pkg.is_active ?? true} onChange={(e) => setFn({ ...pkg, is_active: e.target.checked })} className="w-4 h-4 text-pius" />
          <span className="text-sm text-gray-300">Aktivan</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer bg-gray-800/50 p-3 rounded-lg">
          <input type="checkbox" checked={pkg.show_on_landing ?? false} onChange={(e) => setFn({ ...pkg, show_on_landing: e.target.checked })} className="w-4 h-4 text-pius" />
          <span className="text-sm text-gray-300">Na početnoj</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer bg-gray-800/50 p-3 rounded-lg">
          <input type="checkbox" checked={pkg.has_contract ?? true} onChange={(e) => setFn({ ...pkg, has_contract: e.target.checked })} className="w-4 h-4 text-pius" />
          <span className="text-sm text-gray-300">Ima ugovor</span>
        </label>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Šta uključuje</label>
        <div className="space-y-2 mb-2">
          {pkg.features?.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-pius flex-shrink-0" />
              <span className="text-gray-300 flex-1">{feature}</span>
              <button type="button" onClick={() => removeFeature(pkg, setFn, i)} className="text-red-400 hover:text-red-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(pkg, setFn))} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Dodaj feature..." />
          <button type="button" onClick={() => addFeature(pkg, setFn)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Installments (if payment_type is installments) */}
      {pkg.payment_type === 'installments' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Rate plaćanja</label>
            <button type="button" onClick={() => addInstallment(pkg, setFn)} className="text-sm text-pius hover:text-pius-dark flex items-center gap-1">
              <Plus className="h-4 w-4" /> Dodaj ratu
            </button>
          </div>
          <div className="space-y-3">
            {pkg.installments?.map((inst, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-pius text-black px-2 py-1 rounded text-sm font-bold">{inst.installment_number}. rata</span>
                  <button type="button" onClick={() => removeInstallment(pkg, setFn, index)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Iznos (€)</label>
                    <input type="number" value={inst.amount || ''} onChange={(e) => updateInstallment(pkg, setFn, index, 'amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Rok (datum)</label>
                    <input type="date" value={inst.due_date || ''} onChange={(e) => updateInstallment(pkg, setFn, index, 'due_date', e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Opis roka</label>
                    <input type="text" value={inst.due_description || ''} onChange={(e) => updateInstallment(pkg, setFn, index, 'due_description', e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="npr. u roku od 48h od potpisivanja" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Template */}
      {pkg.has_contract && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Tekst ugovora
          </label>
          <textarea value={pkg.contract_template || ''} onChange={(e) => setFn({ ...pkg, contract_template: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-40 font-mono text-sm" placeholder="Unesite tekst ugovora... Koristite {ime}, {prezime}, {email}, {adresa}, {grad}, {drzava}, {cijena}, {datum} za placeholder-e." />
          <p className="text-xs text-gray-500 mt-1">Placeholder-i: {'{ime}'}, {'{prezime}'}, {'{email}'}, {'{adresa}'}, {'{grad}'}, {'{drzava}'}, {'{cijena}'}, {'{datum}'}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-pius" />
              Upravljanje kursevima
            </h2>
            <p className="text-gray-400 text-sm mt-1">Kreirajte i upravljajte kursevima, cijenama i ratama</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novi kurs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`bg-gray-900 border rounded-xl overflow-hidden ${pkg.is_active ? 'border-gray-800' : 'border-red-900/50 opacity-60'}`}>
            <div className="bg-gradient-to-r from-pius/20 to-pius-dark/20 px-6 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                    {pkg.show_on_landing && <span className="text-xs bg-pius/20 text-pius px-2 py-0.5 rounded">Početna</span>}
                    {!pkg.is_active && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Neaktivan</span>}
                  </div>
                  <p className="text-sm text-gray-400">{pkg.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingPackage(pkg)} className="p-2 border border-pius text-pius rounded-lg hover:bg-pius/10">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {!['pius-plus', 'pius-pro'].includes(pkg.slug) && (
                    <button onClick={() => { setPackageToDelete(pkg); setShowDeleteModal(true); }} className="p-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-pius" />
                  <span className="text-3xl font-bold text-white">{Number(pkg.price).toLocaleString()}€</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${pkg.payment_type === 'fixed' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                  {pkg.payment_type === 'fixed' ? 'Fiksna cijena' : 'Na rate'}
                </span>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Šta uključuje:</h4>
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 text-pius mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {pkg.features.length > 4 && <li className="text-xs text-gray-500">+{pkg.features.length - 4} više...</li>}
                  </ul>
                </div>
              )}

              {pkg.payment_type === 'installments' && pkg.installments && pkg.installments.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Plan rata
                  </h4>
                  <div className="space-y-2">
                    {pkg.installments.map((inst) => (
                      <div key={inst.id} className="flex justify-between items-center bg-gray-800/50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-300">{inst.installment_number}. rata</span>
                        <div className="text-right">
                          <span className="text-white font-semibold">{inst.amount}€</span>
                          <p className="text-xs text-gray-400">{inst.due_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Link za upis: <code className="bg-gray-800 px-2 py-0.5 rounded">/upis/{pkg.slug}</code>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Novi kurs</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="p-6">
                {renderPackageForm(newPackage, setNewPackage)}
                <div className="flex gap-3 pt-6 border-t border-gray-700 mt-6">
                  <button type="submit" disabled={saving || !newPackage.name} className="flex-1 bg-pius hover:bg-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save className="h-5 w-5" />{saving ? 'Kreiranje...' : 'Kreiraj kurs'}
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-lg font-medium">Odustani</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPackage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditingPackage(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Uredi: {editingPackage.name}</h2>
                <button onClick={() => setEditingPackage(null)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6">
                {renderPackageForm(editingPackage, (p) => setEditingPackage(p as PackageType))}
                <div className="flex gap-3 pt-6 border-t border-gray-700 mt-6">
                  <button type="submit" disabled={saving} className="flex-1 bg-pius hover:bg-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save className="h-5 w-5" />{saving ? 'Spremanje...' : 'Spremi promjene'}
                  </button>
                  <button type="button" onClick={() => setEditingPackage(null)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-lg font-medium">Odustani</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && packageToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Obriši kurs?</h3>
                <p className="text-gray-400 mb-6">Da li ste sigurni da želite obrisati kurs "{packageToDelete.name}"?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-2 rounded-lg font-medium">Odustani</button>
                  <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">Obriši</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
