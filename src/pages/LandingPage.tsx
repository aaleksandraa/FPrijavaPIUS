import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Calendar, Award, Clock, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPackages } from '../lib/api';
import type { Package } from '../types';

export default function LandingPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    const loadPackages = async () => {
      const CACHE_KEY = 'pius_packages_cache';
      const CACHE_TIMESTAMP_KEY = 'pius_packages_cache_timestamp';
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      const maxRetries = 5; // Increased from 3 to 5
      let attempt = 0;
      
      // Try to load from cache first
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp);
          if (age < CACHE_DURATION) {
            console.log('✅ Loading packages from cache (age: ' + Math.round(age / 1000) + 's)');
            const cached = JSON.parse(cachedData);
            setPackages(cached);
            setUsingCache(true);
            setLoading(false);
            // Continue loading from API in background to update cache
          }
        }
      } catch (err) {
        console.warn('Failed to load from cache:', err);
      }
      
      // Load from API with retry logic
      while (attempt < maxRetries) {
        try {
          attempt++;
          const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000); // Exponential backoff
          
          if (attempt > 1) {
            console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before attempt ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log(`🔄 [Attempt ${attempt}/${maxRetries}] Loading packages from API...`);
          
          const res = await getPackages();
          console.log('✅ API Response:', res.status);
          
          // Collect debug info
          const debug = {
            timestamp: new Date().toISOString(),
            attempt: attempt,
            maxRetries: maxRetries,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            url: window.location.href,
            apiResponse: res.status,
            dataType: typeof res.data,
            isArray: Array.isArray(res.data),
            dataLength: Array.isArray(res.data) ? res.data.length : 0,
            usingCache: usingCache,
          };
          setDebugInfo(JSON.stringify(debug, null, 2));
          
          // Check if data exists and is array
          if (!res.data || !Array.isArray(res.data)) {
            console.error('❌ Invalid response format:', res);
            
            // Retry if not last attempt
            if (attempt < maxRetries) {
              continue;
            }
            
            // Last attempt - show error
            console.error('❌ All attempts failed - invalid response format');
            setError('Nevažeći format podataka sa servera');
            setPackages([]);
            setLoading(false);
            return;
          }
          
          // Filter only PIUS packages with installments
          const piusPackages = res.data.filter((p: Package) => {
            const isPius = p.slug.toLowerCase().includes('pius');
            const hasInstallments = p.payment_type === 'installments';
            return hasInstallments && isPius;
          });
          
          console.log(`✅ Filtered ${piusPackages.length} PIUS packages`);
          
          if (piusPackages.length === 0) {
            // Retry if not last attempt
            if (attempt < maxRetries) {
              console.warn(`⚠️ No packages found, retrying...`);
              continue;
            }
            
            // Last attempt - show error
            console.error('❌ All attempts failed - no packages found');
            setError('Trenutno nema dostupnih paketa. Molimo kontaktirajte podršku.');
            setPackages([]);
            setLoading(false);
            return;
          }
          
          // Sort by price
          piusPackages.sort((a: Package, b: Package) => Number(a.price) - Number(b.price));
          
          // Save to cache
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(piusPackages));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
            console.log('💾 Saved to cache');
          } catch (err) {
            console.warn('Failed to save to cache:', err);
          }
          
          setPackages(piusPackages);
          setUsingCache(false);
          setLoading(false);
          setError(null);
          console.log('🎉 Packages loaded successfully!');
          return; // Success, exit loop
          
        } catch (err: any) {
          console.error(`❌ [Attempt ${attempt}/${maxRetries}] Failed:`, err.message);
          
          // Collect error debug info
          const errorDebug = {
            timestamp: new Date().toISOString(),
            attempt: attempt,
            maxRetries: maxRetries,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            url: window.location.href,
            errorMessage: err.message,
            errorStatus: err.response?.status,
            errorData: err.response?.data,
            usingCache: usingCache,
          };
          setDebugInfo(JSON.stringify(errorDebug, null, 2));
          
          // Retry if not last attempt
          if (attempt < maxRetries) {
            continue;
          }
          
          // Last attempt failed - show error if no cache
          if (!usingCache) {
            console.error('❌ All attempts failed - showing error screen');
            setError(`Greška pri učitavanju (${attempt} pokušaja): ${err.message}`);
            setPackages([]);
          }
          setLoading(false);
        }
      }
    };
    
    loadPackages();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-poppins">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pius rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-pius rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center bg-pius/10 border border-pius/30 rounded-full px-6 py-3 mb-6">
              <span className="text-pius font-semibold">POSEBNA PONUDA</span>
            </div>

            <h1 className="text-7xl md:text-9xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-pius to-white bg-clip-text text-transparent">
                PIUS
              </span>
              <br />
              <span className="text-pius">ACADEMY</span>
            </h1>

            <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transformišite svoju <span className="text-pius font-semibold">strast</span> u
              <span className="text-pius font-semibold"> profesiju</span> uz Željku Radičanin
            </p>

            {/* Package Cards */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 text-pius animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 max-w-2xl mx-auto">
                <p className="text-red-400 text-lg mb-2">⚠️ Paketi se nisu učitali</p>
                <p className="text-gray-400 text-sm mb-4">
                  {error || 'Molimo osvježite stranicu ili kontaktirajte podršku.'}
                </p>
                
                {/* Quick API Test Link */}
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
                  <p className="text-yellow-400 text-sm mb-2">🔍 Brzi test:</p>
                  <a
                    href="https://api.prijava.pius-academy.com/api/packages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pius underline text-sm hover:text-pius-dark"
                  >
                    Kliknite ovdje da testirate API direktno
                  </a>
                  <p className="text-gray-400 text-xs mt-2">
                    Ako vidite JSON podatke, problem je u browseru. Ako ne vidite ništa, problem je na serveru.
                  </p>
                </div>
                
                {/* Debug Info for User to Send */}
                <details className="mt-4 bg-black/50 rounded-lg p-4">
                  <summary className="cursor-pointer text-pius font-semibold mb-2">
                    📋 Kliknite ovdje za tehničke detalje (pošaljite ovo podršci)
                  </summary>
                  <pre className="text-xs text-gray-300 overflow-auto max-h-60 mt-2 p-2 bg-gray-900 rounded">
{debugInfo || 'Nema dostupnih informacija'}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(debugInfo);
                      alert('Kopirano! Možete poslati ovo na info@pius-academy.com');
                    }}
                    className="mt-2 px-4 py-2 bg-pius text-black rounded-lg text-sm font-bold hover:bg-pius-dark transition-colors"
                  >
                    �  Kopiraj detalje
                  </button>
                </details>
                
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-pius text-black rounded-lg font-bold hover:bg-pius-dark transition-colors"
                  >
                    🔄 Osvježi stranicu
                  </button>
                  <a
                    href="mailto:info@pius-academy.com?subject=Problem sa učitavanjem paketa&body=Molimo vas da riješite problem. Tehničke informacije:%0A%0A"
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
                  >
                    📧 Kontaktiraj podršku
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-gray-900 to-black border border-pius/30 rounded-3xl p-8"
                  >
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                    {pkg.description && (
                      <div className="text-gray-400 text-sm mb-4 whitespace-pre-line text-left">
                        {pkg.description}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      {pkg.discount_price ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl font-bold text-gray-500 line-through">€{Number(pkg.price).toFixed(0)}</span>
                          <span className="text-5xl font-black text-pius">€{Number(pkg.discount_price).toFixed(0)}</span>
                        </div>
                      ) : (
                        <div className="text-5xl font-black text-pius">€{Number(pkg.price).toFixed(0)}</div>
                      )}
                    </div>

                    {pkg.installments && pkg.installments.length > 0 && (
                      <div className="bg-pius/10 border border-pius/50 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-pius" />
                          <span className="text-pius font-bold">RATE BEZ KAMATA</span>
                          <Sparkles className="h-5 w-5 text-pius" />
                        </div>
                        <div className="space-y-2 text-sm">
                          {pkg.installments.map((inst) => (
                            <div key={inst.id} className="flex justify-between">
                              <span className="text-gray-400">
                                {inst.installment_number === 1 ? 'Prva rata' : `${inst.installment_number}. rata`}
                                {inst.due_description && ` (${inst.due_description})`}:
                              </span>
                              <span className={`font-bold ${inst.installment_number === 1 ? 'text-pius' : 'text-white'}`}>
                                €{Number(inst.amount).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/registracija')}
                      className="w-full bg-gradient-to-r from-pius to-pius-dark text-black px-6 py-3 rounded-full font-bold hover:shadow-2xl transition-all duration-300"
                    >
                      PRIJAVI SE SADA
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Cache/Error Indicator */}
            {(usingCache || error) && packages.length > 0 && (
              <div className="mt-4 text-center">
                {usingCache && (
                  <p className="text-xs text-gray-500">
                    💾 Učitano iz cache-a (ažurirano u pozadini)
                  </p>
                )}
                {error && (
                  <p className="text-xs text-yellow-500">
                    ⚠️ {error}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-pius mt-4">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Ograničen broj mjesta!</span>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-pius">15+</div>
                <div className="text-xs text-gray-400">godina iskustva</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pius">500+</div>
                <div className="text-xs text-gray-400">zadovoljnih klijentica</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pius">100%</div>
                <div className="text-xs text-gray-400">online fleksibilnost</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4 text-center">
            Šta uključuje <span className="text-pius">PIUS PLUS</span> paket?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {[
              { icon: Calendar, title: '60 dana edukacije', desc: 'Online kurs sa fleksibilnošću' },
              { icon: Award, title: 'Digitalni certifikat', desc: 'Priznati certifikat po završetku' },
              { icon: Users, title: 'Mentorska podrška', desc: 'Sedmični grupni pozivi' },
              { icon: Star, title: 'Premium materijali', desc: 'Video lekcije i WhatsApp grupa' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-black border border-pius/30 p-6 rounded-xl"
              >
                <item.icon className="h-10 w-10 text-pius mb-4" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* What You'll Learn */}
          <div className="bg-gradient-to-r from-pius/10 to-transparent border border-pius/30 p-8 rounded-2xl mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-pius">Šta ćete naučiti?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Tehnike rada i higijena',
                'Pigmentacija i teorija boja',
                'Analiza oblika lica',
                'Korištenje profesionalne opreme',
                'Praktični zadaci i demonstracije',
                'Izgradnja samopouzdanja',
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-pius mr-3" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Spremne ste za <span className="text-pius">transformaciju</span>?
          </h2>

          <div className="bg-pius/10 border border-pius rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-pius font-bold text-lg mb-2">EKSKLUZIVNO</div>
            <div className="text-white font-semibold">Plaćanje na 3 rate bez kamata</div>
            <div className="text-sm text-gray-300 mt-1">Počnite sa samo 400€</div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/registracija')}
            className="bg-gradient-to-r from-pius to-pius-dark text-black px-12 py-4 rounded-full text-xl font-bold"
          >
            PRIJAVI SE
          </motion.button>
        </div>
      </section>
    </div>
  );
}
