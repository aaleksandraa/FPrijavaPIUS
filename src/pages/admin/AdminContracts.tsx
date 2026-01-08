import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, FileText, Eye } from 'lucide-react';
import { getContracts, getStudents } from '../../lib/api';
import { generateStudentPDF } from '../../lib/pdfGenerator';
import type { Contract, Student } from '../../types';

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsRes, studentsRes] = await Promise.all([
        getContracts(),
        getStudents()
      ]);
      setContracts(contractsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (contract: Contract) => {
    const student = students.find(s => s.id === contract.student_id);
    if (student) {
      await generateStudentPDF(student, contract);
    }
  };

  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Contracts Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Digitalno potpisani ugovori ({contracts.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID Ugovora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tip ugovora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Datum potpisivanja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                    {contract.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {getStudentName(contract.student_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      contract.contract_type === 'individual'
                        ? 'bg-gray-800/50 text-gray-300 border border-gray-600'
                        : 'bg-gray-700/50 text-gray-200 border border-gray-500'
                    }`}>
                      {contract.contract_type === 'individual' ? 'Fizičko lice' : 'Pravno lice'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {contract.signed_at
                        ? new Date(contract.signed_at).toLocaleDateString('sr-RS')
                        : 'Nije potpisan'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Pregledaj ugovor"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(contract)}
                        className="text-pius hover:text-pius-dark transition-colors"
                        title="Preuzmi PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Preview Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="h-5 w-5 text-pius mr-2" />
                Pregled ugovora - {getStudentName(selectedContract.student_id)}
              </h3>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                {selectedContract.contract_content}
              </pre>

              {selectedContract.signature_data && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-pius mb-3">Digitalni potpis:</h4>
                  <img
                    src={selectedContract.signature_data}
                    alt="Potpis"
                    className="bg-white rounded-lg p-2 max-w-xs"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Potpisano: {selectedContract.signed_at
                      ? new Date(selectedContract.signed_at).toLocaleString('sr-RS')
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => handleDownloadPdf(selectedContract)}
                className="flex items-center px-4 py-2 bg-pius text-black rounded-lg font-medium hover:bg-pius-dark transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi PDF
              </button>
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
