import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Calendar, MessageCircle, CreditCard, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPackages } from '../lib/api';
import type { Package } from '../types';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isContract = false, package: selectedPackageSlug = '' } = location.state || {};
  
  const [packageData, setPackageData] = useState<Package | null>(null);

  useEffect(() => {
    const loadPackageData = async () => {
      if (!selectedPackageSlug) {
        return;
      }
      
      try {
        const res = await getPackages(true);
        const pkg = res.data.find((p: Package) => p.slug === selectedPackageSlug);
        setPackageData(pkg || null);
      } catch (err) {
        console.error('Failed to load package data:', err);
      }
    };
    
    loadPackageData();
  }, [selectedPackageSlug]);

  return (
    <div className="min-h-screen bg-black text-white font-poppins flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 border border-pius/30 rounded-2xl shadow-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-pius/20 border border-pius rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-pius" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-4">
            {isContract ? (
              <>
                <span className="text-pius">Ugovor uspješno potpisan!</span>
                <br />
                <span className="text-white">Dobrodošli u PIUS Academy</span>
              </>
            ) : (
              <>
                <span className="text-pius">Hvala na registraciji!</span>
                <br />
                <span className="text-white">Vaše mjesto je rezervisano</span>
              </>
            )}
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            {isContract
              ? 'Vaš ugovor je digitalno potpisan i sačuvan. Uskoro ćete dobiti email potvrdu.'
              : 'Uspješno ste se registrovali. Uskoro ćemo vam poslati sve potrebne informacije.'}
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center p-4 bg-gray-800/50 border border-pius/20 rounded-xl">
              <Mail className="h-6 w-6 text-pius mr-3" />
              <span className="text-gray-300">Provjerite email za potvrdu i instrukcije</span>
            </div>

            <div className="flex items-center p-4 bg-gray-800/50 border border-pius/20 rounded-xl">
              <MessageCircle className="h-6 w-6 text-pius mr-3" />
              <span className="text-gray-300">Uskoro ćete biti dodani u WhatsApp grupu</span>
            </div>

            {isContract && packageData && (
              <div className="flex items-center p-4 bg-gray-800/50 border border-pius/20 rounded-xl">
                <CreditCard className="h-6 w-6 text-pius mr-3" />
                <span className="text-gray-300">
                  Izvršite uplatu prve rate od €{packageData.installments?.[0]?.amount ? Number(packageData.installments[0].amount).toFixed(0) : '0'} u roku od 48h
                </span>
              </div>
            )}

            <div className="flex items-center p-4 bg-gray-800/50 border border-pius/20 rounded-xl">
              <Calendar className="h-6 w-6 text-pius mr-3" />
              <span className="text-gray-300">Bićete obaviješteni o detaljima početka kursa</span>
            </div>
          </div>

          {isContract && packageData && packageData.installments && packageData.installments.length > 0 && (
            <div className="bg-pius/10 border border-pius/30 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-pius mb-4 flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Detalji plaćanja - {packageData.name}
              </h3>
              <div className="space-y-3 text-sm">
                {packageData.installments.map((inst, index) => (
                  <div key={inst.id} className="flex justify-between">
                    <span className="text-gray-300">
                      {inst.installment_number === 1 ? 'Prva rata (kroz 48h)' : `${inst.installment_number}. rata`}
                      {inst.due_description && ` (${inst.due_description})`}:
                    </span>
                    <span className={`font-semibold ${index === 0 ? 'text-pius' : 'text-white'}`}>
                      €{Number(inst.amount).toFixed(0)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-pius/30 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-300">Ukupno:</span>
                    <span className="text-pius">€{Number(packageData.price).toFixed(0)}</span>
                  </div>
                </div>
                <div className="border-t border-pius/30 pt-3 mt-3">
                  <div className="text-xs text-gray-400 mb-2">Račun za uplate:</div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>IBAN: AT31 3225 0000 0196 4659</div>
                    <div>BIC: RLNWATWWGTD</div>
                    <div>Raiffeisen Regionalbank Mödling</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pius to-pius-dark text-black px-8 py-3 rounded-lg font-bold"
          >
            Povratak na početnu
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
