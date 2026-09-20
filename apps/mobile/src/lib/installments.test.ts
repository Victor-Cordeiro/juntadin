import { describe, expect, it } from 'vitest';

import { addMonthsClamped, parseISODate } from './dates';
import { buildInstallmentTransactions, installmentDates, isValidInstallmentCount, splitInstallments } from './installments';

const proposal = {
  id: 'proposal', kind: 'expense' as const, description: 'Compra', amountCents: 500_000n,
  accountName: 'Conta principal', category: 'Casa', localDate: '2026-01-31', party: 'me' as const,
  paymentMethod: 'Cartão de crédito', status: 'proposed' as const,
};

describe('installments', () => {
  it.each([2, 3, 10, 12])('splits R$ 5.000 exactly into %i installments', (count) => {
    const parts = splitInstallments(500_000n, count);
    expect(parts).toHaveLength(count);
    expect(parts.reduce((sum, value) => sum + value, 0n)).toBe(500_000n);
  });

  it('puts the remainder in the first installment', () => {
    expect(splitInstallments(10_000n, 3)).toEqual([3334n, 3333n, 3333n]);
  });

  it('clamps month-end dates instead of skipping February', () => {
    expect(addMonthsClamped(new Date(2026, 0, 31), 1)).toBe('2026-02-28');
    expect(installmentDates('2026-01-31', 3)).toEqual(['2026-01-31', '2026-02-28', '2026-03-28']);
  });

  it('rejects calendar dates that JavaScript would silently overflow', () => {
    expect(parseISODate('2026-02-31')).toBeNull();
  });

  it('materializes unique rows with shared purchase metadata', () => {
    const rows = buildInstallmentTransactions(proposal, 3);
    expect(new Set(rows.map((row) => row.id)).size).toBe(3);
    expect(new Set(rows.map((row) => row.installment?.purchaseId)).size).toBe(1);
    expect(rows.map((row) => row.installment?.number)).toEqual([1, 2, 3]);
  });

  it('rejects invalid installment counts', () => {
    expect(isValidInstallmentCount(1)).toBe(false);
    expect(isValidInstallmentCount(61)).toBe(false);
    expect(() => buildInstallmentTransactions(proposal, 1)).toThrow();
  });
});
