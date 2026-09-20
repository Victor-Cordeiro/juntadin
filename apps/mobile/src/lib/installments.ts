import type { TransactionProposal } from '@juntadin/contracts';

import { addMonthsClamped, parseISODate, toISODate } from './dates';
import { uuid } from './uuid';

export const installmentOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24];

export function isValidInstallmentCount(count: number): boolean {
  return Number.isInteger(count) && count >= 2 && count <= 60;
}

/**
 * Splits a purchase into equal monthly slices.
 *
 * Cents rarely divide evenly, so the remainder goes on the FIRST slice: the sum of the
 * parts always equals the purchase, and the leftover is charged now rather than in a
 * year. R$ 100 in 3x becomes 33,34 + 33,33 + 33,33.
 */
export function splitInstallments(totalCents: bigint, count: number): bigint[] {
  const base = totalCents / BigInt(count);
  const remainder = totalCents - base * BigInt(count);
  return Array.from({ length: count }, (_, index) => (index === 0 ? base + remainder : base));
}

/** Monthly dates starting at the purchase date, keeping the same day of month. */
export function installmentDates(startDate: string, count: number): string[] {
  const dates: string[] = [];
  let cursor = startDate;
  for (let index = 0; index < count; index += 1) {
    dates.push(cursor);
    const parsed = parseISODate(cursor);
    cursor = parsed ? addMonthsClamped(parsed, 1) : cursor;
  }
  return dates;
}

/**
 * Turns a proposal into one confirmed-shaped transaction per installment. Each slice
 * carries its own month, so every screen that already sums a month gets it right
 * without knowing installments exist.
 */
export function buildInstallmentTransactions(proposal: TransactionProposal, count: number) {
  if (!isValidInstallmentCount(count)) throw new Error('Invalid installment count');
  const amounts = splitInstallments(proposal.amountCents, count);
  const dates = installmentDates(proposal.localDate, count);
  const purchaseId = uuid();

  return amounts.map((amountCents, index) => ({
    ...proposal,
    id: uuid(),
    amountCents,
    localDate: dates[index],
    installment: { purchaseId, number: index + 1, total: count, purchaseAmountCents: proposal.amountCents },
  }));
}

export function installmentLabel(installment?: { number: number; total: number }): string | null {
  return installment ? `${installment.number}/${installment.total}` : null;
}

/** True when the date is valid — guards the generated dates before they are stored. */
export function isValidDate(value: string): boolean {
  return parseISODate(value) !== null && toISODate(parseISODate(value)!) === value;
}
