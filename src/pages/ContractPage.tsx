import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { ArrowLeft, FileText, Pen, Download, CheckCircle } from 'lucide-react';
import { createContract, previewContract } from '../lib/api';
import type { FormData } from '../types';

export default function ContractPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId, formData } = location.state as { studentId: string; formData: FormData } || {};

  const [contractText, setContractText] = useState('');
  const [contractAccepted, setContractAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!studentId) {
      navigate('/registracija');
      return;
    }

    previewContract(studentId)
      .then(res => setContractText(res.data.content))
      .catch(() => setError('Greška pri učitavanju ugovora'));
  }, [studentId, navigate]);

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Molimo potpišite ugovor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signatureData = signatureRef.current.toDataURL();
      await createContract({
        student_id: studentId,
        signature_data: signatureData,
      });

      navigate('/hvala', { state: { isContract: true, package: formData?.paket } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri potpisivanju ugovora');
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = () => {
    const element = document.createElement('a');
    const file = new Blob([contractText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ugovor_${formData?.ime}_${formData?.prezime}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-black text-white font-poppins py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-pius/30 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pius to-pius-dark text-black p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-black/70 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Nazad
              </button>
              <h2 className="text-2xl font-bold">Digitalno potpisivanje ugovora</h2>
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Contract Text */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 text-pius mr-2" />
                  Ugovor o prodaji kursa na rate
                </h3>
                <button
                  onClick={downloadContract}
                  className="flex items-center text-pius hover:text-pius-dark transition-colors"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Preuzmi
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-poppins leading-relaxed">
                  {contractText || 'Učitavanje...'}
                </pre>
              </div>
            </div>

            {/* Contract Acceptance */}
            <div className="mb-6">
              <label className="flex items-center p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/70 transition-colors">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mr-3 w-5 h-5 text-pius bg-gray-700 border-gray-600 rounded focus:ring-pius"
                />
                <div>
                  <div className="font-medium text-white">Prihvatam uslove ugovora</div>
                  <div className="text-sm text-gray-400">
                    Pročitao/la sam i razumijem sve odredbe ugovora
                  </div>
                </div>
              </label>
            </div>

            {/* Signature Area */}
            {contractAccepted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-gray-700 pt-8"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Pen className="h-5 w-5 text-pius mr-2" />
                  Vaš digitalni potpis
                </h3>

                <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 mb-4 bg-gray-800/30">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full bg-white rounded-lg',
                    }}
                    backgroundColor="white"
                    penColor="black"
                  />
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Obriši potpis
                  </button>
                  <button
                    type="button"
                    onClick={handleSign}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {loading ? 'Potpisivanje...' : 'POTPIŠI UGOVOR I ZAVRŠI'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-pius/10 border border-pius/30 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-pius mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-pius mb-2">Važne napomene:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Potpisivanjem ovog ugovora prihvatate sve uslove navedene u dokumentu</li>
                    <li>• Ugovor će biti automatski sačuvan i poslat na vašu email adresu</li>
                    <li>• Prva rata dospijeva u roku od 24h od datuma potpisivanja ugovora</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
