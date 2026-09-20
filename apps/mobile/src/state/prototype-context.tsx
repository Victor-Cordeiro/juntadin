import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccountDraft, FinancialCycle, OnboardingState, PendingItem, SignInInput, SignUpInput, TransactionProposal } from '@juntadin/contracts';
import { appendUniqueById } from '@juntadin/domain';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { authService, type AuthUser } from '@/services/auth';
import type { Category, CategoryKind } from '@/data/categories';
import { buildInstallmentTransactions } from '@/lib/installments';
import { addRecurrence } from '@/lib/dates';
import { uuid } from '@/lib/uuid';
import type { PaymentMethodOption } from '@/data/payment-methods';
import { fetchTransactions, resolveSpaceId } from '@/services/transactions-remote';
import { fetchPendingItems } from '@/services/bills-remote';
import { enqueue, flushQueue, readQueue, type SyncState } from '@/services/sync-queue';
import { enqueueBillsOperation, flushBillsQueue, readBillsQueue } from '@/services/bills-sync-queue';

export type ConfirmedTransaction = Omit<TransactionProposal, 'status'> & { status: 'confirmed'; confirmedAt: string };
type UserState = { onboarding: OnboardingState; transactions: ConfirmedTransaction[]; pendingItems: PendingItem[]; customCategories: { expense: Category[]; income: Category[] }; customPaymentMethods: PaymentMethodOption[]; categoryOrder: { expense: string[]; income: string[] }; paymentMethodOrder: string[] };
type SettleInput = { settledDate: string; paymentMethod?: string };
type SettleResult = { transactionId: string; nextDueDate?: string };
type Value = UserState & { hydrated: boolean; session: AuthUser | null; pendingUser: AuthUser | null; proposal: TransactionProposal | null; syncState: SyncState; pendingSyncCount: number; signIn(input: SignInInput): Promise<void>; signInWithGoogle(): Promise<void>; signUp(input: SignUpInput): Promise<void>; verifyEmail(): Promise<void>; signOut(): Promise<void>; setCycle(cycle: FinancialCycle): void; finishOnboarding(account: AccountDraft): void; setProposal(value: TransactionProposal): void; addCustomCategory(kind: CategoryKind, category: Category): void; addCustomPaymentMethod(method: PaymentMethodOption): void; reorderCategories(kind: CategoryKind, ids: string[]): void; reorderPaymentMethods(ids: string[]): void; cancelProposal(): void; confirmProposal(): void; addTransaction(transaction: ConfirmedTransaction): void; updateTransaction(id: string, changes: Partial<ConfirmedTransaction>): void; removeTransaction(id: string): void; replaceTransactions(next: ConfirmedTransaction[]): void; addPendingItem(item: PendingItem): void; updatePendingItem(id: string, changes: Partial<PendingItem>): void; removePendingItem(id: string): void; settlePendingItem(id: string, input: SettleInput): SettleResult | undefined };

const Context = createContext<Value | null>(null);
const emptyState: UserState = { onboarding: { completed: false }, transactions: [], pendingItems: [], customCategories: { expense: [], income: [] }, customPaymentMethods: [], categoryOrder: { expense: [], income: [] }, paymentMethodOrder: [] };
const storageKey = (userId: string) => `@juntadin/prototype-v2/${userId}`;

function serializeState(value: UserState): string { return JSON.stringify(value, (_key, item: unknown) => typeof item === 'bigint' ? { __juntadinBigInt: item.toString() } : item); }
function parseState(raw: string): UserState { const parsed = JSON.parse(raw, (_key, item: unknown) => item && typeof item === 'object' && '__juntadinBigInt' in item ? BigInt(String((item as { __juntadinBigInt: unknown }).__juntadinBigInt)) : item) as Partial<UserState>; const customCategories = parsed.customCategories ?? emptyState.customCategories; const normalize = (items: unknown[], kind: CategoryKind): Category[] => items.map((item, index) => { if (typeof item === 'string') return { id: `legacy-${kind}-${index}`, name: item, icon: 'sell', color: '#0E7A63' }; const category = item as Category; return { ...category, icon: /^[a-z0-9_]+$/.test(category.icon) ? category.icon : 'category' }; }); return { onboarding: parsed.onboarding ?? emptyState.onboarding, transactions: parsed.transactions ?? [], pendingItems: parsed.pendingItems ?? [], customCategories: { expense: normalize(customCategories.expense ?? [], 'expense'), income: normalize(customCategories.income ?? [], 'income') }, customPaymentMethods: parsed.customPaymentMethods ?? emptyState.customPaymentMethods, categoryOrder: parsed.categoryOrder ?? emptyState.categoryOrder, paymentMethodOrder: parsed.paymentMethodOrder ?? emptyState.paymentMethodOrder }; }

