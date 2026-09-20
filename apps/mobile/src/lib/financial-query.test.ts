import { describe, expect, it } from 'vitest';

import { answerFinancialQuery } from './financial-query';

const tx = (description: string, cents: bigint, date = '2026-09-19', category = 'Compras') => ({ kind: 'expense' as const, description, amountCents: cents, category, paymentMethod: 'Cartão de crédito', localDate: date });

describe('financial chat queries', () => {
  it('totals a category or merchant in the current month', () => {
    const result = answerFinancialQuery({ text: 'Quanto eu gastei de iFood esse mês?', transactions: [tx('iFood', 4500n), tx('iFood', 3200n), tx('Mercado', 10000n)], pendingItems: [], now: new Date(2026, 8, 20) });
    expect(result.handled).toBe(true);
    expect(result.answer).toContain('77,00');
  });

  it('lists movements for a specific day', () => {
    const result = answerFinancialQuery({ text: 'O que eu gastei no dia 19?', transactions: [tx('iFood', 4500n, '2026-09-19'), tx('Cinema', 3000n, '2026-09-18')], pendingItems: [], now: new Date(2026, 8, 20) });
    expect(result.answer).toContain('iFood');
    expect(result.answer).not.toContain('Cinema');
  });

  it('answers whether a pending bill was paid', () => {
    const result = answerFinancialQuery({ text: 'Já paguei a conta de luz?', transactions: [], pendingItems: [{ id: 'bill', kind: 'payable', description: 'Conta de luz', amountCents: 18000n, dueDate: '2026-09-25', category: 'Casa', party: 'me', status: 'pending' }], now: new Date(2026, 8, 20) });
    expect(result.answer).toContain('Ainda não');
  });

  it('does not intercept a new transaction statement', () => {
    expect(answerFinancialQuery({ text: 'Gastei 50 reais no iFood', transactions: [], pendingItems: [] }).handled).toBe(false);
  });
});
