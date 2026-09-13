import type { SignInInput, SignUpInput } from '@juntadin/contracts';
import { normalizeBrazilianPhone, validateSignIn, validateSignUp } from '@juntadin/contracts';

export type MockUser = Readonly<{ id: string; name: string; email: string; phone: string }>;
const wait = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AuthService { signIn(input: SignInInput): Promise<MockUser>; signUp(input: SignUpInput): Promise<MockUser>; sendPasswordReset(email: string): Promise<void> }

export const mockAuthService: AuthService = {
  async signIn(input) {
    await wait();
    if (Object.keys(validateSignIn(input)).length) throw new Error('Confira o e-mail e a senha.');
    if (input.email.trim().toLowerCase() === 'erro@juntadin.com.br') throw new Error('Não encontramos uma conta com esses dados.');
    return { id: 'mock-user', name: 'Victor', email: input.email.trim().toLowerCase(), phone: '+5511999999999' };
  },
  async signUp(input) {
    await wait();
    if (Object.keys(validateSignUp(input)).length) throw new Error('Revise os campos indicados.');
    return { id: 'mock-user', name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: normalizeBrazilianPhone(input.phone)! };
  },
  async sendPasswordReset(email) {
    await wait(450);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Digite um e-mail válido.');
  },
};