/**
 * Pulls must not erase an optimistic local write. A foreground sync can overlap the
 * enqueue/flush started by the same confirmation, so a stale remote list is not
 * authoritative for rows that only exist locally yet.
 */
function mergeRemote<T extends { id: string }>(local: T[], remote: T[], pendingIds: Set<string>): T[] {
  const remoteIds = new Set(remote.map((row) => row.id));
  const stillLocal = local.filter((item) => pendingIds.has(item.id) || !remoteIds.has(item.id));
  return [...remote, ...stillLocal];
}

export function PrototypeProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false); const [session, setSession] = useState<AuthUser | null>(null); const [pendingUser, setPendingUser] = useState<AuthUser | null>(null); const [onboarding, setOnboarding] = useState<OnboardingState>(emptyState.onboarding); const [proposal, setProposal] = useState<TransactionProposal | null>(null); const [transactions, setTransactions] = useState<ConfirmedTransaction[]>([]); const [pendingItems, setPendingItems] = useState<PendingItem[]>([]); const [customCategories, setCustomCategories] = useState(emptyState.customCategories); const [customPaymentMethods, setCustomPaymentMethods] = useState(emptyState.customPaymentMethods); const [categoryOrder, setCategoryOrder] = useState(emptyState.categoryOrder); const [paymentMethodOrder, setPaymentMethodOrder] = useState(emptyState.paymentMethodOrder);
  const [syncState, setSyncState] = useState<SyncState>('idle'); const [pendingSyncCount, setPendingSyncCount] = useState(0);
  // A ref, not state: every write path reads it synchronously to decide whether to
  // queue at all, and re-render on its own would just be noise.
  const spaceIdRef = useRef<string | null>(null);

  const loadUserState = useCallback(async (user: AuthUser | null) => {
    spaceIdRef.current = null;
    if (!user) { setOnboarding(emptyState.onboarding); setTransactions([]); setPendingItems([]); setCustomCategories(emptyState.customCategories); setCustomPaymentMethods(emptyState.customPaymentMethods); setCategoryOrder(emptyState.categoryOrder); setPaymentMethodOrder([]); return; }
    const raw = await AsyncStorage.getItem(storageKey(user.id)); const saved = raw ? parseState(raw) : emptyState; setOnboarding(saved.onboarding); setTransactions(saved.transactions); setPendingItems(saved.pendingItems); setCustomCategories(saved.customCategories); setCustomPaymentMethods(saved.customPaymentMethods); setCategoryOrder(saved.categoryOrder); setPaymentMethodOrder(saved.paymentMethodOrder);
  }, []);

  /**
   * Pushes whatever is queued, then pulls the server's current list. Safe to call
   * often — it's a no-op once the queue is empty and nothing changed remotely — so it
   * runs after every write and whenever the app comes back to the foreground, which is
   * the only "we might be back online" signal available without a network-state library.
   */
  const runSync = useCallback(async (user: AuthUser) => {
    if (!spaceIdRef.current) spaceIdRef.current = await resolveSpaceId();
    const spaceId = spaceIdRef.current;
    if (!spaceId) return;
    setSyncState('syncing');
    try {
      const [flush, billsFlush] = await Promise.all([flushQueue(user.id, spaceId), flushBillsQueue(user.id, spaceId)]);
      setPendingSyncCount(flush.pending + billsFlush.pending);
      if (flush.offline || billsFlush.offline) { setSyncState('offline'); return; }
      const [pending, billsPending, remote, remoteBills] = await Promise.all([
        readQueue(user.id), readBillsQueue(user.id), fetchTransactions(spaceId, user.id), fetchPendingItems(spaceId),
      ]);
      setTransactions((current) => mergeRemote(current, remote, new Set(pending.map((operation) => operation.id))));
      setPendingItems((current) => mergeRemote(current, remoteBills, new Set(billsPending.map((operation) => operation.id))));
      setSyncState('idle');
    } catch {
      setSyncState('offline');
    }
  }, []);

  // Records a change locally first, then fires a background push — the caller never
  // waits on the network, and a failed push just leaves the item queued for next time.
  const queueUpsert = useCallback((items: ConfirmedTransaction[]) => {
    const user = session;
    if (!user) return;
    const queuedAt = new Date().toISOString();
    Promise.all(items.map((item) => enqueue(user.id, { kind: 'upsert', id: item.id, transaction: item, queuedAt })))
      .then(() => runSync(user))
      .catch(() => undefined);
  }, [runSync, session]);

  const queueDelete = useCallback((id: string) => {
    const user = session;
    if (!user) return;
    enqueue(user.id, { kind: 'delete', id, queuedAt: new Date().toISOString() }).then(() => runSync(user)).catch(() => undefined);
  }, [runSync, session]);

  const queueBillUpsert = useCallback((items: PendingItem[]) => {
    const user = session;
    if (!user) return;
    const queuedAt = new Date().toISOString();
    Promise.all(items.map((item) => enqueueBillsOperation(user.id, { kind: 'upsert', id: item.id, item, queuedAt })))
      .then(() => runSync(user))
      .catch(() => undefined);
  }, [runSync, session]);

  const queueBillDelete = useCallback((id: string) => {
    const user = session;
    if (!user) return;
    enqueueBillsOperation(user.id, { kind: 'delete', id, queuedAt: new Date().toISOString() }).then(() => runSync(user)).catch(() => undefined);
  }, [runSync, session]);

  useEffect(() => {
    let active = true;
    const unsubscribe = authService.onAuthStateChange((_event, user) => { if (!active) return; setSession(user); loadUserState(user).finally(() => { setHydrated(true); if (user) runSync(user); }); });
    authService.restoreSession().then(async (user) => { if (!active) return; setSession(user); await loadUserState(user); if (user) runSync(user); }).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUserState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active' && session) runSync(session); });
    return () => subscription.remove();
  }, [runSync, session]);

  useEffect(() => { if (hydrated && session) AsyncStorage.setItem(storageKey(session.id), serializeState({ onboarding, transactions, pendingItems, customCategories, customPaymentMethods, categoryOrder, paymentMethodOrder })).catch(() => undefined); }, [categoryOrder, customCategories, customPaymentMethods, hydrated, onboarding, paymentMethodOrder, pendingItems, session, transactions]);

  const value = useMemo<Value>(() => ({ hydrated, session, pendingUser, onboarding, proposal, transactions, pendingItems, customCategories, customPaymentMethods, categoryOrder, paymentMethodOrder, syncState, pendingSyncCount,
    async signIn(input) { setHydrated(false); try { const user = await authService.signIn(input); setSession(user); await loadUserState(user); } finally { setHydrated(true); } },
    async signInWithGoogle() { setHydrated(false); try { const user = await authService.signInWithGoogle(); setSession(user); await loadUserState(user); } finally { setHydrated(true); } },
    async signUp(input) { const user = await authService.signUp(input); setPendingUser(null); setSession(user); await loadUserState(user); },
    async verifyEmail() { const user = await authService.confirmEmailSession(); setSession(user); setPendingUser(null); await loadUserState(user); },
    async signOut() { await authService.signOut(); setSession(null); setPendingUser(null); setProposal(null); setOnboarding(emptyState.onboarding); setTransactions([]); setPendingItems([]); setCustomCategories(emptyState.customCategories); setCustomPaymentMethods(emptyState.customPaymentMethods); setCategoryOrder(emptyState.categoryOrder); setPaymentMethodOrder([]); },
    setCycle(cycle) { setOnboarding((current) => ({ ...current, cycle })); },
    finishOnboarding(account) { const trial = new Date(); trial.setDate(trial.getDate() + 60); setOnboarding((current) => ({ ...current, account, completed: true, trialEndsAt: trial.toISOString() })); },
    setProposal, cancelProposal() { setProposal(null); },
    addCustomCategory(kind, category) { setCustomCategories((current) => current[kind].some((item) => item.name.toLocaleLowerCase('pt-BR') === category.name.toLocaleLowerCase('pt-BR')) ? current : { ...current, [kind]: [...current[kind], category] }); },
    addCustomPaymentMethod(method) { setCustomPaymentMethods((current) => current.some((item) => item.name.toLocaleLowerCase('pt-BR') === method.name.toLocaleLowerCase('pt-BR')) ? current : [...current, method]); },
    reorderCategories(kind, ids) { setCategoryOrder((current) => ({ ...current, [kind]: ids })); },
    reorderPaymentMethods(ids) { setPaymentMethodOrder(ids); },
    confirmProposal() {
      if (!proposal) return;
      const confirmedAt = new Date().toISOString();
      // An installment purchase becomes one transaction per month, so every screen
      // that already sums a month reports the right figure with no extra logic.
      const entries = proposal.installment && proposal.installment.total > 1
        ? buildInstallmentTransactions(proposal, proposal.installment.total)
        : [proposal];
      const confirmed = entries.map((entry) => ({ ...entry, status: 'confirmed' as const, confirmedAt }));
      setTransactions((current) => confirmed.reduce((list, entry) => appendUniqueById(list, entry), current));
      queueUpsert(confirmed);
      setProposal(null);
    },
    addTransaction(transaction) { setTransactions((current) => appendUniqueById(current, transaction)); queueUpsert([transaction]); },
    updateTransaction(id, changes) {
      let updated: ConfirmedTransaction | undefined;
      setTransactions((current) => current.map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...changes };
        return updated;
      }));
      if (updated) queueUpsert([updated]);
    },
    removeTransaction(id) { setTransactions((current) => current.filter((item) => item.id !== id)); queueDelete(id); },
    // Seeding/clearing test data stays on this device only — it must never reach the shared space.
    replaceTransactions(next) { setTransactions(next); },
    addPendingItem(item) { setPendingItems((current) => appendUniqueById(current, item)); queueBillUpsert([item]); },
    updatePendingItem(id, changes) {
      let updated: PendingItem | undefined;
      setPendingItems((current) => current.map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...changes };
        return updated;
      }));
      if (updated) queueBillUpsert([updated]);
    },
    removePendingItem(id) { setPendingItems((current) => current.filter((item) => item.id !== id)); queueBillDelete(id); },
    settlePendingItem(id, input) {
      const item = pendingItems.find((entry) => entry.id === id);
      if (!item) return undefined;
      const confirmedAt = new Date().toISOString();
      const transaction: ConfirmedTransaction = {
        id: uuid(),
        kind: item.kind === 'payable' ? 'expense' : 'income',
        description: item.description,
        amountCents: item.amountCents,
        accountName: 'Conta principal',
        category: item.category,
        localDate: input.settledDate,
        party: item.party,
        paymentMethod: input.paymentMethod ?? item.paymentMethod ?? 'Conta bancária',
        note: item.note,
        status: 'confirmed',
        confirmedAt,
      };
      setTransactions((current) => appendUniqueById(current, transaction));
      queueUpsert([transaction]);
      const settled: PendingItem = { ...item, status: 'settled', settledAt: confirmedAt, settledTransactionId: transaction.id };
      setPendingItems((current) => current.map((entry) => (entry.id === id ? settled : entry)));
      queueBillUpsert([settled]);
      return { transactionId: transaction.id, nextDueDate: item.recurrence ? addRecurrence(item.dueDate, item.recurrence.frequency) : undefined };
    },
  }), [categoryOrder, customCategories, customPaymentMethods, hydrated, loadUserState, onboarding, paymentMethodOrder, pendingItems, pendingSyncCount, pendingUser, proposal, queueBillDelete, queueBillUpsert, queueDelete, queueUpsert, session, syncState, transactions]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePrototype() { const value = useContext(Context); if (!value) throw new Error('usePrototype must be used inside PrototypeProvider'); return value; }
