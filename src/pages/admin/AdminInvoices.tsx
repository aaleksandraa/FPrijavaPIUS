import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Download, X, Search, CheckCircle, Clock, XCircle, User, Trash2, UserPlus, Mail, Settings, Bell } from 'lucide-react';
import { getInvoices, getStudents, createInvoice, updateInvoice, deleteInvoice, downloadInvoicePdf, getPackages, createStudent, sendPaymentReminder, getSettings, updateSettings } from '../../lib/api';
import type { Invoice, Student, Package as PackageType } from '../../types';

type InvoiceMode = 'existing' | 'new';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState<InvoiceMode>('existing');
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [settings, setSettings] = useState({ payment_reminder_enabled: false, payment_reminder_days_before: 2, payment_reminder_email_template: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    description: '',
    total_amount: '',
    installment_number: '',
    notes: '',
    mark_as_paid: false,
  });

  const [newCustomer, setNewCustomer] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', country: 'Österreich',
    entity_type: 'individual' as 'individual' | 'company', company_name: '', vat_number: '',
    package_type: '', payment_method: 'full' as 'full' | 'installments',
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowStudentDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, studentsRes, packagesRes, settingsRes] = await Promise.all([getInvoices(), getStudents(), getPackages(true), getSettings()]); // Include inactive packages for admin
      setInvoices(invoicesRes.data);
      setAllStudents(studentsRes.data);
      setPackages(packagesRes.data);
      setSettings(settingsRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(studentSearchTerm.toLowerCase()) || student.email.toLowerCase().includes(studentSearchTerm.toLowerCase());
  });

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearchTerm(`${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
    setFormData(prev => ({ ...prev, student_id: student.id, installment_number: '', total_amount: '' }));
    
    const pkg = packages.find(p => p.slug === student.package_type);
    if (pkg) {
      // Ako je fiksno plaćanje, automatski postavi cijenu
      if (student.payment_method === 'full' || pkg.payment_type === 'fixed') {
        setFormData(prev => ({ 
          ...prev, 
          student_id: student.id, 
          description: `Kurs ${pkg.name}`,
          total_amount: pkg.price.toString()
        }));
      } else {
        // Ako je na rate, samo postavi opis
        setFormData(prev => ({ 
          ...prev, 
          student_id: student.id, 
          description: `Kurs ${pkg.name}`
        }));
      }
    }
  };

  const getPaidInstallments = (student: Student): number[] => {
    return student.invoices?.filter(inv => inv.status === 'paid' && inv.installment_number).map(inv => inv.installment_number!) || [];
  };

  const getAvailableInstallments = () => {
    if (!selectedStudent || selectedStudent.payment_method !== 'installments') return [];
    const paidInstallments = getPaidInstallments(selectedStudent);
    const pkg = packages.find(p => p.slug === selectedStudent.package_type);
    const totalInstallments = pkg?.installments?.length || 3;
    
    return Array.from({ length: totalInstallments }, (_, i) => {
      const installmentNumber = i + 1;
      const installment = pkg?.installments?.find(inst => inst.installment_number === installmentNumber);
      return {
        number: installmentNumber,
        disabled: paidInstallments.includes(installmentNumber),
        amount: installment?.amount || 0
      };
    });
  };

  const handleInstallmentSelect = (installmentNum: string) => {
    if (!selectedStudent) return;
    const pkg = packages.find(p => p.slug === selectedStudent.package_type);
    const installment = pkg?.installments?.find(i => i.installment_number === parseInt(installmentNum));
    if (installment && pkg) {
      setFormData(prev => ({ ...prev, installment_number: installmentNum, total_amount: installment.amount.toString(), description: `Kurs ${pkg.name} ${installmentNum}. Rata` }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let studentId = formData.student_id;
      if (invoiceMode === 'new') {
        const studentRes = await createStudent({ ...newCustomer, status: 'enrolled', enrolled_at: new Date().toISOString() });
        studentId = studentRes.data.id;
      }
      await createInvoice({ ...formData, student_id: studentId, total_amount: parseFloat(formData.total_amount), installment_number: formData.installment_number ? parseInt(formData.installment_number) : null });
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const resetForm = () => {
    setFormData({ student_id: '', invoice_date: new Date().toISOString().split('T')[0], description: '', total_amount: '', installment_number: '', notes: '', mark_as_paid: false });
    setNewCustomer({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', country: 'Österreich', entity_type: 'individual', company_name: '', vat_number: '', package_type: '', payment_method: 'full' });
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setInvoiceMode('existing');
  };

  const handleDeleteClick = (invoice: Invoice) => { setInvoiceToDelete(invoice); setShowDeleteModal(true); };
  const handleDeleteConfirm = async () => { if (!invoiceToDelete) return; try { await deleteInvoice(invoiceToDelete.id); await loadData(); setShowDeleteModal(false); setInvoiceToDelete(null); } catch (err) { console.error(err); } };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const response = await downloadInvoicePdf(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${invoice.invoice_number.replace('/', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try { await updateInvoice(invoice.id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] }); await loadData(); } catch (err) { console.error(err); }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    setSendingReminder(invoice.id);
    try {
      await sendPaymentReminder(invoice.id);
      alert('Podsjetnik uspješno poslan!');
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Greška pri slanju podsjetnika. Provjerite SMTP konfiguraciju.';
      alert(errorMsg);
    } finally {
      setSendingReminder(null);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings);
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-700"><CheckCircle className="h-3 w-3" /> Plaćeno</span>;
      case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700"><Clock className="h-3 w-3" /> Na čekanju</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-900/30 text-red-400 border border-red-700"><XCircle className="h-3 w-3" /> Otkazano</span>;
      default: return null;
    }
  };

  const fixedPackages = packages.filter(p => p.payment_type === 'fixed');

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2"><FileText className="h-5 w-5 text-pius" />Fakture</h2>
            <p className="text-gray-400 text-sm mt-1">Upravljanje fakturama i praćenje plaćanja</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettingsModal(true)} className="p-2 border border-gray-700 hover:border-pius text-gray-400 hover:text-pius rounded-lg" title="Postavke podsjetnika">
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-pius hover:bg-pius-dark text-black rounded-lg font-medium flex items-center gap-2"><Plus className="h-5 w-5" />Nova faktura</button>
          </div>
        </div>
        {settings.payment_reminder_enabled && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-2">
            <Bell className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">Automatski podsjetnici su uključeni ({settings.payment_reminder_days_before} dana prije roka)</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pretraži po imenu ili broju fakture..." className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
            <option value="all">Svi statusi</option>
            <option value="pending">Na čekanju</option>
            <option value="paid">Plaćeno</option>
            <option value="cancelled">Otkazano</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Br. fakture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kupac</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Opis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Iznos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-pius">{invoice.invoice_number}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="text-white">{invoice.student?.first_name} {invoice.student?.last_name}</span></div></td>
                  <td className="px-6 py-4"><span className="text-gray-300">{invoice.description}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-white font-semibold">€{Number(invoice.total_amount).toFixed(2)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{new Date(invoice.invoice_date).toLocaleDateString('de-AT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownloadPdf(invoice)} className="p-2 text-pius hover:bg-pius/10 rounded-lg" title="Preuzmi PDF"><Download className="h-4 w-4" /></button>
                      {invoice.status === 'pending' && (
                        <>
                          <button onClick={() => handleSendReminder(invoice)} disabled={sendingReminder === invoice.id} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg disabled:opacity-50" title="Pošalji podsjetnik">
                            <Mail className={`h-4 w-4 ${sendingReminder === invoice.id ? 'animate-pulse' : ''}`} />
                          </button>
                          <button onClick={() => handleMarkAsPaid(invoice)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg" title="Označi kao plaćeno"><CheckCircle className="h-4 w-4" /></button>
                        </>
                      )}
                      <button onClick={() => handleDeleteClick(invoice)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Obriši fakturu"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreateModal(false); resetForm(); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nova faktura</h2>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Mode Selection */}
                <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                  <button type="button" onClick={() => { setInvoiceMode('existing'); resetForm(); }} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${invoiceMode === 'existing' ? 'bg-pius text-black' : 'text-gray-400 hover:text-white'}`}>
                    <User className="h-4 w-4" />Postojeći kupac
                  </button>
                  <button type="button" onClick={() => { setInvoiceMode('new'); setSelectedStudent(null); setStudentSearchTerm(''); }} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${invoiceMode === 'new' ? 'bg-pius text-black' : 'text-gray-400 hover:text-white'}`}>
                    <UserPlus className="h-4 w-4" />Novi kupac
                  </button>
                </div>

                {invoiceMode === 'existing' && (
                  <>
                    <div ref={dropdownRef} className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Kupac *</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" value={studentSearchTerm} onChange={(e) => { setStudentSearchTerm(e.target.value); setShowStudentDropdown(true); setSelectedStudent(null); setFormData(prev => ({ ...prev, student_id: '' })); }} onFocus={() => setShowStudentDropdown(true)} placeholder="Pretraži kupca..." className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                      {showStudentDropdown && filteredStudents.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredStudents.slice(0, 10).map((student) => (
                            <button key={student.id} type="button" onClick={() => handleStudentSelect(student)} className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">{student.first_name} {student.last_name}</p>
                                <p className="text-gray-400 text-sm">{student.email}</p>
                              </div>
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{student.payment_method === 'installments' ? 'Rate' : 'Fiksno'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedStudent && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-pius mb-2">Podaci kupca</h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>{selectedStudent.first_name} {selectedStudent.last_name}</p>
                          <p>{selectedStudent.address}, {selectedStudent.postal_code} {selectedStudent.city}, {selectedStudent.country}</p>
                          <p>{selectedStudent.email}</p>
                          <p className="text-pius font-semibold">{packages.find(p => p.slug === selectedStudent.package_type)?.name || selectedStudent.package_type}</p>
                        </div>
                      </div>
                    )}

                    {selectedStudent?.payment_method === 'installments' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rata</label>
                        <select value={formData.installment_number} onChange={(e) => handleInstallmentSelect(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                          <option value="">Odaberi ratu...</option>
                          {getAvailableInstallments().map(({ number, disabled, amount }) => (
                            <option key={number} value={number} disabled={disabled}>
                              {number}. rata - €{Number(amount).toFixed(2)} {disabled ? '(već plaćeno)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {invoiceMode === 'new' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ime *</label>
                        <input type="text" value={newCustomer.first_name} onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Prezime *</label>
                        <input type="text" value={newCustomer.last_name} onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                        <input type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Adresa *</label>
                      <input type="text" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Grad *</label>
                        <input type="text" value={newCustomer.city} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Država *</label>
                        <input type="text" value={newCustomer.country} onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tip kupca</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newCustomer.entity_type === 'individual'} onChange={() => setNewCustomer({ ...newCustomer, entity_type: 'individual' })} className="text-pius" />
                          <span className="text-gray-300">Fizičko lice</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={newCustomer.entity_type === 'company'} onChange={() => setNewCustomer({ ...newCustomer, entity_type: 'company' })} className="text-pius" />
                          <span className="text-gray-300">Pravno lice</span>
                        </label>
                      </div>
                    </div>
                    {newCustomer.entity_type === 'company' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Naziv firme</label>
                          <input type="text" value={newCustomer.company_name} onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">PDV broj</label>
                          <input type="text" value={newCustomer.vat_number} onChange={(e) => setNewCustomer({ ...newCustomer, vat_number: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Kurs (fiksna cijena) *</label>
                      <select value={newCustomer.package_type} onChange={(e) => { setNewCustomer({ ...newCustomer, package_type: e.target.value }); const pkg = packages.find(p => p.slug === e.target.value); if (pkg) setFormData(prev => ({ ...prev, description: pkg.name, total_amount: pkg.price.toString() })); }} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        <option value="">Odaberi kurs...</option>
                        {fixedPackages.map(pkg => (
                          <option key={pkg.id} value={pkg.slug}>{pkg.name} - €{Number(pkg.price).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Datum fakture *</label>
                  <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Opis *</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="npr. Online Marketing Kurs" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ukupan iznos (€) *</label>
                  <input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} required placeholder="400.00" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  {formData.total_amount && (
                    <p className="text-xs text-gray-400 mt-1">Netto: €{(parseFloat(formData.total_amount) / 1.2).toFixed(2)} | PDV (20%): €{(parseFloat(formData.total_amount) - parseFloat(formData.total_amount) / 1.2).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Napomena</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.mark_as_paid} onChange={(e) => setFormData({ ...formData, mark_as_paid: e.target.checked })} className="w-4 h-4 text-pius bg-gray-700 border-gray-600 rounded" />
                  <span className="text-sm text-gray-300">Označi kao plaćeno</span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button type="submit" disabled={saving || (invoiceMode === 'existing' && !selectedStudent) || (invoiceMode === 'new' && !newCustomer.package_type)} className="flex-1 bg-pius hover:bg-pius-dark text-black py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Kreiranje...' : 'Kreiraj fakturu'}
                  </button>
                  <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-lg font-medium">Odustani</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && invoiceToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4"><Trash2 className="h-6 w-6 text-red-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-2">Obriši fakturu?</h3>
                <p className="text-gray-400 mb-4">Da li ste sigurni da želite obrisati fakturu <span className="text-pius font-mono">{invoiceToDelete.invoice_number}</span>?</p>
                <p className="text-sm text-yellow-400 mb-6">Broj fakture će biti ponovo dostupan za korištenje.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-2 rounded-lg font-medium">Odustani</button>
                  <button onClick={handleDeleteConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">Obriši</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSettingsModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Bell className="h-5 w-5 text-pius" />Postavke podsjetnika</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Automatski podsjetnici</p>
                    <p className="text-sm text-gray-400">Šalji email podsjetnike prije roka plaćanja</p>
                  </div>
                  <input type="checkbox" checked={settings.payment_reminder_enabled} onChange={(e) => setSettings({ ...settings, payment_reminder_enabled: e.target.checked })} className="w-5 h-5 text-pius bg-gray-700 border-gray-600 rounded" />
                </label>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <label className="block text-white font-medium mb-2">Dana prije roka</label>
                  <select value={settings.payment_reminder_days_before} onChange={(e) => setSettings({ ...settings, payment_reminder_days_before: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="1">1 dan</option>
                    <option value="2">2 dana</option>
                    <option value="3">3 dana</option>
                    <option value="5">5 dana</option>
                    <option value="7">7 dana</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <label className="block text-white font-medium mb-2">Tekst email opomene</label>
                  <textarea
                    value={settings.payment_reminder_email_template}
                    onChange={(e) => setSettings({ ...settings, payment_reminder_email_template: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-64 font-mono text-sm"
                    placeholder="Unesite tekst emaila..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Dostupni placeholderi: {'{name}'}, {'{first_name}'}, {'{last_name}'}, {'{invoice_number}'}, {'{description}'}, {'{amount}'}, {'{due_date}'}, {'{email}'}
                  </p>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-sm text-blue-400">
                    <strong>Napomena:</strong> Za automatsko slanje podsjetnika potrebno je podesiti cron job koji pokreće komandu: <code className="bg-gray-800 px-1 rounded">php artisan reminders:send-payment</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSettingsModal(false)} className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 py-2 rounded-lg font-medium">Odustani</button>
                <button onClick={handleSaveSettings} className="flex-1 bg-pius hover:bg-pius-dark text-black py-2 rounded-lg font-medium">Spremi</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
