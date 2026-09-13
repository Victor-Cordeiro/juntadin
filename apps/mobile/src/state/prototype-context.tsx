import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccountDraft, FinancialCycle, OnboardingState, SignInInput, SignUpInput, TransactionProposal } from '@juntadin/contracts';
import { appendUniqueById } from '@juntadin/domain';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { mockAuthService, type MockUser } from '@/services/auth';

export type ConfirmedTransaction = Omit<TransactionProposal, 'status'> & { status: 'confirmed'; confirmedAt: string };
type PersistedState = { session: MockUser | null; onboarding: OnboardingState; transactions: ConfirmedTransaction[] };
type Value = PersistedState & { hydrated: boolean; pendingUser: MockUser | null; proposal: TransactionProposal | null; signIn(input: SignInInput): Promise<void>; signUp(input: SignUpInput): Promise<void>; verifyEmail(): void; signOut(): void; setCycle(cycle: FinancialCycle): void; finishOnboarding(account: AccountDraft): void; setProposal(value: TransactionProposal): void; cancelProposal(): void; confirmProposal(): void };

const KEY = '@juntadin/prototype-v1';
const Context = createContext<Value | null>(null);

function serializeState(value: PersistedState): string {
  return JSON.stringify(value, (_key, item: unknown) => typeof item === 'bigint' ? { __juntadinBigInt: item.toString() } : item);
}

function parseState(raw: string): PersistedState {
  return JSON.parse(raw, (_key, item: unknown) => {
    if (item && typeof item === 'object' && '__juntadinBigInt' in item) return BigInt(String((item as { __juntadinBigInt: unknown }).__juntadinBigInt));
    return item;
  }) as PersistedState;
}

export function PrototypeProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<MockUser | null>(null);
  const [pendingUser, setPendingUser] = useState<MockUser | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState>({ completed: false });
  const [proposal, setProposal] = useState<TransactionProposal | null>(null);
  const [transactions, setTransactions] = useState<ConfirmedTransaction[]>([]);

  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (raw) { const saved = parseState(raw); setSession(saved.session); setOnboarding(saved.onboarding); setTransactions(saved.transactions ?? []); } }).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(KEY, serializeState({ session, onboarding, transactions })).catch(() => undefined); }, [hydrated, onboarding, session, transactions]);

  const value = useMemo<Value>(() => ({ hydrated, session, pendingUser, onboarding, proposal, transactions,
    async signIn(input) { setSession(await mockAuthService.signIn(input)); },
    async signUp(input) { setPendingUser(await mockAuthService.signUp(input)); },
    verifyEmail() { if (pendingUser) { setSession(pendingUser); setPendingUser(null); } },
    signOut() { setSession(null); setPendingUser(null); setProposal(null); },
    setCycle(cycle) { setOnboarding((current) => ({ ...current, cycle })); },
    finishOnboarding(account) { const trial = new Date(); trial.setDate(trial.getDate() + 60); setOnboarding((current) => ({ ...current, account, completed: true, trialEndsAt: trial.toISOString() })); },
    setProposal, cancelProposal() { setProposal(null); },
    confirmProposal() { if (!proposal) return; setTransactions((current) => appendUniqueById(current, { ...proposal, status: 'confirmed', confirmedAt: new Date().toISOString() })); setProposal(null); },
  }), [hydrated, onboarding, pendingUser, proposal, session, transactions]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePrototype() { const value = useContext(Context); if (!value) throw new Error('usePrototype must be used inside PrototypeProvider'); return value; }
