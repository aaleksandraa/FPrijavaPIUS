import type { Invoice, Package, Student } from '../types';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

// Group only for display. All financial operations continue to use the exact
// enrollment ID, including repeat enrollments in the same course.
export function personKey(student: Pick<Student, 'id' | 'first_name' | 'last_name' | 'email'>): string {
  return student.email?.trim()
    ? JSON.stringify([normalize(student.first_name), normalize(student.last_name), normalize(student.email)])
    : student.id;
}

export interface StudentGroup {
  key: string;
  person: Student;
  enrollments: Student[];
}

export function groupEnrollments(students: Student[]): StudentGroup[] {
  const groups = new Map<string, StudentGroup>();
  students.forEach(student => {
    const key = personKey(student);
    const group = groups.get(key);
    if (group) group.enrollments.push(student);
    else groups.set(key, { key, person: student, enrollments: [student] });
  });
  return Array.from(groups.values());
}

export const courseName = (student?: Pick<Student, 'package' | 'package_type'>) =>
  student?.package?.name || student?.package_type?.replace(/-/g, ' ') || 'Kurs nije dostupan';

export function enrollmentLabel(student: Student): string {
  const date = student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('de-AT') : '';
  return `${courseName(student)}${date ? ` · ${date}` : ''} · #${student.id.slice(-8)}`;
}

export function enrollmentTotals(student: Student) {
  const total = Number(student.course_total ?? student.package?.discount_price ?? student.package?.price ?? 0);
  const paid = Number(student.paid_amount ?? (
    (student.invoices || []).filter(invoice => invoice.invoice_type !== 'other' && invoice.status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    + (student.payments || []).filter(payment => !payment.invoice_id && payment.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  ));
  return { total, paid, remaining: Math.max(0, Math.round((total - paid) * 100) / 100) };
}

export function installmentOptions(student: Pick<Student, 'payment_method' | 'invoices' | 'payments' | 'package'>, pkg?: Package) {
  if (student.payment_method !== 'installments') return [];
  const plan = (pkg || student.package)?.installments;
  const installments = plan?.length ? plan : [1, 2, 3].map(number => ({ installment_number: number, amount: 0 }));
  return [...installments].sort((a, b) => a.installment_number - b.installment_number).map(installment => {
    const invoice: Invoice | undefined = student.invoices?.find(item =>
      item.invoice_type !== 'other' && item.installment_number === installment.installment_number && item.status !== 'cancelled');
    const paid = invoice?.status === 'paid' || !!student.payments?.some(payment =>
      !payment.invoice_id && payment.status === 'paid' && payment.installment_number === installment.installment_number);
    return { number: installment.installment_number, amount: Number(installment.amount), invoice, paid, disabled: !!invoice || paid };
  });
}
