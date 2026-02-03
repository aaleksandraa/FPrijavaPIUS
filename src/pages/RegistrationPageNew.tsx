import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, ArrowRight, User, Building, Loader2, Package as PackageIcon, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { createStudent, getPackages } from '../lib/api';
import type { FormData, Package as PackageType } from '../types';

// Simplified validation schema
const schema = yup.object({
  // Step 1: Basic Info
  ime: yup.string().required('Ime je obavezno'),
  prezime: yup.string().required('Prezime je obavezno'),
  email: yup.string().email('Email nije valjan').required('Email je obavezan'),
  telefon: yup.string().required('Telefon je obavezan'),
  adresa: yup.string().required('Adresa je obavezna'),
  postanskiBroj: yup.string().required('Poštanski broj je obavezan'),
  mjesto: yup.string().required('Mjesto je obavezno'),
  drzava: yup.string().required('Država je obavezna'),
  brojLicnogDokumenta: yup.string().required('Broj ličnog dokumenta je obavezan'),
  
  // Step 2: Entity Type & Payment
  tipLica: yup.string().oneOf(['fizicko', 'pravno']).required(),
  nacinPlacanja: yup.string().oneOf(['cjelokupno', 'rate']).required(),
  paket: yup.string().required('Paket je obavezan'),
  
  // Conditional: Company Info
  nazivFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Naziv firme je obavezan'),
  }),
  pdvBroj: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('PDV broj je obavezan'),
  }),
  adresaFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Adresa firme je obavezna'),
  }),
  postanskiBrojFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Poštanski broj firme je obavezan'),
  }),
  mjestoFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Mjesto firme je obavezno'),
  }),
  drzavaFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Država firme je obavezna'),
  }),
  registracijaFirme: yup.string().when('tipLica', {
    is: 'pravno',
    then: (s) => s.required('Registracijski broj je obavezan'),
  }),
});

