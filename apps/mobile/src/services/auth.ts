import type { SignInInput, SignUpInput } from '@juntadin/contracts';
import { normalizeBrazilianPhone, validateSignIn, validateSignUp } from '@juntadin/contracts';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AuthUser = Readonly<{ id: string; name: string; email: string; phone: string }>;

function requireClient() {
  if (!supabase || !isSupabaseConfigured) throw new Error('O Supabase ainda não está configurado neste ambiente.');
  return supabase;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: String(user.user_metadata.display_name ?? user.email?.split('@')[0] ?? 'Pessoa'),
    email: user.email ?? '',
    phone: String(user.user_metadata.phone_e164 ?? ''),
  };
}

function redirectUrl(path: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return `juntadin://${path.replace(/^\//, '')}`;
}

export interface AuthService {
  restoreSession(): Promise<AuthUser | null>;
  onAuthStateChange(listener: (event: AuthChangeEvent, user: AuthUser | null) => void): () => void;
  signIn(input: SignInInput): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<AuthUser>;
  confirmEmailSession(): Promise<AuthUser>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}

export const authService: AuthService = {
  async restoreSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error('Não foi possível restaurar sua sessão.');
    return data.session ? toAuthUser(data.session.user) : null;
  },
  onAuthStateChange(listener) {
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => listener(event, session ? toAuthUser(session.user) : null));
    return () => data.subscription.unsubscribe();
  },
  async signIn(input) {
    if (Object.keys(validateSignIn(input)).length) throw new Error('Confira o e-mail e a senha.');
    const { data, error } = await requireClient().auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password });
    if (error || !data.user) throw new Error('E-mail ou senha incorretos.');
    return toAuthUser(data.user);
  },
  async signInWithGoogle() {
    const client = requireClient();
    const redirectTo = redirectUrl('/auth/callback');
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error('Não foi possível iniciar o login com Google.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') throw new Error('Login com Google cancelado.');
      throw new Error('Não foi possível concluir o login com Google.');
    }

    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    try {
      const callbackUrl = new URL(result.url);
      const oauthError = callbackUrl.searchParams.get('error');
      if (oauthError) {
        const description = callbackUrl.searchParams.get('error_description');
        if (oauthError === 'access_denied' || /signup/i.test(description ?? '')) throw new Error('Não foi possível entrar com essa conta Google. Tente criar uma conta primeiro.');
        throw new Error('O Google recusou o login. Tente novamente.');
      }
      const hash = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      accessToken = hash.get('access_token');
      refreshToken = hash.get('refresh_token');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) throw parseError;
      throw new Error('Não foi possível concluir o login com Google.');
    }
    if (!accessToken || !refreshToken) throw new Error('O Google não retornou uma sessão válida.');

    const { data: sessionData, error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError || !sessionData.user) throw new Error('Não foi possível criar sua sessão.');
    return toAuthUser(sessionData.user);
  },
  async signUp(input) {
    if (Object.keys(validateSignUp(input)).length) throw new Error('Revise os campos indicados.');
    const phone = normalizeBrazilianPhone(input.phone)!;
    const { data, error } = await requireClient().auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { display_name: input.name.trim(), phone_e164: phone }, emailRedirectTo: redirectUrl('/onboarding/cycle') },
    });
    if (error || !data.user) throw new Error(error?.message.includes('already') ? 'Este e-mail já está cadastrado.' : 'Não foi possível criar a conta agora.');
    return toAuthUser(data.user);
  },
  async confirmEmailSession() {
    const { data, error } = await requireClient().auth.getSession();
    if (error || !data.session?.user.email_confirmed_at) throw new Error('Ainda não encontramos a confirmação. Abra o link do e-mail e tente novamente.');
    return toAuthUser(data.session.user);
  },
  async sendPasswordReset(email) {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Digite um e-mail válido.');
    const { error } = await requireClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: redirectUrl('/auth/login') });
    if (error) throw new Error('Não foi possível enviar o link agora.');
  },
  async signOut() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw new Error('Não foi possível sair. Tente novamente.');
  },
};
