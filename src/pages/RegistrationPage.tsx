import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, ArrowRight, User, Building, CreditCard, CheckCircle, Package, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { createStudent, getPackages } from '../lib/api';
import type { FormData, Package as PackageType } from '../types';

const schema = yup.object({
  paket: yup.string().required('Paket je obavezan'),
  ime: yup.string().required('Ime je obavezno'),
  prezime: yup.string().required('Prezime je obavezno'),
  adresa: yup.string().required('Adresa je obavezna'),
  postanskiBroj: yup.string().required('Poštanski broj je obavezan'),
  mjesto: yup.string().required('Mjesto je obavezno'),
  drzava: yup.string().required('Država je obavezna'),
  telefon: yup.string().required('Telefon je obavezan'),
  email: yup.string().email('Email nije valjan').required('Email je obavezan'),
  brojLicnogDokumenta: yup.string().required('Broj ličnog dokumenta je obavezan'),
  tipLica: yup.string().oneOf(['fizicko', 'pravno']).required(),
  nacinPlacanja: yup.string().oneOf(['cjelokupno', 'rate']).required(),
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

interface Props {
  preselectedPackage?: string;
}

export default function RegistrationPage({ preselectedPackage }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(preselectedPackage ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [error, setError] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const togglePackageExpand = (pkgId: string) => {
    setExpandedPackages(prev => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await getPackages(); // Only active packages
        // Filter only PIUS packages (main education packages) with installments
        const piusPackages = res.data.filter((p: PackageType) => 
          p.payment_type === 'installments' && p.slug.startsWith('pius')
        );
        // Sort by price: cheaper first (PIUS PRO before PIUS PRO + MASTER)
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
      paket: preselectedPackage || (packages[0]?.slug || ''),
      tipLica: 'fizicko',
      nacinPlacanja: 'rate',
    },
  });

  // Update default package when packages load
  useEffect(() => {
    if (!preselectedPackage && packages.length > 0 && !watch('paket')) {
      setValue('paket', packages[0].slug);
    }
  }, [packages, preselectedPackage, setValue, watch]);

  const paket = watch('paket');
  const selectedPackage = packages.find(p => p.slug === paket);
  const tipLica = watch('tipLica');
  const nacinPlacanja = watch('nacinPlacanja');

  const totalSteps = preselectedPackage ? 3 : 4;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    setError('');

    console.log('🔵 [DEBUG] Form submitted with data:', data);
    console.log('🔵 [DEBUG] Payment method:', data.nacinPlacanja);

    try {
      console.log('🔵 [DEBUG] Creating student...');
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

      console.log('✅ [DEBUG] Student created:', response.data);
      console.log('🔵 [DEBUG] Checking payment method for navigation...');

      if (data.nacinPlacanja === 'rate') {
        console.log('✅ [DEBUG] Payment method is "rate", navigating to /ugovor');
        console.log('🔵 [DEBUG] Student ID:', response.data.id);
        navigate('/ugovor', { state: { studentId: response.data.id, formData: data } });
        console.log('✅ [DEBUG] Navigate called successfully');
      } else {
        console.log('✅ [DEBUG] Payment method is "cjelokupno", navigating to /hvala');
        navigate('/hvala', { state: { isContract: false, package: data.paket } });
      }
    } catch (err: any) {
      console.error('❌ [DEBUG] Error creating student:', err);
      console.error('❌ [DEBUG] Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Greška pri registraciji. Pokušajte ponovo.');
    } finally {
      setLoading(false);
      console.log('🔵 [DEBUG] Loading set to false');
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (step === 0 && !preselectedPackage) {
      fieldsToValidate = ['paket'];
    } else if ((step === 1 && !preselectedPackage) || (step === 0 && preselectedPackage)) {
      fieldsToValidate = ['ime', 'prezime', 'adresa', 'postanskiBroj', 'mjesto', 'drzava', 'brojLicnogDokumenta'];
    } else if ((step === 2 && !preselectedPackage) || (step === 1 && preselectedPackage)) {
      if (tipLica === 'pravno') {
        fieldsToValidate = ['telefon', 'email', 'nazivFirme', 'pdvBroj', 'adresaFirme', 'postanskiBrojFirme', 'mjestoFirme', 'drzavaFirme', 'registracijaFirme'];
      } else {
        fieldsToValidate = ['telefon', 'email'];
      }
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => Math.min(s + 1, totalSteps - 1));
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

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
            <div className="text-sm text-gray-400">Korak {step + 1} od {totalSteps}</div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
            <div
              className="bg-gradient-to-r from-pius to-pius-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 0: Package Selection */}
            {step === 0 && !preselectedPackage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Package className="h-6 w-6 text-pius" />
                  <h2 className="text-xl font-semibold">Odaberite paket</h2>
                </div>

                {packagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-pius animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packages.map((pkg, index) => {
                      const isExpanded = expandedPackages[pkg.id];
                      const isPremium = index === packages.length - 1; // Last package (most expensive) is premium
                      
                      return (
                        <label key={pkg.id} className="relative cursor-pointer">
                          <input type="radio" value={pkg.slug} {...register('paket')} className="sr-only" />
                          <div className={`border-2 rounded-2xl p-6 transition-all h-full ${
                            paket === pkg.slug ? 'border-pius bg-pius/5' : 'border-gray-700 hover:border-gray-600'
                          }`}>
                            {isPremium && (
                              <div className="absolute -top-3 right-4 bg-gradient-to-r from-pius to-pius-dark text-black px-3 py-1 rounded-full text-xs font-bold">
                                PREMIUM
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <h3 className="text-2xl font-bold text-white mb-1">{pkg.name}</h3>
                              <div className="mb-1">
                                {pkg.discount_price ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl font-bold text-gray-500 line-through">€{Number(pkg.price).toFixed(0)}</span>
                                    <span className="text-3xl font-black text-pius">€{Number(pkg.discount_price).toFixed(0)}</span>
                                  </div>
                                ) : (
                                  <div className="text-3xl font-black text-pius">€{Number(pkg.price).toFixed(0)}</div>
                                )}
                              </div>
                              {pkg.description && (
                                <div className="text-sm text-gray-400 whitespace-pre-line text-left max-w-md mx-auto">
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

            {/* Step 1: Entity Type & Basic Info */}
            {((step === 1 && !preselectedPackage) || (step === 0 && preselectedPackage)) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-8">
                  <label className="block text-lg font-medium mb-4">Tip registracije</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="cursor-pointer">
                      <input type="radio" value="fizicko" {...register('tipLica')} className="sr-only" />
                      <div className={`border-2 rounded-xl p-6 text-center transition-all ${
                        tipLica === 'fizicko' ? 'border-pius bg-pius/10' : 'border-gray-700'
                      }`}>
                        <User className="h-8 w-8 mx-auto mb-3 text-pius" />
                        <div className="font-medium">Fizičko lice</div>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" value="pravno" {...register('tipLica')} className="sr-only" />
                      <div className={`border-2 rounded-xl p-6 text-center transition-all ${
                        tipLica === 'pravno' ? 'border-pius bg-pius/10' : 'border-gray-700'
                      }`}>
                        <Building className="h-8 w-8 mx-auto mb-3 text-pius" />
                        <div className="font-medium">Pravno lice</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ime *</label>
                    <input
                      {...register('ime')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    />
                    {errors.ime && <p className="text-red-400 text-sm mt-1">{errors.ime.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prezime *</label>
                    <input
                      {...register('prezime')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    />
                    {errors.prezime && <p className="text-red-400 text-sm mt-1">{errors.prezime.message}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Adresa *</label>
                  <input
                    {...register('adresa')}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                  />
                  {errors.adresa && <p className="text-red-400 text-sm mt-1">{errors.adresa.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Poštanski broj *</label>
                    <input
                      {...register('postanskiBroj')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    />
                    {errors.postanskiBroj && <p className="text-red-400 text-sm mt-1">{errors.postanskiBroj.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mjesto *</label>
                    <input
                      {...register('mjesto')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    />
                    {errors.mjesto && <p className="text-red-400 text-sm mt-1">{errors.mjesto.message}</p>}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Država *</label>
                  <input
                    {...register('drzava')}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                  />
                  {errors.drzava && <p className="text-red-400 text-sm mt-1">{errors.drzava.message}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Broj ličnog dokumenta (pasoš, lična karta) *</label>
                  <input
                    {...register('brojLicnogDokumenta')}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pius text-white"
                    placeholder="Unesite broj pasoša ili lične karte"
                  />
                  {errors.brojLicnogDokumenta && <p className="text-red-400 text-sm mt-1">{errors.brojLicnogDokumenta.message}</p>}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => preselectedPackage ? navigate('/') : prevStep()}
                    className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-lg font-medium flex items-center justify-center"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" /> Nazad
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center"
                  >
                    Nastavi <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Contact & Company Info */}
            {((step === 2 && !preselectedPackage) || (step === 1 && preselectedPackage)) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {tipLica === 'pravno' && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-pius">Podaci o firmi</h3>
                    <input
                      {...register('nazivFirme')}
                      placeholder="Naziv firme *"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    {errors.nazivFirme && <p className="text-red-400 text-sm mt-1">{errors.nazivFirme.message}</p>}
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
                    <input
                      {...register('adresaFirme')}
                      placeholder="Adresa firme *"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    {errors.adresaFirme && <p className="text-red-400 text-sm mt-1">{errors.adresaFirme.message}</p>}
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <input
                      {...register('drzavaFirme')}
                      placeholder="Država *"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    {errors.drzavaFirme && <p className="text-red-400 text-sm mt-1">{errors.drzavaFirme.message}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                    <input
                      {...register('telefon')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="+38x xx xxx xxx"
                    />
                    {errors.telefon && <p className="text-red-400 text-sm mt-1">{errors.telefon.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-lg font-medium flex items-center justify-center">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Nazad
                  </button>
                  <button type="button" onClick={nextStep} className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center">
                    Nastavi <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Method */}
            {((step === 3 && !preselectedPackage) || (step === 2 && preselectedPackage)) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-lg font-medium mb-4">
                  <CreditCard className="inline h-5 w-5 text-pius mr-2" />
                  Način plaćanja
                </label>

                <div className="space-y-4 mb-8">
                  <label className="block cursor-pointer">
                    <input type="radio" value="rate" {...register('nacinPlacanja')} className="sr-only" />
                    <div className={`border-2 rounded-xl p-6 transition-all ${
                      nacinPlacanja === 'rate' ? 'border-pius bg-pius/10' : 'border-gray-700'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-semibold text-lg">Plaćanje na rate</div>
                        <span className="bg-pius text-black px-3 py-1 rounded-full text-xs font-bold">PREPORUČENO</span>
                      </div>
                      {selectedPackage && selectedPackage.installments && selectedPackage.installments.length > 0 && (
                        <div className="mt-4 space-y-2 text-sm">
                          {selectedPackage.installments.map((inst) => (
                            <div key={inst.id} className="flex justify-between text-gray-300">
                              <span>
                                {inst.installment_number === 1 ? 'Akontacija' : `${inst.installment_number}. rata`}
                                {inst.due_description && ` (${inst.due_description})`}:
                              </span>
                              <span className="font-semibold">€{Number(inst.amount).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="block cursor-pointer">
                    <input type="radio" value="cjelokupno" {...register('nacinPlacanja')} className="sr-only" />
                    <div className={`border-2 rounded-xl p-6 transition-all ${
                      nacinPlacanja === 'cjelokupno' ? 'border-pius bg-pius/10' : 'border-gray-700'
                    }`}>
                      <div className="font-semibold text-lg">Plaćanje u cjelosti</div>
                      <div className="text-sm text-gray-300 mt-2">
                        Ukupno: {selectedPackage ? `€${Number(selectedPackage.price).toFixed(0)}` : ''} odmah
                      </div>
                    </div>
                  </label>
                </div>

                {/* Package info */}
                {selectedPackage && (
                  <div className="bg-gray-800/50 border border-pius/30 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 text-pius mr-2" />
                      Šta dobijate ({selectedPackage.name}):
                    </h4>
                    {selectedPackage.features && selectedPackage.features.length > 0 && (
                      <ul className="space-y-2 text-sm text-gray-300">
                        {selectedPackage.features.map((feature, i) => (
                          <li key={i} className={i === selectedPackage.features!.length - 1 && feature.includes('Startni paket') ? 'text-pius font-semibold' : ''}>
                            • {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-lg font-medium flex items-center justify-center">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Nazad
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {loading ? 'Učitavanje...' : nacinPlacanja === 'rate' ? 'Nastavi na ugovor' : 'Završi registraciju'}
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
