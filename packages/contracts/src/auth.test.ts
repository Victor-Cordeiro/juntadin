import { describe, expect, it } from 'vitest';
import { normalizeBrazilianPhone, validateSignUp, type SignUpInput } from './index';

const valid: SignUpInput = { name: 'Ana Souza', phone: '(11) 99999-9999', email: 'ana@example.com', password: 'Juntadin1', passwordConfirmation: 'Juntadin1', acceptsTerms: true, confirmsAdult: true };

describe('signup validation', () => {
  it('accepts the complete commercial signup', () => expect(validateSignUp(valid)).toEqual({}));
  it('normalizes a Brazilian phone to E.164', () => expect(normalizeBrazilianPhone(valid.phone)).toBe('+5511999999999'));
  it('blocks weak and mismatched passwords and missing consent', () => {
    const errors = validateSignUp({ ...valid, password: 'abc', passwordConfirmation: 'def', acceptsTerms: false, confirmsAdult: false });
    expect(errors).toMatchObject({ password: expect.any(String), passwordConfirmation: expect.any(String), acceptsTerms: expect.any(String), confirmsAdult: expect.any(String) });
  });
});
