import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Mail, Phone, User, Building, Calendar, X, Eye, MapPin, CreditCard, FileText, CheckCircle, Clock, Trash2, Ban, Edit } from 'lucide-react';
import { getStudents, getContracts, downloadContractPdf, updateStudent, deleteStudent } from '../../lib/api';
import { generateStudentPDF } from '../../lib/pdfGenerator';
import AddStudentModal from '../../components/AddStudentModal';
import EditStudentModal from '../../components/EditStudentModal';
import type { Student, Contract } from '../../types';

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToCancel, setStudentToCancel] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, contractsRes] = await Promise.all([
        getStudents(),
        getContracts()
      ]);
      setStudents(studentsRes.data);
      setContracts(contractsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (student: Student) => {
    const contract = contracts.find(c => c.student_id === student.id);

    if (contract) {
      // Use Laravel PDF endpoint for students with contracts
      try {
        const response = await downloadContractPdf(contract.id);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const pkg = student.package_type === 'pius-plus' ? 'PIUS_PLUS' : 'PIUS_PRO';
        link.download = `${pkg}_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading PDF:', err);
        // Fallback to frontend generator
        await generateStudentPDF(student, contract);
      }
    } else {
      // Use frontend generator for students without contracts
      await generateStudentPDF(student);
    }
  };

  const getStudentContract = (studentId: string) => {
    return contracts.find(c => c.student_id === studentId);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id);
      await loadData();
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelStudent = async () => {
    if (!studentToCancel) return;
    try {
      await updateStudent(studentToCancel.id, { status: 'cancelled' });
      await loadData();
      setShowCancelModal(false);
      setStudentToCancel(null);
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.company_name && student.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || student.payment_method === filterPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

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
      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Studenti</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <User className="h-4 w-4" />
            Dodaj studenta
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Pretraži
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ime, prezime, email..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
            >
              <option value="all">Svi statusi</option>
              <option value="enrolled">Upisani</option>
              <option value="contract_signed">Ugovor potpisan</option>
              <option value="completed">Završeni</option>
              <option value="cancelled">Otkazani</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Način plaćanja</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pius text-white"
            >
              <option value="all">Svi načini</option>
              <option value="full">Cjelokupno</option>
              <option value="installments">Na rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Registrovani studenti ({filteredStudents.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tip/Plaćanje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-pius/20 flex items-center justify-center">
                          {student.entity_type === 'individual' ? (
                            <User className="h-5 w-5 text-pius" />
                          ) : (
                            <Building className="h-5 w-5 text-pius" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {student.package_type === 'pius-plus' ? 'PIUS PLUS' : 'PIUS PRO'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      {student.email}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.entity_type === 'individual'
                          ? 'bg-gray-800/50 text-gray-300 border border-gray-600'
                          : 'bg-gray-700/50 text-gray-200 border border-gray-500'
                      }`}>
                        {student.entity_type === 'individual' ? 'Fizičko' : 'Pravno'}
                      </span>
                      <br />
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-800/50 text-gray-300 border border-gray-600">
                        {student.payment_method === 'full' ? 'Cjelokupno' : 'Na rate'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.payment_method === 'installments' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        student.paid_installments_count === student.total_installments
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : student.paid_installments_count && student.paid_installments_count > 0
                          ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                          : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}>
                        {student.payment_status || '0/3'}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'completed'
                        ? 'bg-gray-700/50 text-gray-200 border border-gray-500'
                        : student.status === 'contract_signed'
                        ? 'bg-pius/20 text-pius border border-pius/50'
                        : student.status === 'cancelled'
                        ? 'bg-red-900/30 text-red-400 border border-red-700'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-600'
                    }`}>
                      {student.status === 'enrolled' ? 'Upisan' :
                       student.status === 'contract_signed' ? 'Ugovor potpisan' :
                       student.status === 'cancelled' ? 'Otkazano' : 'Završen'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(student.enrolled_at).toLocaleDateString('sr-RS')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Pregledaj detalje"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setStudentToEdit(student); setShowEditModal(true); }}
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                        title="Uredi studenta"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(student); }}
                        className="text-pius hover:text-pius-dark transition-colors"
                        title="Preuzmi PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {student.status !== 'cancelled' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setStudentToCancel(student); setShowCancelModal(true); }}
                          className="text-yellow-500 hover:text-yellow-400 transition-colors"
                          title="Označi kao otkazano"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setStudentToDelete(student); setShowDeleteModal(true); }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title="Obriši studenta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-pius/20 flex items-center justify-center">
                    {selectedStudent.entity_type === 'individual' ? (
                      <User className="h-6 w-6 text-pius" />
                    ) : (
                      <Building className="h-6 w-6 text-pius" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedStudent.package_type === 'pius-plus' ? 'PIUS PLUS' : 'PIUS PRO'} •
                      {selectedStudent.entity_type === 'individual' ? ' Fizičko lice' : ' Pravno lice'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStudentToEdit(selectedStudent);
                      setShowEditModal(true);
                    }}
                    className="text-blue-500 hover:text-blue-400 transition-colors p-2"
                    title="Uredi studenta"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${
                    selectedStudent.status === 'completed'
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : selectedStudent.status === 'contract_signed'
                      ? 'bg-pius/20 text-pius border border-pius/50'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                  }`}>
                    {selectedStudent.status === 'enrolled' ? 'Upisan' :
                     selectedStudent.status === 'contract_signed' ? 'Ugovor potpisan' : 'Završen'}
                  </span>
                  <span className="text-sm text-gray-400">
                    Registrovan: {new Date(selectedStudent.enrolled_at).toLocaleDateString('sr-RS')}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Kontakt informacije
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-white">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telefon</p>
                      <p className="text-white">{selectedStudent.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Adresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 mb-1">Ulica i broj</p>
                      <p className="text-white">{selectedStudent.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Poštanski broj</p>
                      <p className="text-white">{selectedStudent.postal_code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Grad</p>
                      <p className="text-white">{selectedStudent.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Država</p>
                      <p className="text-white">{selectedStudent.country}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 mb-1">Broj ličnog dokumenta</p>
                      <p className="text-white">{selectedStudent.id_document_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Company Info (if applicable) */}
                {selectedStudent.entity_type === 'company' && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" /> Podaci o firmi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Naziv firme</p>
                        <p className="text-white">{selectedStudent.company_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">PDV broj</p>
                        <p className="text-white">{selectedStudent.vat_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Registracijski broj</p>
                        <p className="text-white">{selectedStudent.company_registration || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Adresa firme</p>
                        <p className="text-white">{selectedStudent.company_address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Poštanski broj</p>
                        <p className="text-white">{selectedStudent.company_postal_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Grad</p>
                        <p className="text-white">{selectedStudent.company_city || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Država</p>
                        <p className="text-white">{selectedStudent.company_country || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Plaćanje
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Paket</p>
                      <p className="text-white font-semibold">
                        {selectedStudent.package_type === 'pius-plus' ? 'PIUS PLUS - 1.800€' : 'PIUS PRO - 2.500€'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Način plaćanja</p>
                      <p className="text-white">
                        {selectedStudent.payment_method === 'full' ? 'Plaćanje u cjelosti' : 'Plaćanje na rate'}
                      </p>
                    </div>
                  </div>

                  {selectedStudent.payment_method === 'installments' && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Plan rata</p>
                      <div className="space-y-2 text-sm">
                        {selectedStudent.package_type === 'pius-plus' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">1. rata (24h od potpisa):</span>
                              <span className="text-white">400€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">2. rata (do 01.11.2025):</span>
                              <span className="text-white">500€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">3. rata (do 01.12.2025):</span>
                              <span className="text-white">900€</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">1. rata (24h od potpisa):</span>
                              <span className="text-white">500€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">2. rata (do 01.11.2025):</span>
                              <span className="text-white">1.000€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">3. rata (do 01.12.2025):</span>
                              <span className="text-white">1.000€</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment History - Invoices */}
                {selectedStudent.invoices && selectedStudent.invoices.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Historija uplata
                    </h3>
                    <div className="space-y-3">
                      {selectedStudent.invoices
                        .sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0))
                        .map((invoice) => (
                        <div
                          key={invoice.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            invoice.status === 'paid'
                              ? 'bg-green-900/20 border-green-700/50'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-900/20 border-yellow-700/50'
                              : 'bg-gray-700/30 border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {invoice.status === 'paid' ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-400" />
                            )}
                            <div>
                              <p className="text-white font-medium">
                                {invoice.installment_number ? `${invoice.installment_number}. rata` : invoice.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                Faktura: {invoice.invoice_number}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">€{Number(invoice.total_amount).toFixed(2).replace('.', ',')}</p>
                            <p className="text-xs text-gray-400">
                              {invoice.status === 'paid' && invoice.payment_date
                                ? `Plaćeno: ${new Date(invoice.payment_date).toLocaleDateString('de-AT')}`
                                : invoice.status === 'paid'
                                ? `Plaćeno: ${new Date(invoice.invoice_date).toLocaleDateString('de-AT')}`
                                : `Datum fakture: ${new Date(invoice.invoice_date).toLocaleDateString('de-AT')}`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      {(() => {
                        const totalPackagePrice = selectedStudent.package_type === 'pius-plus' ? 1800 : 2500;
                        const paidAmount = selectedStudent.invoices
                          .filter(inv => inv.status === 'paid')
                          .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
                        const remainingAmount = totalPackagePrice - paidAmount;

                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Ukupno plaćeno:</span>
                              <span className="text-green-400 font-bold text-lg">
                                €{paidAmount.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-gray-400">Preostalo:</span>
                              <span className={`font-bold text-lg ${remainingAmount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                €{remainingAmount.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* No Invoices Message */}
                {(!selectedStudent.invoices || selectedStudent.invoices.length === 0) && selectedStudent.payment_method === 'installments' && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Historija uplata
                    </h3>
                    <p className="text-gray-400 text-sm text-center py-4">
                      Nema evidentiranih uplata za ovog studenta.
                    </p>
                  </div>
                )}

                {/* Contract Info */}
                {getStudentContract(selectedStudent.id) && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-pius mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Ugovor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Broj ugovora</p>
                        <p className="text-white">{getStudentContract(selectedStudent.id)?.contract_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Datum potpisa</p>
                        <p className="text-white">
                          {(() => {
                            const contract = getStudentContract(selectedStudent.id);
                            return contract?.signed_at
                              ? new Date(contract.signed_at).toLocaleDateString('sr-RS')
                              : '-';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleDownloadPdf(selectedStudent)}
                    className="flex-1 bg-pius hover:bg-pius-dark text-black py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Preuzmi PDF
                  </button>
                  {selectedStudent.status !== 'cancelled' && (
                    <button
                      onClick={() => { setStudentToCancel(selectedStudent); setShowCancelModal(true); }}
                      className="flex-1 border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Ban className="h-5 w-5" />
                      Otkaži
                    </button>
                  )}
                  <button
                    onClick={() => { setStudentToDelete(selectedStudent); setShowDeleteModal(true); }}
                    className="flex-1 border border-red-600 text-red-400 hover:bg-red-900/20 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                    Obriši
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && studentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Obriši studenta?</h3>
                <p className="text-gray-400 mb-6">
                  Da li ste sigurni da želite obrisati studenta "{studentToDelete.first_name} {studentToDelete.last_name}"?
                  <br /><span className="text-red-400 text-sm">Ova akcija se ne može poništiti.</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-2 rounded-lg font-medium"
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && studentToCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                  <Ban className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Označi kao otkazano?</h3>
                <p className="text-gray-400 mb-6">
                  Da li ste sigurni da želite označiti studenta "{studentToCancel.first_name} {studentToCancel.last_name}" kao otkazanog?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-2 rounded-lg font-medium"
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleCancelStudent}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black py-2 rounded-lg font-medium"
                  >
                    Označi otkazano
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={showEditModal}
        student={studentToEdit}
        onClose={() => {
          setShowEditModal(false);
          setStudentToEdit(null);
        }}
        onSuccess={() => {
          loadData();
          setSelectedStudent(null);
        }}
      />
    </motion.div>
  );
}
