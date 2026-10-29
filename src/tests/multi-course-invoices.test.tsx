import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminInvoices from '../pages/admin/AdminInvoices';
import { createInvoice, getInvoices, getPackages, getSettings, getStudents } from '../lib/api';

vi.mock('../lib/api', () => ({
  getInvoices: vi.fn(), getStudents: vi.fn(), getPackages: vi.fn(), getSettings: vi.fn(),
  createInvoice: vi.fn(), updateInvoice: vi.fn(), deleteInvoice: vi.fn(), downloadInvoicePdf: vi.fn(),
  createStudent: vi.fn(), sendPaymentReminder: vi.fn(), sendInvoiceEmail: vi.fn(), sendInvoiceTestEmail: vi.fn(), updateSettings: vi.fn(),
}));

const packages = [
  { id: 'pkg-old', slug: 'pius-pro', name: 'PIUS PRO', price: 900, payment_type: 'installments', installments: [{ installment_number: 1, amount: 300 }, { installment_number: 2, amount: 300 }, { installment_number: 3, amount: 300 }] },
  { id: 'pkg-custom', slug: 'eyeliner-lips', name: 'EYELINER LIPS', price: 600, payment_type: 'installments', installments: [{ installment_number: 1, amount: 300 }, { installment_number: 2, amount: 300 }] },
];
const students = packages.map((pkg, index) => ({
  id: index ? 'custom-enrollment' : 'old-enrollment', first_name: 'Ana', last_name: 'Test',
  email: 'ana@example.com', enrolled_at: '2026-10-29', package_type: pkg.slug, package: pkg,
  payment_method: 'installments', invoices: index ? [] : [{ id: 'old-invoice', status: 'paid', installment_number: 1, invoice_number: '2026/001', total_amount: 300 }],
}));

describe('Invoice course selection', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    vi.resetAllMocks();
    vi.mocked(getInvoices).mockResolvedValue({ data: [] } as any);
    vi.mocked(getStudents).mockResolvedValue({ data: students } as any);
    vi.mocked(getPackages).mockResolvedValue({ data: packages } as any);
    vi.mocked(getSettings).mockResolvedValue({ data: {} } as any);
    vi.mocked(createInvoice).mockResolvedValue({ data: {} } as any);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function open() {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin/invoices?enrollment=custom-enrollment']}><AdminInvoices /></MemoryRouter>));
  }

  async function select(selector: string, value: string) {
    await act(async () => {
      const input = container.querySelector<HTMLSelectElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  it('preselects the requested enrollment and offers all courses for the same person', async () => {
    await open();
    const enrollment = container.querySelector<HTMLSelectElement>('#invoice-enrollment')!;
    expect(enrollment.value).toBe('custom-enrollment');
    expect([...enrollment.options].map(option => option.value)).toEqual(['', 'old-enrollment', 'custom-enrollment']);
    const rates = container.querySelector<HTMLSelectElement>('#invoice-installment')!;
    expect(rates.options).toHaveLength(3);
    expect(rates.options[1].disabled).toBe(false);
  });

  it('clears the rate and amount when switching courses and scopes paid rates to that course', async () => {
    await open();
    await select('#invoice-installment', '1');
    await select('#invoice-enrollment', 'old-enrollment');
    const rates = container.querySelector<HTMLSelectElement>('#invoice-installment')!;
    expect(rates.value).toBe('');
    expect(rates.options).toHaveLength(4);
    expect(rates.options[1].disabled).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('');
  });

  it('sends the custom enrollment ID even when the same person already paid that rate on another course', async () => {
    await open();
    await select('#invoice-installment', '1');
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(createInvoice).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 'custom-enrollment', installment_number: 1, total_amount: 300,
      description: 'Kurs EYELINER LIPS - 1. rata',
    }));
  });
});
