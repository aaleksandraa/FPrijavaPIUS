import { describe, expect, it } from 'vitest';
import { enrollmentTotals, groupEnrollments, installmentOptions } from '../lib/enrollments';
import type { Student } from '../types';

const enrollment = (id: string, slug: string): Student => ({
  id, first_name: 'Ana', last_name: 'Test', email: 'ana@example.com', package_type: slug,
  payment_method: 'installments', invoices: [], payments: [],
  package: { name: slug, slug, price: 900, discount_price: 600, installments: [
    { installment_number: 1, amount: 300 }, { installment_number: 2, amount: 300 },
  ] },
} as Student);

describe('One person with multiple course enrollments', () => {
  it('groups name and email for display while preserving every enrollment ID', () => {
    const first = enrollment('old-id', 'pius-pro');
    const second = { ...enrollment('custom-id', 'eyeliner-lips'), first_name: ' ANA ', email: 'ANA@EXAMPLE.COM ' };
    const other = { ...enrollment('other-id', 'lashes'), first_name: 'Anja' };
    const groups = groupEnrollments([first, second, other]);
    expect(groups).toHaveLength(2);
    expect(groups[0].enrollments.map(student => student.id)).toEqual(['old-id', 'custom-id']);
  });

  it('retains repeat enrollments in the same course', () => {
    expect(groupEnrollments([enrollment('a', 'pius-pro'), enrollment('b', 'pius-pro')])[0].enrollments).toHaveLength(2);
  });

  it('uses only invoices and unlinked payments belonging to the selected enrollment', () => {
    const old = enrollment('old-id', 'pius-pro');
    old.invoices = [{ id: 'invoice', status: 'paid', installment_number: 1, total_amount: 300 }] as any;
    old.payments = [
      { invoice_id: 'invoice', status: 'paid', amount: 300 },
      { invoice_id: null, status: 'paid', amount: 50 },
    ] as any;
    expect(enrollmentTotals(old)).toEqual({ total: 600, paid: 350, remaining: 250 });
    expect(enrollmentTotals(enrollment('custom-id', 'eyeliner-lips'))).toEqual({ total: 600, paid: 0, remaining: 600 });
  });

  it('uses the actual course schedule and shows pending invoices as already invoiced', () => {
    const student = enrollment('custom-id', 'eyeliner-lips');
    student.invoices = [{ id: 'pending', status: 'pending', installment_number: 1, invoice_number: '2026/001' }] as any;
    const options = installmentOptions(student);
    expect(options.map(option => option.number)).toEqual([1, 2]);
    expect(options[0].disabled).toBe(true);
    expect(options[0].invoice?.invoice_number).toBe('2026/001');
    expect(options[1].disabled).toBe(false);
    expect(installmentOptions(enrollment('old-id', 'pius-pro'))[0].disabled).toBe(false);
  });

  it('does not reserve rates for cancelled invoices', () => {
    const student = enrollment('custom-id', 'eyeliner-lips');
    student.invoices = [{ status: 'cancelled', installment_number: 1 }] as any;
    expect(installmentOptions(student)[0].disabled).toBe(false);
  });

  it('does not offer rates when the enrollment uses full payment', () => {
    const student = { ...enrollment('custom-id', 'eyeliner-lips'), payment_method: 'full' as const };
    expect(installmentOptions(student)).toEqual([]);
  });

  it('excludes paid services and their linked payments from the course balance', () => {
    const student = enrollment('custom-id', 'eyeliner-lips');
    student.invoices = [{ id: 'service', invoice_type: 'other', status: 'paid', total_amount: 75 }] as any;
    student.payments = [{ invoice_id: 'service', status: 'paid', amount: 75, installment_number: 1 }] as any;
    expect(enrollmentTotals(student)).toEqual({ total: 600, paid: 0, remaining: 600 });
    expect(installmentOptions(student).every(rate => !rate.disabled)).toBe(true);
  });
});
