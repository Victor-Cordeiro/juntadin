import type { TransactionParty } from '@juntadin/contracts';

import { supabase } from '@/lib/supabase';
import type { ConfirmedTransaction } from '@/state/prototype-context';

/** A transaction row as it lives in Postgres. */
export type RemoteTransaction = {
  id: string;
  space_id: string;
  kind: 'expense' | 'income';
  description: string;
  amount_cents: string | number;
  category: string;
  payment_method: string | null;
  local_date: string;
  note: string | null;
  paid_by: string;
  payer_percent: number;
  recurrence: string | null;
  purchase_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  purchase_amount_cents: string | number | null;
  created_by: string;
  created_at: string;
};

/**
 * `party` is written from the point of view of whoever is looking: my "me" is your
 * "partner". The database stores who actually paid, so the label is derived per viewer.
 */
export function partyOf(row: { paid_by: string; payer_percent: number }, viewerId: string): TransactionParty {
  if (row.payer_percent < 100) return 'shared';
  return row.paid_by === viewerId ? 'me' : 'partner';
}

export function toLocal(row: RemoteTransaction, viewerId: string): ConfirmedTransaction {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    amountCents: BigInt(row.amount_cents),
    accountName: 'Conta principal',
    category: row.category,
    paymentMethod: row.payment_method ?? '',
    localDate: row.local_date,
    note: row.note ?? undefined,
    party: partyOf(row, viewerId),
    recurrence: row.recurrence ? { frequency: row.recurrence as never } : undefined,
    installment: row.purchase_id && row.installment_number && row.installment_total && row.purchase_amount_cents
      ? { purchaseId: row.purchase_id, number: row.installment_number, total: row.installment_total, purchaseAmountCents: BigInt(row.purchase_amount_cents) }
      : undefined,
    status: 'confirmed',
    confirmedAt: row.created_at,
  };
}

export function toRemote(item: ConfirmedTransaction, spaceId: string, userId: string) {
  return {
    id: /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : undefined,
    space_id: spaceId,
    kind: item.kind,
    description: item.description,
    amount_cents: item.amountCents.toString(),
    category: item.category,
    payment_method: item.paymentMethod || null,
    local_date: item.localDate,
    note: item.note ?? null,
    // Until a real partner exists, everything is paid by the person entering it.
    paid_by: userId,
    payer_percent: item.party === 'shared' ? 50 : 100,
    recurrence: item.recurrence?.frequency ?? null,
    purchase_id: item.installment?.purchaseId ?? null,
    installment_number: item.installment?.number ?? null,
    installment_total: item.installment?.total ?? null,
    purchase_amount_cents: item.installment?.purchaseAmountCents.toString() ?? null,
    created_by: userId,
  };
}

/** The space whose data this user should see: the shared one when it exists. */
export async function resolveSpaceId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('spaces')
    .select('id, kind')
    .order('kind', { ascending: true }); // 'household' sorts before 'personal'
  if (error || !data?.length) return null;
  return (data.find((space) => space.kind === 'household') ?? data[0]).id;
}

export async function fetchTransactions(spaceId: string, viewerId: string): Promise<ConfirmedTransaction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('transactions').select('*').eq('space_id', spaceId).order('local_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as RemoteTransaction[]).map((row) => toLocal(row, viewerId));
}

export async function pushTransaction(item: ConfirmedTransaction, spaceId: string, userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const payload = toRemote(item, spaceId, userId);
  const { data, error } = await supabase.from('transactions').upsert(payload).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
