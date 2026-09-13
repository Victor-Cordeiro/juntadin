import { describe, expect, it } from 'vitest';

import { money } from './index';

describe('money', () => {
  it('preserves BRL cents without floating-point conversion', () => {
    expect(money(5_890n)).toEqual({ currency: 'BRL', cents: 5_890n });
  });
});

