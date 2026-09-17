import type { PendingItem } from '@juntadin/contracts';

import { supabase } from '@/lib/supabase';

/** A pending_items row as it lives in Postgres. */
export type RemotePendingItem = {
  id: string;
  space_id: string;
  kind: 'payable' | 'receivable';
  description: string;
  amount_cents: string | number;
  due_date: string;
  category: string;
  payment_method: string | null;
  party: string;
  note: string | null;
  recurrence: string | null;
  status: 'pending' | 'settled';
  settled_at: string | null;
  settled_transaction_id: string | null;
  created_by: string;
  created_at: string;
};

export function toLocal(row: RemotePendingItem): PendingItem {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    amountCents: BigInt(row.amount_cents),
    dueDate: row.due_date,
    category: row.category,
    paymentMethod: row.payment_method ?? undefined,
    party: row.party as PendingItem['party'],
    note: row.note ?? undefined,
    recurrence: row.recurrence ? { frequency: row.recurrence as never } : undefined,
    status: row.status,
    settledAt: row.settled_at ?? undefined,
    settledTransactionId: row.settled_transaction_id ?? undefined,
  };
}

export function toRemote(item: PendingItem, spaceId: string, userId: string) {
  return {
    id: /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : undefined,
    space_id: spaceId,
    kind: item.kind,
    description: item.description,
    amount_cents: item.amountCents.toString(),
    due_date: item.dueDate,
    category: item.category,
    payment_method: item.paymentMethod || null,
    party: item.party,
    note: item.note ?? null,
    recurrence: item.recurrence?.frequency ?? null,
    status: item.status,
    settled_at: item.settledAt ?? null,
    settled_transaction_id: item.settledTransactionId ?? null,
    created_by: userId,
  };
}

export async function fetchPendingItems(spaceId: string): Promise<PendingItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('pending_items').select('*').eq('space_id', spaceId).order('due_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as RemotePendingItem[]).map(toLocal);
}

export async function pushPendingItem(item: PendingItem, spaceId: string, userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const payload = toRemote(item, spaceId, userId);
  const { data, error } = await supabase.from('pending_items').upsert(payload).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deletePendingItem(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('pending_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
