import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AddStudentModal from '../components/AddStudentModal';
import { addStudentEnrollment, createStudent, getPackages } from '../lib/api';
import type { Student } from '../types';

vi.mock('../lib/api', () => ({ addStudentEnrollment: vi.fn(), createStudent: vi.fn(), getPackages: vi.fn() }));

let container: HTMLDivElement;
let root: Root;
const student = { id: 'existing-student', first_name: 'Ana', last_name: 'Test', email: 'ana@example.com' } as Student;
const onClose = vi.fn();
const onSuccess = vi.fn();

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.resetAllMocks();
  vi.mocked(getPackages).mockResolvedValue({ data: [
    { id: 'p1', slug: 'lashes', name: 'Trepavice', price: 600, is_active: true, payment_type: 'fixed' },
    { id: 'p2', slug: 'lips', name: 'Usne', price: 900, is_active: true, payment_type: 'installments' },
    { id: 'p3', slug: 'old', name: 'Inactive', price: 0, is_active: false },
  ] } as any);
  vi.mocked(addStudentEnrollment).mockResolvedValue({ data: { id: 'new-enrollment' } } as any);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function open() {
  await act(async () => root.render(<AddStudentModal isOpen initialStudent={student} onClose={onClose} onSuccess={onSuccess} />));
}

async function selectCourse(value: string) {
  await act(async () => {
    const select = container.querySelector<HTMLSelectElement>('#student-package')!;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

it('adds a course to the saved person without asking for personal details again', async () => {
  await open();
  expect(container.textContent).toContain('Ana Test');
  expect(container.querySelector('input')).toBeNull();
  expect(container.querySelectorAll('#student-package option')).toHaveLength(3);
  await selectCourse('lashes');
  const installmentButton = [...container.querySelectorAll('button')].find(button => button.textContent === 'Na rate')!;
  expect(installmentButton.disabled).toBe(true);
  expect(container.querySelector('form')!.checkValidity()).toBe(true);
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(addStudentEnrollment).toHaveBeenCalledWith('existing-student', { package_type: 'lashes', payment_method: 'full' });
  expect(createStudent).not.toHaveBeenCalled();
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
});

it('keeps the form open and displays validation errors when saving fails', async () => {
  vi.mocked(addStudentEnrollment).mockRejectedValue({ response: { data: { errors: { package_type: ['Kurs više nije aktivan.'] } } } });
  await open();
  await selectCourse('lips');
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(addStudentEnrollment).toHaveBeenCalledWith('existing-student', { package_type: 'lips', payment_method: 'installments' });
  expect(container.textContent).toContain('Kurs više nije aktivan.');
  expect(onSuccess).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
