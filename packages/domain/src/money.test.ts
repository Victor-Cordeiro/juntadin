import { describe, expect, it } from 'vitest';

import { appendUniqueById, formatBRL, money, parseBRL } from './index';

describe('money', () => {
  it('preserves BRL cents without floating-point conversion', () => {
    expect(money(5_890n)).toEqual({ currency: 'BRL', cents: 5_890n });
  });

  it('parses and formats pt-BR values in cents', () => {
    expect(parseBRL('R$ 58,90')).toBe(5_890n);
    expect(formatBRL(5_890n)).toContain('58,90');
  });

  it('does not append a confirmed event twice', () => {
    const first = { id: 'tx-1' };
    expect(appendUniqueById(appendUniqueById([], first), first)).toEqual([first]);
  });
});
