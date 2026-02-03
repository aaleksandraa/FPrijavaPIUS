import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { ArrowLeft, FileText, Pen, Download, CheckCircle, Loader2, User, Mail, Phone, MapPin, Package as PackageIcon, CreditCard } from 'lucide-react';
import { createContract, previewContract, getStudent } from '../lib/api';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  id_document_number: string;
  entity_type: 'individual' | 'company';
  payment_method: 'full' | 'installments';
  package_type: string;
  package?: {
    id: string;
    name: string;
    price: string;
    discount_price?: string;
    installments?: Array<{
      id: string;
      installment_number: number;
      amount: string;
      due_description?: string;
    }>;
  };
  company_name?: string;
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_registration?: string;
}

export default function ContractPageNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [student, setStudent] = useState<Student | null>(null);
  const [contractText, setContractText] = useState('');
  const [contractAccepted, setContractAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    console.log('🔵 [CONTRACT] studentId from URL:', studentId);

    if (!studentId) {
      console.log('❌ [CONTRACT] No studentId, redirecting to /registracija');
      navigate('/registracija');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load student data
        console.log('🔵 [CONTRACT] Loading student data...');
        const studentResponse = await getStudent(studentId);
        setStudent(studentResponse.data);
        console.log('✅ [CONTRACT] Student loaded:', studentResponse.data);

        // Load contract template
        console.log('🔵 [CONTRACT] Loading contract template...');
        const contractResponse = await previewContract(studentId);
        setContractText(contractResponse.data.content);
        console.log('✅ [CONTRACT] Contract loaded');
      } catch (err: any) {
        console.error('❌ [CONTRACT] Error loading data:', err);
        setError('Greška pri učitavanju podataka. Molimo pokušajte ponovo.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, navigate]);

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Molimo potpišite ugovor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!studentId) {
      setError('Greška: Student ID nije pronađen');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const signatureData = signatureRef.current.toDataURL();
      await createContract({
        student_id: studentId,
        signature_data: signatureData,
      });

      console.log('✅ [CONTRACT] Contract signed successfully');
      navigate('/hvala', { state: { isContract: true, package: student?.package_type } });
    } catch (err: any) {
      console.error('❌ [CONTRACT] Error signing contract:', err);
      setError(err.response?.data?.message || 'Greška pri potpisivanju ugovora');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadContract = () => {
    if (!student) return;
    
    const element = document.createElement('a');
    const file = new Blob([contractText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ugovor_${student.first_name}_${student.last_name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-poppins flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-pius animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Učitavanje ugovora...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-black text-white font-poppins flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Greška pri učitavanju podataka</p>
          <button
            onClick={() => navigate('/registracija')}
            className="bg-pius text-black px-6 py-2 rounded-lg font-semibold"
          >
            Nazad na registraciju
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = student.package?.discount_price || student.package?.price || '0';

  return (
    <div className="min-h-screen bg-black text-white font-poppins py-12">
      <div className="max-w-5xl mx-auto px-4">
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
              <h1 className="text-2xl font-bold">Digitalno potpisivanje ugovora</h1>
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
                <strong>Greška:</strong> {error}
              </div>
            )}

            {/* Student Info Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <User className="h-5 w-5 text-pius mr-2" />
                Vaši podaci
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-pius mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Ime i prezime</div>
                    <div className="font-semibold">{student.first_name} {student.last_name}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-pius mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="font-semibold">{student.email}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-pius mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Telefon</div>
                    <div className="font-semibold">{student.phone}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-pius mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Adresa</div>
                    <div className="font-semibold">
                      {student.address}, {student.postal_code} {student.city}, {student.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Info Card */}
            {student.package && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <PackageIcon className="h-5 w-5 text-pius mr-2" />
                  Odabrani paket
                </h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-pius">{student.package.name}</div>
                    <div className="text-sm text-gray-400 mt-1">Obrazovni program</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-pius">€{Number(finalPrice).toFixed(0)}</div>
                    {student.package.discount_price && (
                      <div className="text-sm text-gray-500 line-through">€{Number(student.package.price).toFixed(0)}</div>
                    )}
                  </div>
                </div>

                {student.payment_method === 'installments' && student.package.installments && student.package.installments.length > 0 && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-pius mr-2" />
                      <h3 className="font-semibold">Plan plaćanja na rate</h3>
                    </div>
                    <div className="space-y-2">
                      {student.package.installments.map((inst) => (
                        <div key={inst.id} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {inst.installment_number === 1 ? 'Akontacija' : `${inst.installment_number}. rata`}
                            {inst.due_description && ` (${inst.due_description})`}:
                          </span>
                          <span className="font-semibold text-white">€{Number(inst.amount).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contract Text */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <FileText className="h-5 w-5 text-pius mr-2" />
                  Ugovor o prodaji obrazovnog programa
                </h2>
                <button
                  onClick={downloadContract}
                  className="flex items-center text-pius hover:text-pius-dark transition-colors text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Preuzmi
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-poppins leading-relaxed">
                  {contractText || 'Učitavanje ugovora...'}
                </pre>
              </div>
            </div>

            {/* Contract Acceptance */}
            <div className="mb-6">
              <label className="flex items-start p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/70 transition-colors">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mr-3 w-5 h-5 text-pius bg-gray-700 border-gray-600 rounded focus:ring-pius mt-0.5"
                />
                <div>
                  <div className="font-semibold text-white">Prihvatam uslove ugovora</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Pročitao/la sam i razumijem sve odredbe ugovora. Potvrđujem da su svi podaci tačni i da pristaj em na uslove plaćanja.
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
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Pen className="h-5 w-5 text-pius mr-2" />
                  Vaš digitalni potpis
                </h2>

                <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 mb-4 bg-gray-800/30">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 700,
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
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                  >
                    Obriši potpis
                  </button>
                  <button
                    type="button"
                    onClick={handleSign}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-pius to-pius-dark text-black py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center text-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Potpisivanje...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        POTPIŠI UGOVOR I ZAVRŠI
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-pius/10 border border-pius/30 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-pius mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-pius mb-2">Važne napomene:</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Potpisivanjem ovog ugovora prihvatate sve uslove navedene u dokumentu</li>
                    <li>• Ugovor će biti automatski sačuvan i poslat na vašu email adresu</li>
                    <li>• Prva rata dospijeva u roku od 24h od datuma potpisivanja ugovora</li>
                    <li>• Nakon potpisivanja, dobićete pristup obrazovnoj platformi</li>
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
