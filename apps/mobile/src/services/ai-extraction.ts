import type { TransactionProposal } from '@juntadin/contracts';

import { supabase } from '@/lib/supabase';
import type { CapturedMedia } from '@/lib/ai-capture';
import { presetCategories, findCategory, type Category } from '@/data/categories';
import { presetPaymentMethods, findPaymentMethod, type PaymentMethodOption } from '@/data/payment-methods';
import { uuid } from '@/lib/uuid';
import { todayISODate } from '@/lib/dates';

export type ExtractionInput = { mode: 'text' | 'image' | 'audio'; text?: string; media?: CapturedMedia };

export type ExtractionErrorCode = 'no_transaction_found' | 'unreadable_input' | 'rate_limited' | 'gemini_error';
export class ExtractionError extends Error {
  constructor(public code: ExtractionErrorCode, message: string) { super(message); }
}

type ExtractResponse =
  | { ok: true; proposal: { kind: 'expense' | 'income'; description: string; amountCents: string; category: string; paymentMethod: string | null; localDate: string; note?: string; installmentTotal?: number } }
  | { ok: false; error: ExtractionErrorCode; message: string };

/**
 * Sends whatever the user attached to the ai-extract-transaction edge function and
 * turns the result into a TransactionProposal — the same shape the manual form
 * produces, so it drops straight into the existing review/confirm screen.
 */
export async function extractTransaction(
  input: ExtractionInput,
  customCategories: { expense: Category[]; income: Category[] },
  customPaymentMethods: PaymentMethodOption[],
): Promise<TransactionProposal> {
  if (!supabase) throw new ExtractionError('gemini_error', 'Supabase não configurado.');

  const validCategories = [...presetCategories.expense, ...presetCategories.income, ...customCategories.expense, ...customCategories.income].map((c) => c.name);
  const validPaymentMethods = [...presetPaymentMethods, ...customPaymentMethods].map((m) => m.name);

  const { data, error } = await supabase.functions.invoke('ai-extract-transaction', {
    body: { mode: input.mode, text: input.text, mediaBase64: input.media?.base64, mediaMimeType: input.media?.mimeType, validCategories, validPaymentMethods, todayLocalDate: todayISODate() },
  });
  if (error) throw new ExtractionError('gemini_error', 'Não consegui falar com a IA agora. Tente de novo.');

  const result = data as ExtractResponse;
  if (!result.ok) throw new ExtractionError(result.error, result.message);

  const kind = result.proposal.kind;
  const category = findCategory(kind, result.proposal.category, customCategories[kind])?.name ?? presetCategories[kind][0].name;
  const fallbackMethod = presetPaymentMethods.find((method) => method.id === 'other')!.name;
  const paymentMethod = result.proposal.paymentMethod && findPaymentMethod(result.proposal.paymentMethod, customPaymentMethods) ? result.proposal.paymentMethod : fallbackMethod;
  const amountCents = parseAmountCents(result.proposal.amountCents);
  if (amountCents === null) throw new ExtractionError('unreadable_input', 'A IA retornou um valor inválido.');
  const installmentTotal = result.proposal.installmentTotal ?? inferInstallmentTotal(result.proposal.note, result.proposal.description);
  const validInstallments = kind === 'expense' && paymentMethodIsCredit(paymentMethod, customPaymentMethods) && Number.isInteger(installmentTotal) && installmentTotal! > 1 && installmentTotal! <= 60;

  return {
    id: uuid(),
    kind,
    description: result.proposal.description,
    amountCents,
    accountName: 'Conta principal',
    category,
    localDate: result.proposal.localDate,
    party: 'me',
    paymentMethod,
    note: result.proposal.note,
    installment: validInstallments ? { purchaseId: '', number: 1, total: installmentTotal!, purchaseAmountCents: amountCents } : undefined,
    status: 'proposed',
  };
}

function parseAmountCents(value: string): bigint | null {
  if (!/^\d+$/.test(value)) return null;
  const cents = BigInt(value);
  return cents > 0n ? cents : null;
}

function paymentMethodIsCredit(name: string, custom: PaymentMethodOption[]): boolean {
  return [...presetPaymentMethods, ...custom].some((method) => method.name === name && method.credit);
}

function inferInstallmentTotal(...values: (string | undefined)[]): number | undefined {
  const text = values.filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
  const match = /(?:([2-9]|[1-5]\d|60)\s*[x×]|(?:em|de|em até)\s+([2-9]|[1-5]\d|60)\s+(?:vezes|parcelas?))/i.exec(text);
  const count = Number(match?.[1] ?? match?.[2]);
  return Number.isInteger(count) && count >= 2 && count <= 60 ? count : undefined;
}
