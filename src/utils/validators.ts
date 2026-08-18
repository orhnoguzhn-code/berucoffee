export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_RULES: { id: 'length' | 'upper' | 'lower' | 'number' | 'special'; test: (p: string) => boolean }[] = [
  { id: 'length', test: (p) => p.length >= 6 },
  { id: 'upper', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', test: (p) => /[a-z]/.test(p) },
  { id: 'number', test: (p) => /\d/.test(p) },
  { id: 'special', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function normalizeTRPhone(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 10) return '+90' + digits;
  if (digits.length === 11) return '+90' + digits.slice(1);
  if (digits.startsWith('90') && digits.length === 12) return '+' + digits;
  return '';
}

export function isValidPhone(p: string): boolean {
  return normalizeTRPhone(p).length > 0;
}

export function passwordScore(p: string): number {
  if (!p) return 0;
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}