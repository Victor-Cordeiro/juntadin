import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PendingItem } from '@juntadin/contracts';
import { deletePendingItem, pushPendingItem } from '@/services/bills-remote';

export type BillsPendingOperation =
  | { kind: 'upsert'; id: string; item: PendingItem; queuedAt: string }
  | { kind: 'delete'; id: string; queuedAt: string };

const queueKey = (userId: string) => `@juntadin/bills-sync-queue/${userId}`;

function serialize(operations: BillsPendingOperation[]): string {
  return JSON.stringify(operations, (_key, value) => (typeof value === 'bigint' ? { __juntadinBigInt: value.toString() } : value));
}

function parse(raw: string): BillsPendingOperation[] {
  return JSON.parse(raw, (_key, value) =>
    value && typeof value === 'object' && '__juntadinBigInt' in value
      ? BigInt(String((value as { __juntadinBigInt: unknown }).__juntadinBigInt))
      : value,
  ) as BillsPendingOperation[];
}

export async function readBillsQueue(userId: string): Promise<BillsPendingOperation[]> {
  const raw = await AsyncStorage.getItem(queueKey(userId));
  if (!raw) return [];
  try {
    return parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(userId: string, operations: BillsPendingOperation[]): Promise<void> {
  await AsyncStorage.setItem(queueKey(userId), serialize(operations));
}

/** A second change to the same item replaces the first — only the latest state needs to reach the server. */
export async function enqueueBillsOperation(userId: string, operation: BillsPendingOperation): Promise<void> {
  const current = await readBillsQueue(userId);
  await writeQueue(userId, [...current.filter((entry) => entry.id !== operation.id), operation]);
}

export type BillsFlushResult = { sent: number; pending: number; offline: boolean };

export async function flushBillsQueue(userId: string, spaceId: string): Promise<BillsFlushResult> {
  const operations = [...(await readBillsQueue(userId))].sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  if (operations.length === 0) return { sent: 0, pending: 0, offline: false };

  const remaining = [...operations];
  let sent = 0;

  for (const operation of operations) {
    try {
      if (operation.kind === 'upsert') await pushPendingItem(operation.item, spaceId, userId);
      else await deletePendingItem(operation.id);
      remaining.shift();
      sent += 1;
    } catch (error) {
      if (isNetworkError(error)) {
        await writeQueue(userId, remaining);
        return { sent, pending: remaining.length, offline: true };
      }
      await writeQueue(userId, remaining);
      return { sent, pending: remaining.length, offline: true };
    }
  }

  await writeQueue(userId, remaining);
  return { sent, pending: remaining.length, offline: false };
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('failed to');
}
