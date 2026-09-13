export const CONTRACT_VERSION = 1 as const;

export type SignUpInput = Readonly<{ name: string; phone: string; email: string; password: string; passwordConfirmation: string; acceptsTerms: boolean; confirmsAdult: boolean }>;
export type SignInInput = Readonly<{ email: string; password: string }>;
export type FinancialCycle = Readonly<{ startDay: number; timezone: 'America/Sao_Paulo' }>;
export type AccountDraft = Readonly<{ name: string; type: 'checking' | 'cash' | 'credit'; includesPix: boolean; initialBalanceCents: bigint }>;
export type TransactionProposal = Readonly<{ id: string; kind: 'expense'; description: string; amountCents: bigint; accountName: string; category: string; localDate: string; status: 'proposed' }>;
export type OnboardingState = Readonly<{ cycle?: FinancialCycle; account?: AccountDraft; completed: boolean; trialEndsAt?: string }>;
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeBrazilianPhone(value: string): string | null {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : null;
}

export function validateSignIn(input: SignInInput): FieldErrors<SignInInput> {
  const errors: FieldErrors<SignInInput> = {};
  if (!EMAIL.test(input.email.trim())) errors.email = 'Digite um e-mail válido.';
  if (!input.password) errors.password = 'Digite sua senha.';
  return errors;
}

export function validateSignUp(input: SignUpInput): FieldErrors<SignUpInput> {
  const errors: FieldErrors<SignUpInput> = {};
  if (input.name.trim().length < 2) errors.name = 'Digite seu nome.';
  if (!normalizeBrazilianPhone(input.phone)) errors.phone = 'Digite um telefone com DDD.';
  if (!EMAIL.test(input.email.trim())) errors.email = 'Digite um e-mail válido.';
  if (input.password.length < 8 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) errors.password = 'Use pelo menos 8 caracteres, com letra e número.';
  if (input.passwordConfirmation !== input.password) errors.passwordConfirmation = 'As senhas precisam ser iguais.';
  if (!input.acceptsTerms) errors.acceptsTerms = 'Aceite os termos e a política de privacidade.';
  if (!input.confirmsAdult) errors.confirmsAdult = 'Confirme que você tem 18 anos ou mais.';
  return errors;
}
