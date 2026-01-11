export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  id_document_number: string;
  entity_type: 'individual' | 'company';
  payment_method: 'full' | 'installments';
  package_type: string; // Package slug (e.g., 'pius-pro', 'pius-pro-master', 'usne', etc.)
  company_name?: string;
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_registration?: string;
  status: 'enrolled' | 'contract_signed' | 'completed' | 'cancelled';
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  contracts?: Contract[];
  invoices?: Invoice[];
  payments?: Payment[];
  package?: Package; // Added package relationship
  paid_installments_count?: number;
  total_installments?: number;
  payment_status?: string;
}

export interface Contract {
  id: string;
  student_id: string;
  contract_number?: string;
  contract_type: 'individual' | 'company';
  contract_content: string;
  signature_data?: string;
  signed_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  student?: Student;
}

export interface ContractTemplate {
  id: string;
  template_type: 'individual' | 'company';
  package_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  payment_type: 'installments' | 'fixed';
  description?: string;
  image_url?: string;
  is_active: boolean;
  show_on_landing: boolean;
  show_first_installment_reminder?: boolean;
  has_contract: boolean;
  duration_days: number;
  features?: string[];
  contract_template?: string; // Deprecated - kept for backward compatibility
  contract_template_individual?: string;
  contract_template_company?: string;
  installments?: PackageInstallment[];
  created_at: string;
  updated_at: string;
}

export interface PackageInstallment {
  id: string;
  package_id: string;
  installment_number: number;
  amount: number;
  due_description: string;
  due_date?: string;
  due_days?: number;
}

export interface Invoice {
  id: string;
  student_id: string;
  invoice_number: string;
  is_custom_number?: boolean;
  invoice_date: string;
  payment_date?: string;
  description: string;
  net_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  installment_number?: number;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  student?: Student;
}

export interface Payment {
  id: string;
  student_id: string;
  invoice_id?: string;
  installment_number: number;
  amount: number;
  paid_at?: string;
  status: 'pending' | 'paid';
  notes?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface FormData {
  paket: string;
  ime: string;
  prezime: string;
  adresa: string;
  postanskiBroj: string;
  mjesto: string;
  drzava: string;
  telefon: string;
  email: string;
  brojLicnogDokumenta: string;
  tipLica: 'fizicko' | 'pravno';
  nacinPlacanja: 'cjelokupno' | 'rate';
  nazivFirme?: string;
  pdvBroj?: string;
  adresaFirme?: string;
  postanskiBrojFirme?: string;
  mjestoFirme?: string;
  drzavaFirme?: string;
  registracijaFirme?: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  intro_text?: string;
  package_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
