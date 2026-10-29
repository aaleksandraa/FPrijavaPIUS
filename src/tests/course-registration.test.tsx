import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CourseRegistrationPage from '../pages/CourseRegistrationPage';
import { getPackageBySlug } from '../lib/api';

vi.mock('../lib/api', () => ({
  default: { post: vi.fn() },
  getPackageBySlug: vi.fn(),
}));

const course = {
  id: 'course-id', slug: 'eyeliner-lips', name: 'EYELINER LIPS',
  price: 999.99, has_contract: false, payment_type: 'fixed',
};

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('Direct course links', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function openCourse() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/upis/eyeliner-lips']}>
          <Location />
          <Routes>
            <Route path="/upis/:slug" element={<CourseRegistrationPage />} />
            <Route path="/" element={<p>Početna stranica</p>} />
          </Routes>
        </MemoryRouter>,
      );
    });
  }

  it('loads the requested course without requiring it on the home page', async () => {
    vi.mocked(getPackageBySlug).mockResolvedValue({ data: course } as any);
    await openCourse();
    expect(getPackageBySlug).toHaveBeenCalledWith('eyeliner-lips');
    expect(container.querySelector('h1')?.textContent).toBe('EYELINER LIPS');
    expect(container.querySelector('form')).not.toBeNull();
  });

  it.each([undefined, 404, 500, 401])('keeps the course link after an API failure (%s)', async status => {
    vi.mocked(getPackageBySlug).mockRejectedValue({ isAxiosError: true, response: status ? { status } : undefined });
    await openCourse();
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/upis/eyeliner-lips');
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(status === 404 ? 'Kurs nije pronađen' : 'nije moguće učitati');
    expect(container.textContent).not.toContain('Početna stranica');
  });

  it('retries on the same URL after a temporary failure', async () => {
    vi.mocked(getPackageBySlug)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: course } as any);
    await openCourse();
    await act(async () => container.querySelector('button')!.click());
    expect(container.querySelector('h1')?.textContent).toBe('EYELINER LIPS');
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/upis/eyeliner-lips');
  });

  it('shows a retry message when a misconfigured server returns HTML instead of a course', async () => {
    vi.mocked(getPackageBySlug).mockResolvedValue({ data: '<html>Error</html>' } as any);
    await openCourse();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('nije moguće učitati');
    expect(container.querySelector('form')).toBeNull();
  });
});
