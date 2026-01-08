import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Plus, Edit3, Trash2, X, Save, Link, Eye, CheckCircle } from 'lucide-react';
import { getLandingPages, createLandingPage, updateLandingPage, deleteLandingPage, getPackages } from '../../lib/api';
import type { LandingPage, Package } from '../../types';

export default function AdminLandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [pageToDelete, setPageToDelete] = useState<LandingPage | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyPage: Partial<LandingPage> = {
    title: '',
    slug: '',
    intro_text: '',
    package_ids: [],
    is_active: true,
  };

  const [formData, setFormData] = useState<Partial<LandingPage>>(emptyPage);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagesRes, packagesRes] = await Promise.all([getLandingPages(), getPackages(true)]); // Include inactive packages for admin
      setPages(pagesRes.data);
      setPackages(packagesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormData(emptyPage);
    setShowModal(true);
  };

  const handleOpenEdit = (page: LandingPage) => {
    setEditingPage(page);
    setFormData(page);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPage) {
        await updateLandingPage(editingPage.id, formData);
      } else {
        await createLandingPage(formData);
      }
      await loadData();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;
    try {
      await deleteLandingPage(pageToDelete.id);
      await loadData();
      setShowDeleteModal(false);
      setPageToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePackage = (packageId: string) => {
    const ids = formData.package_ids || [];
    if (ids.includes(packageId)) {
      setFormData({ ...formData, package_ids: ids.filter(id => id !== packageId) });
    } else {
      setFormData({ ...formData, package_ids: [...ids, packageId] });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šś]/g, 's')
      .replace(/[žź]/g, 'z')
      .replace(/đ/g, 'd')
      .replace(/[äàáâã]/g, 'a')
      .replace(/[öòóôõ]/g, 'o')
      .replace(/[üùúû]/g, 'u')
      .replace(/[ëèéê]/g, 'e')
      .replace(/[ïìíî]/g, 'i')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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
              <Layout className="h-5 w-5 text-pius" />
              Landing stranice
            </h2>
            <p className="text-gray-400 text-sm mt-1">Kreirajte custom stranice za upis sa odabranim kursevima</p>
          </div>
          <button onClick={handleOpenCreate} className="px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova stranica
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Layout className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Nema landing stranica</h3>
          <p className="text-gray-500 mb-4">Kreirajte prvu landing stranicu za upis</p>
          <button onClick={handleOpenCreate} className="px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium">
            Kreiraj stranicu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pages.map((page) => (
            <div key={page.id} className={`bg-gray-900 border rounded-xl overflow-hidden ${page.is_active ? 'border-gray-800' : 'border-red-900/50 opacity-60'}`}>
              <div className="bg-gradient-to-r from-pius/20 to-pius-dark/20 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{page.title}</h3>
                      {!page.is_active && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Neaktivna</span>}
                    </div>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Link className="h-3 w-3" />
                      /{page.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800">
                      <Eye className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleOpenEdit(page)} className="p-2 border border-pius text-pius rounded-lg hover:bg-pius/10">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setPageToDelete(page); setShowDeleteModal(true); }} className="p-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {page.intro_text && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{page.intro_text}</p>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Kursevi ({page.package_ids.length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {page.package_ids.map((pkgId) => {
                      const pkg = packages.find(p => p.id === pkgId);
                      return pkg ? (
                        <span key={pkgId} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                          {pkg.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editingPage ? 'Uredi stranicu' : 'Nova stranica'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Naslov stranice *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: !editingPage ? generateSlug(title) : formData.slug
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="npr. Upis na kurs marketinga"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">URL slug *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/stranica/</span>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="marketing-kurs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Uvodni tekst</label>
                  <textarea
                    value={formData.intro_text || ''}
                    onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-32"
                    placeholder="Tekst koji će se prikazati iznad odabira kurseva..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Odaberi kurseve *</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {packages.filter(p => p.is_active).map((pkg) => (
                      <label
                        key={pkg.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          formData.package_ids?.includes(pkg.id)
                            ? 'border-pius bg-pius/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.package_ids?.includes(pkg.id) || false}
                          onChange={() => togglePackage(pkg.id)}
                          className="w-4 h-4 text-pius"
                        />
                        <div className="flex-1">
                          <span className="text-white font-medium">{pkg.name}</span>
                          <span className="text-gray-400 text-sm ml-2">€{Number(pkg.price).toLocaleString()}</span>
                          {pkg.payment_type === 'installments' && (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded ml-2">Na rate</span>
                          )}
                        </div>
                        {formData.package_ids?.includes(pkg.id) && (
                          <CheckCircle className="h-5 w-5 text-pius" />
                        )}
                      </label>
                    ))}
                  </div>
                  {packages.filter(p => p.is_active).length === 0 && (
                    <p className="text-gray-500 text-sm">Nema aktivnih kurseva. Kreirajte kurs prvo.</p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-gray-800/50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-pius"
                  />
                  <span className="text-sm text-gray-300">Stranica je aktivna</span>
                </label>

                <div className="flex gap-3 pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={saving || !formData.title || !formData.slug || !formData.package_ids?.length}
                    className="flex-1 bg-pius hover:bg-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Spremanje...' : editingPage ? 'Spremi promjene' : 'Kreiraj stranicu'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-lg font-medium">
                    Odustani
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && pageToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Obriši stranicu?</h3>
                <p className="text-gray-400 mb-6">Da li ste sigurni da želite obrisati stranicu "{pageToDelete.title}"?</p>
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
