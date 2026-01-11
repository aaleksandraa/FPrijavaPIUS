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

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await getPackages();
        // Filter only PIUS packages with installments
        const piusPackages = res.data.filter((p: Package) => 
          p.payment_type === 'installments' && p.slug.startsWith('pius')
        );
        // Sort by price
        piusPackages.sort((a: Package, b: Package) => Number(a.price) - Number(b.price));
        setPackages(piusPackages);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
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
                      <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
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
