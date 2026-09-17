export const CONTRACT_VERSION = 1 as const;

export type SignUpInput = Readonly<{ name: string; phone: string; email: string; password: string; passwordConfirmation: string; acceptsTerms: boolean; confirmsAdult: boolean }>;
export type SignInInput = Readonly<{ email: string; password: string }>;
export type FinancialCycle = Readonly<{ startDay: number; timezone: 'America/Sao_Paulo' }>;
export type AccountDraft = Readonly<{ name: string; type: 'checking' | 'cash' | 'credit'; includesPix: boolean; initialBalanceCents: bigint }>;
export type TransactionKind = 'expense' | 'income';
export type TransactionParty = 'me' | 'partner' | 'shared';
export type PaymentMethod = string;
export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
export type Recurrence = Readonly<{ frequency: RecurrenceFrequency }>;
/** One slice of a purchase split over several months. `purchaseId` ties the slices together. */
export type Installment = Readonly<{ purchaseId: string; number: number; total: number; purchaseAmountCents: bigint }>;
export type TransactionProposal = Readonly<{
  id: string;
  kind: TransactionKind;
  description: string;
  amountCents: bigint;
  accountName: string;
  category: string;
  localDate: string;
  party: TransactionParty;
  paymentMethod: PaymentMethod;
  note?: string;
  recurrence?: Recurrence;
  installment?: Installment;
  status: 'proposed';
}>;
export type OnboardingState = Readonly<{ cycle?: FinancialCycle; account?: AccountDraft; completed: boolean; trialEndsAt?: string }>;
/** A future obligation the user tracked ahead of time — "devo pro Felipe", "conta de luz" — not yet reflected in the balance. */
export type PendingItemKind = 'payable' | 'receivable';
export type PendingItemStatus = 'pending' | 'settled';
export type PendingItem = Readonly<{
  id: string;
  kind: PendingItemKind;
  description: string;
  amountCents: bigint;
  dueDate: string;
  category: string;
  paymentMethod?: PaymentMethod;
  party: TransactionParty;
  note?: string;
  recurrence?: Recurrence;
  status: PendingItemStatus;
  settledAt?: string;
  settledTransactionId?: string;
}>;
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
