import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, User, Building, FileText, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import api from '../lib/api';
import type { Package as PackageType } from '../types';

export default function CourseRegistrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<PackageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', postal_code: '', city: '', country: 'Österreich', id_document_number: '',
    entity_type: 'individual' as 'individual' | 'company', company_name: '', vat_number: '', company_address: '', company_postal_code: '', company_city: '', company_country: '', company_registration: '',
  });

  useEffect(() => {
    const loadPackage = async () => {
      try {
        const res = await api.get(`/packages/slug/${slug}`);
        setPkg(res.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadPackage();
  }, [slug, navigate]);

  const handleSubmit = async () => {
    if (!pkg) return;
    setSubmitting(true);
    try {
      // Create student
      const studentRes = await api.post('/students', {
        ...formData,
        package_type: pkg.slug,
        payment_method: pkg.payment_type === 'installments' ? 'installments' : 'full',
        status: 'enrolled',
        enrolled_at: new Date().toISOString(),
      });

      // If has contract, create contract
      if (pkg.has_contract && signatureRef.current) {
        const signatureData = signatureRef.current.toDataURL();
        let contractContent = pkg.contract_template || '';
        contractContent = contractContent
          .replace(/{ime}/g, formData.first_name)
          .replace(/{prezime}/g, formData.last_name)
          .replace(/{email}/g, formData.email)
          .replace(/{adresa}/g, formData.address)
          .replace(/{postanskiBroj}/g, formData.postal_code)
          .replace(/{mjesto}/g, formData.city)
          .replace(/{grad}/g, formData.city)
          .replace(/{drzava}/g, formData.country)
          .replace(/{brojLicnogDokumenta}/g, formData.id_document_number)
          .replace(/{cijena}/g, `€${Number(pkg.price).toFixed(2)}`)
          .replace(/{datum}/g, new Date().toLocaleDateString('de-AT'));

        await api.post('/contracts', {
          student_id: studentRes.data.id,
          contract_type: formData.entity_type,
          contract_content: contractContent,
          signature_data: signatureData,
        });
      }

      navigate('/hvala');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-pius animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Kurs nije pronađen</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {/* Course Image */}
          {pkg.image_url && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={pkg.image_url} alt={pkg.name} className="w-full h-48 object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl font-bold text-pius mb-2">{pkg.name}</h1>
            {pkg.description && <p className="text-gray-400 mb-4">{pkg.description}</p>}
            <p className="text-2xl font-bold text-white">€{Number(pkg.price).toFixed(2)}</p>
            {pkg.payment_type === 'installments' && <p className="text-sm text-gray-400">Plaćanje na rate</p>}
          </div>

          {/* Features */}
          {pkg.features && pkg.features.length > 0 && (
            <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Šta uključuje:</h3>
              <ul className="space-y-2">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-pius mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, ...(pkg.has_contract ? [3] : [])].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-pius' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-pius bg-pius/20' : 'border-gray-600'}`}>
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              <span className="text-sm hidden sm:inline">{s === 1 ? 'Podaci' : s === 2 ? 'Pregled' : 'Ugovor'}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => setFormData({ ...formData, entity_type: 'individual' })} className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${formData.entity_type === 'individual' ? 'border-pius bg-pius/10 text-pius' : 'border-gray-700 text-gray-400'}`}>
                <User className="h-5 w-5" />Fizičko lice
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, entity_type: 'company' })} className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${formData.entity_type === 'company' ? 'border-pius bg-pius/10 text-pius' : 'border-gray-700 text-gray-400'}`}>
                <Building className="h-5 w-5" />Pravno lice
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ime *</label>
                <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prezime *</label>
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefon *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Adresa *</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Poštanski broj *</label>
                <input type="text" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grad *</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Država *</label>
                <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Broj ličnog dokumenta *</label>
                <input type="text" value={formData.id_document_number} onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
              </div>
            </div>

            {formData.entity_type === 'company' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Naziv firme *</label>
                    <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">PDV broj</label>
                    <input type="text" value={formData.vat_number} onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Adresa firme</label>
                  <input type="text" value={formData.company_address} onChange={(e) => setFormData({ ...formData, company_address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Poštanski broj</label>
                    <input type="text" value={formData.company_postal_code} onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Grad</label>
                    <input type="text" value={formData.company_city} onChange={(e) => setFormData({ ...formData, company_city: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Država</label>
                  <input type="text" value={formData.company_country} onChange={(e) => setFormData({ ...formData, company_country: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
              </>
            )}

            <button type="button" onClick={() => setStep(2)} disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.address || !formData.postal_code || !formData.city || !formData.id_document_number} className="w-full py-3 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4">
              Nastavi
            </button>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-pius">Pregled podataka</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Ime:</span> <span className="text-white ml-2">{formData.first_name}</span></div>
              <div><span className="text-gray-400">Prezime:</span> <span className="text-white ml-2">{formData.last_name}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{formData.email}</span></div>
              <div><span className="text-gray-400">Telefon:</span> <span className="text-white ml-2">{formData.phone}</span></div>
              <div className="col-span-2"><span className="text-gray-400">Adresa:</span> <span className="text-white ml-2">{formData.address}, {formData.postal_code} {formData.city}, {formData.country}</span></div>
              <div className="col-span-2"><span className="text-gray-400">Broj ličnog dokumenta:</span> <span className="text-white ml-2">{formData.id_document_number}</span></div>
              {formData.entity_type === 'company' && (
                <>
                  <div><span className="text-gray-400">Firma:</span> <span className="text-white ml-2">{formData.company_name}</span></div>
                  <div><span className="text-gray-400">PDV:</span> <span className="text-white ml-2">{formData.vat_number || '-'}</span></div>
                </>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Kurs:</span>
                <span className="text-white font-semibold">{pkg.name}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">Cijena:</span>
                <span className="text-pius font-bold text-xl">€{Number(pkg.price).toFixed(2)}</span>
              </div>
            </div>

            {pkg.features && pkg.features.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-2">Šta uključuje:</h4>
                <ul className="space-y-1">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-pius" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg font-medium">Nazad</button>
              <button type="button" onClick={() => pkg.has_contract ? setStep(3) : handleSubmit()} disabled={submitting} className="flex-1 py-3 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium disabled:opacity-50">
                {submitting ? 'Slanje...' : pkg.has_contract ? 'Nastavi na ugovor' : 'Potvrdi prijavu'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Contract */}
        {step === 3 && pkg.has_contract && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-pius flex items-center gap-2"><FileText className="h-5 w-5" />Ugovor</h3>

            <div className="bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap">
              {(pkg.contract_template || 'Tekst ugovora nije definisan.')
                .replace(/{ime}/g, formData.first_name)
                .replace(/{prezime}/g, formData.last_name)
                .replace(/{email}/g, formData.email)
                .replace(/{adresa}/g, formData.address)
                .replace(/{postanskiBroj}/g, formData.postal_code)
                .replace(/{mjesto}/g, formData.city)
                .replace(/{grad}/g, formData.city)
                .replace(/{drzava}/g, formData.country)
                .replace(/{brojLicnogDokumenta}/g, formData.id_document_number)
                .replace(/{cijena}/g, `€${Number(pkg.price).toFixed(2)}`)
                .replace(/{datum}/g, new Date().toLocaleDateString('de-AT'))}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Vaš potpis *</label>
              <div className="bg-white rounded-lg overflow-hidden">
                <SignatureCanvas ref={signatureRef} canvasProps={{ className: 'w-full h-40' }} />
              </div>
              <button type="button" onClick={() => signatureRef.current?.clear()} className="text-sm text-gray-400 hover:text-white mt-2">Obriši potpis</button>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg font-medium">Nazad</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || signatureRef.current?.isEmpty()} className="flex-1 py-3 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium disabled:opacity-50">
                {submitting ? 'Slanje...' : 'Potpiši i potvrdi'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
