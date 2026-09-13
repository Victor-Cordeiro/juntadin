import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccountDraft, FinancialCycle, OnboardingState, SignInInput, SignUpInput, TransactionProposal } from '@juntadin/contracts';
import { appendUniqueById } from '@juntadin/domain';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authService, type AuthUser } from '@/services/auth';

export type ConfirmedTransaction = Omit<TransactionProposal, 'status'> & { status: 'confirmed'; confirmedAt: string };
type UserState = { onboarding: OnboardingState; transactions: ConfirmedTransaction[] };
type Value = UserState & { hydrated: boolean; session: AuthUser | null; pendingUser: AuthUser | null; proposal: TransactionProposal | null; signIn(input: SignInInput): Promise<void>; signUp(input: SignUpInput): Promise<void>; verifyEmail(): Promise<void>; signOut(): Promise<void>; setCycle(cycle: FinancialCycle): void; finishOnboarding(account: AccountDraft): void; setProposal(value: TransactionProposal): void; cancelProposal(): void; confirmProposal(): void };

const Context = createContext<Value | null>(null);
const emptyState: UserState = { onboarding: { completed: false }, transactions: [] };
const storageKey = (userId: string) => `@juntadin/prototype-v2/${userId}`;

function serializeState(value: UserState): string { return JSON.stringify(value, (_key, item: unknown) => typeof item === 'bigint' ? { __juntadinBigInt: item.toString() } : item); }
function parseState(raw: string): UserState { return JSON.parse(raw, (_key, item: unknown) => item && typeof item === 'object' && '__juntadinBigInt' in item ? BigInt(String((item as { __juntadinBigInt: unknown }).__juntadinBigInt)) : item) as UserState; }

export function PrototypeProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false); const [session, setSession] = useState<AuthUser | null>(null); const [pendingUser, setPendingUser] = useState<AuthUser | null>(null); const [onboarding, setOnboarding] = useState<OnboardingState>(emptyState.onboarding); const [proposal, setProposal] = useState<TransactionProposal | null>(null); const [transactions, setTransactions] = useState<ConfirmedTransaction[]>([]);

  const loadUserState = useCallback(async (user: AuthUser | null) => {
    if (!user) { setOnboarding(emptyState.onboarding); setTransactions([]); return; }
    const raw = await AsyncStorage.getItem(storageKey(user.id)); const saved = raw ? parseState(raw) : emptyState; setOnboarding(saved.onboarding); setTransactions(saved.transactions);
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = authService.onAuthStateChange((_event, user) => { if (!active) return; setSession(user); loadUserState(user).finally(() => setHydrated(true)); });
    authService.restoreSession().then(async (user) => { if (!active) return; setSession(user); await loadUserState(user); }).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; unsubscribe(); };
  }, [loadUserState]);

  useEffect(() => { if (hydrated && session) AsyncStorage.setItem(storageKey(session.id), serializeState({ onboarding, transactions })).catch(() => undefined); }, [hydrated, onboarding, session, transactions]);

  const value = useMemo<Value>(() => ({ hydrated, session, pendingUser, onboarding, proposal, transactions,
    async signIn(input) { setHydrated(false); try { const user = await authService.signIn(input); setSession(user); await loadUserState(user); } finally { setHydrated(true); } },
    async signUp(input) { setPendingUser(await authService.signUp(input)); },
    async verifyEmail() { const user = await authService.confirmEmailSession(); setSession(user); setPendingUser(null); await loadUserState(user); },
    async signOut() { await authService.signOut(); setSession(null); setPendingUser(null); setProposal(null); setOnboarding(emptyState.onboarding); setTransactions([]); },
    setCycle(cycle) { setOnboarding((current) => ({ ...current, cycle })); },
    finishOnboarding(account) { const trial = new Date(); trial.setDate(trial.getDate() + 60); setOnboarding((current) => ({ ...current, account, completed: true, trialEndsAt: trial.toISOString() })); },
    setProposal, cancelProposal() { setProposal(null); },
    confirmProposal() { if (!proposal) return; setTransactions((current) => appendUniqueById(current, { ...proposal, status: 'confirmed', confirmedAt: new Date().toISOString() })); setProposal(null); },
  }), [hydrated, loadUserState, onboarding, pendingUser, proposal, session, transactions]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePrototype() { const value = useContext(Context); if (!value) throw new Error('usePrototype must be used inside PrototypeProvider'); return value; }
