import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThankYouPage from '../pages/ThankYouPage';
import { getPackageBySlug } from '../lib/api';

vi.mock('../lib/api', () => ({ getPackageBySlug: vi.fn() }));

const course = {
  id: 'course-id', slug: 'eyeliner-lips', name: 'EYELINER LIPS', price: 1800,
  discount_price: 999.99, installments: [1, 2, 3].map(number => ({
    id: `rate-${number}`, installment_number: number, amount: 333.33,
    due_description: `${number}. rata - dospijeva do 05.11.2026`,
  })),
};

describe('Payment total after signing a contract', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    vi.resetAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function open(discount: number | undefined = 999.99) {
    vi.mocked(getPackageBySlug).mockResolvedValue({ data: { ...course, discount_price: discount } } as any);
    await act(async () => root.render(
      <MemoryRouter initialEntries={[{ pathname: '/hvala', state: { isContract: true, package: 'eyeliner-lips' } }]}>
        <ThankYouPage />
      </MemoryRouter>,
    ));
  }

  it('uses the discount as the total and crosses out the regular price', async () => {
    await open();
    expect(getPackageBySlug).toHaveBeenCalledWith('eyeliner-lips');
    expect(container.querySelector('s')?.textContent).toBe('1.800,00 €');
    expect(container.querySelector('s')?.parentElement?.textContent).toContain('999,99 €');
  });

  it('keeps cents on every installment', async () => {
    await open();
    expect([...container.querySelectorAll('span')].filter(span => span.textContent === '333,33 €')).toHaveLength(3);
    expect(container.textContent).not.toContain('€333');
  });

  it('uses the course discount value instead of hardcoding a promotional price', async () => {
    await open(99.99);
    expect(container.querySelector('s')?.parentElement?.textContent).toContain('99,99 €');
  });

  it('shows the regular total when there is no discount', async () => {
    vi.mocked(getPackageBySlug).mockResolvedValue({ data: { ...course, discount_price: null } } as any);
    await act(async () => root.render(<MemoryRouter initialEntries={[{ pathname: '/hvala', state: { isContract: true, package: 'eyeliner-lips' } }]}><ThankYouPage /></MemoryRouter>));
    expect(container.querySelector('s')).toBeNull();
    expect(container.textContent).toContain('1.800,00 €');
    expect(container.textContent).not.toContain('999,99 €');
  });

  it('does not replace a zero promotional price with the regular price', async () => {
    await open(0);
    expect(container.querySelector('s')?.parentElement?.querySelector('span')?.textContent).toBe('0,00 €');
  });
});