export default function RegistrationPageNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0); // 3 steps: 0 (package), 1 (basic info), 2 (entity type)
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [error, setError] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  // Get nacinPlacanja from URL
  const nacinPlacanjaFromUrl = searchParams.get('nacinPlacanja') || 'rate';

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setPackagesLoading(true);
        const res = await getPackages();
        const piusPackages = res.data.filter((p: PackageType) => 
          p.payment_type === 'installments' && p.slug.startsWith('pius')
        );
        piusPackages.sort((a: PackageType, b: PackageType) => Number(a.price) - Number(b.price));
        setPackages(piusPackages);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setPackagesLoading(false);
      }
    };
    loadPackages();
  }, []);

  const { register, handleSubmit, watch, formState: { errors }, trigger, setValue } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      paket: packages[0]?.slug || 'pius-pro',
      tipLica: 'fizicko',
      nacinPlacanja: nacinPlacanjaFromUrl as 'cjelokupno' | 'rate',
    },
  });

  // Set default package when packages load
  useEffect(() => {
    if (packages.length > 0 && !watch('paket')) {
      setValue('paket', packages[0].slug);
    }
  }, [packages, setValue, watch]);

  const tipLica = watch('tipLica');
  const paket = watch('paket');

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    setError('');

    console.log('🔵 [REGISTRATION] Form submitted:', data);

    try {
      const response = await createStudent({
        first_name: data.ime,
        last_name: data.prezime,
        address: data.adresa,
        postal_code: data.postanskiBroj,
        city: data.mjesto,
        country: data.drzava,
        phone: data.telefon,
        email: data.email,
        id_document_number: data.brojLicnogDokumenta,
        entity_type: data.tipLica === 'fizicko' ? 'individual' : 'company',
        payment_method: data.nacinPlacanja === 'cjelokupno' ? 'full' : 'installments',
        package_type: data.paket,
        company_name: data.nazivFirme,
        vat_number: data.pdvBroj,
        company_address: data.adresaFirme,
        company_postal_code: data.postanskiBrojFirme,
        company_city: data.mjestoFirme,
        company_country: data.drzavaFirme,
        company_registration: data.registracijaFirme,
      });

      console.log('✅ [REGISTRATION] Student created:', response.data);

      // Navigate based on payment method
      if (data.nacinPlacanja === 'rate') {
        console.log('✅ [REGISTRATION] Navigating to contract page');
        navigate(`/ugovor?studentId=${response.data.id}`);
      } else {
        console.log('✅ [REGISTRATION] Navigating to thank you page');
        navigate('/hvala', { state: { isContract: false, package: data.paket } });
      }
    } catch (err: any) {
      console.error('❌ [REGISTRATION] Error:', err);
      console.error('❌ [REGISTRATION] Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Greška pri registraciji. Pokušajte ponovo.';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (step === 0) {
      // Step 0: Package Selection
      fieldsToValidate = ['paket'];
    } else if (step === 1) {
      // Step 1: Basic Info
      fieldsToValidate = ['ime', 'prezime', 'email', 'telefon', 'adresa', 'postanskiBroj', 'mjesto', 'drzava', 'brojLicnogDokumenta'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const togglePackageExpand = (pkgId: string) => {
    setExpandedPackages(prev => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  return (
    <div className="min-h-screen bg-black text-white font-poppins py-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-pius/30 rounded-2xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-400 hover:text-pius transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Nazad
            </button>
            <div className="text-sm text-gray-400">Korak {step + 1} od 3</div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
            <div
              className="bg-gradient-to-r from-pius to-pius-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
              <strong>Greška:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 0: Package Selection */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <PackageIcon className="h-6 w-6 text-pius" />
                  <h2 className="text-2xl font-bold">Odaberite paket</h2>
                </div>

                {packagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-pius animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packages.map((pkg, index) => {
                      const isExpanded = expandedPackages[pkg.id];
                      const isPremium = index === packages.length - 1;
                      const isSelected = paket === pkg.slug;
                      
                      return (
                        <label key={pkg.id} className="relative cursor-pointer">
                          <input type="radio" value={pkg.slug} {...register('paket')} className="sr-only" />
                          <div className={`border-2 rounded-2xl p-6 transition-all h-full ${
                            isSelected ? 'border-pius bg-pius/10 shadow-lg shadow-pius/20' : 'border-gray-700 hover:border-gray-600'
                          }`}>
                            {isPremium && (
                              <div className="absolute -top-3 right-4 bg-gradient-to-r from-pius to-pius-dark text-black px-3 py-1 rounded-full text-xs font-bold">
                                PREMIUM
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                              <div className="mb-3">
                                {pkg.discount_price ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl font-bold text-gray-500 line-through">€{Number(pkg.price).toFixed(0)}</span>
                                    <span className="text-4xl font-black text-pius">€{Number(pkg.discount_price).toFixed(0)}</span>
                                  </div>
                                ) : (
                                  <div className="text-4xl font-black text-pius">€{Number(pkg.price).toFixed(0)}</div>
                                )}
                              </div>
                              {pkg.description && (
                                <div className="text-sm text-gray-400 whitespace-pre-line text-left">
                                  {pkg.description}
                                </div>
                              )}
                            </div>
                            
                            {pkg.features && pkg.features.length > 0 && (
                              <div className="border-t border-gray-700 pt-4 mt-4">
                                {/* Mobile: Collapsible */}
                                <div className="md:hidden">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      togglePackageExpand(pkg.id);
                                    }}
                                    className="w-full flex items-center justify-between text-sm font-semibold text-pius mb-3 hover:text-pius-dark transition-colors"
                                  >
                                    <span>Šta dobijate:</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 animate-bounce" />
                                    )}
                                  </button>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="space-y-2 text-sm text-gray-300">
                                          {pkg.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                              <CheckCircle className="h-4 w-4 text-pius mt-0.5 flex-shrink-0" />
                                              <span>{feature}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                
                                {/* Desktop: Always visible */}
                                <div className="hidden md:block">
                                  <p className="text-sm font-semibold text-pius mb-3">Šta dobijate:</p>
                                  <div className="space-y-2 text-sm text-gray-300">
                                    {pkg.features.map((feature, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-pius mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={packagesLoading || !paket}
                  className="w-full mt-8 bg-gradient-to-r from-pius to-pius-dark text-black py-4 rounded-xl font-semibold flex items-center justify-center text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Nastavi <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </motion.div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold mb-6 text-center">Osnovni podaci</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ime *</label>
                    <input
                      {...register('ime')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="Vaše ime"
                    />
                    {errors.ime && <p className="text-red-400 text-sm mt-1">{errors.ime.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prezime *</label>
                    <input
                      {...register('prezime')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="Vaše prezime"
                    />
                    {errors.prezime && <p className="text-red-400 text-sm mt-1">{errors.prezime.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="vas@email.com"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                    <input
                      {...register('telefon')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="+387 xx xxx xxx"
                    />
                    {errors.telefon && <p className="text-red-400 text-sm mt-1">{errors.telefon.message}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Adresa *</label>
                  <input
                    {...register('adresa')}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    placeholder="Ulica i broj"
                  />
                  {errors.adresa && <p className="text-red-400 text-sm mt-1">{errors.adresa.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Poštanski broj *</label>
                    <input
                      {...register('postanskiBroj')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="88000"
                    />
                    {errors.postanskiBroj && <p className="text-red-400 text-sm mt-1">{errors.postanskiBroj.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mjesto *</label>
                    <input
                      {...register('mjesto')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="Mostar"
                    />
                    {errors.mjesto && <p className="text-red-400 text-sm mt-1">{errors.mjesto.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Država *</label>
                    <input
                      {...register('drzava')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                      placeholder="BiH"
                    />
                    {errors.drzava && <p className="text-red-400 text-sm mt-1">{errors.drzava.message}</p>}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Broj ličnog dokumenta *</label>
                  <input
                    {...register('brojLicnogDokumenta')}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    placeholder="Broj pasoša ili lične karte"
                  />
                  {errors.brojLicnogDokumenta && <p className="text-red-400 text-sm mt-1">{errors.brojLicnogDokumenta.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-pius to-pius-dark text-black py-4 rounded-xl font-semibold flex items-center justify-center text-lg hover:opacity-90 transition-opacity"
                >
                  Nastavi <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Entity Type & Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold mb-6 text-center">Tip registracije</h2>

                <div className="mb-8">
                  <label className="block text-lg font-medium mb-4">Registrujete se kao:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="cursor-pointer">
                      <input type="radio" value="fizicko" {...register('tipLica')} className="sr-only" />
                      <div className={`border-2 rounded-xl p-6 text-center transition-all ${
                        tipLica === 'fizicko' ? 'border-pius bg-pius/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <User className="h-10 w-10 mx-auto mb-3 text-pius" />
                        <div className="font-semibold text-lg">Fizičko lice</div>
                        <div className="text-sm text-gray-400 mt-1">Privatna osoba</div>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" value="pravno" {...register('tipLica')} className="sr-only" />
                      <div className={`border-2 rounded-xl p-6 text-center transition-all ${
                        tipLica === 'pravno' ? 'border-pius bg-pius/10' : 'border-gray-700 hover:border-gray-600'
                      }`}>
                        <Building className="h-10 w-10 mx-auto mb-3 text-pius" />
                        <div className="font-semibold text-lg">Pravno lice</div>
                        <div className="text-sm text-gray-400 mt-1">Firma/Kompanija</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Company Info (if pravno) */}
                {tipLica === 'pravno' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-pius mb-4">Podaci o firmi</h3>
                    
                    <div>
                      <input
                        {...register('nazivFirme')}
                        placeholder="Naziv firme *"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      {errors.nazivFirme && <p className="text-red-400 text-sm mt-1">{errors.nazivFirme.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          {...register('pdvBroj')}
                          placeholder="PDV broj *"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                        {errors.pdvBroj && <p className="text-red-400 text-sm mt-1">{errors.pdvBroj.message}</p>}
                      </div>
                      <div>
                        <input
                          {...register('registracijaFirme')}
                          placeholder="Registracijski broj *"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                        {errors.registracijaFirme && <p className="text-red-400 text-sm mt-1">{errors.registracijaFirme.message}</p>}
                      </div>
                    </div>

                    <div>
                      <input
                        {...register('adresaFirme')}
                        placeholder="Adresa firme *"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      {errors.adresaFirme && <p className="text-red-400 text-sm mt-1">{errors.adresaFirme.message}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          {...register('postanskiBrojFirme')}
                          placeholder="Poštanski broj *"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                        {errors.postanskiBrojFirme && <p className="text-red-400 text-sm mt-1">{errors.postanskiBrojFirme.message}</p>}
                      </div>
                      <div>
                        <input
                          {...register('mjestoFirme')}
                          placeholder="Mjesto *"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                        {errors.mjestoFirme && <p className="text-red-400 text-sm mt-1">{errors.mjestoFirme.message}</p>}
                      </div>
                      <div>
                        <input
                          {...register('drzavaFirme')}
                          placeholder="Država *"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                        {errors.drzavaFirme && <p className="text-red-400 text-sm mt-1">{errors.drzavaFirme.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 border border-gray-600 text-gray-300 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" /> Nazad
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-4 rounded-xl font-semibold flex items-center justify-center text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Registracija...
                      </>
                    ) : (
                      <>
                        Završi registraciju <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
