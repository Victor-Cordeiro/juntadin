import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ConfirmedTransaction } from '@/state/prototype-context';
import { deleteTransaction, pushTransaction } from '@/services/transactions-remote';

export type PendingOperation =
  | { kind: 'upsert'; id: string; transaction: ConfirmedTransaction; queuedAt: string }
  | { kind: 'delete'; id: string; queuedAt: string };

export type SyncState = 'idle' | 'syncing' | 'offline';

const queueKey = (userId: string) => `@juntadin/sync-queue/${userId}`;

function serialize(operations: PendingOperation[]): string {
  return JSON.stringify(operations, (_key, value) => (typeof value === 'bigint' ? { __juntadinBigInt: value.toString() } : value));
}

function parse(raw: string): PendingOperation[] {
  return JSON.parse(raw, (_key, value) =>
    value && typeof value === 'object' && '__juntadinBigInt' in value
      ? BigInt(String((value as { __juntadinBigInt: unknown }).__juntadinBigInt))
      : value,
  ) as PendingOperation[];
}

export async function readQueue(userId: string): Promise<PendingOperation[]> {
  const raw = await AsyncStorage.getItem(queueKey(userId));
  if (!raw) return [];
  try {
    return parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(userId: string, operations: PendingOperation[]): Promise<void> {
  await AsyncStorage.setItem(queueKey(userId), serialize(operations));
}

/**
 * Records an operation to be sent later. A second change to the same transaction
 * replaces the first — only the latest state needs to reach the server.
 */
export async function enqueue(userId: string, operation: PendingOperation): Promise<void> {
  const current = await readQueue(userId);
  await writeQueue(userId, [...current.filter((item) => item.id !== operation.id), operation]);
}

export type FlushResult = { sent: number; pending: number; offline: boolean };

/**
 * Sends everything waiting, oldest first. A network failure stops the run and leaves
 * the rest queued — nothing is dropped, so a movement entered with no signal survives
 * until it reaches the server.
 *
 * A row the server rejects on its own terms (a validation error, an already deleted
 * row) is discarded instead of blocking the queue forever.
 */
export async function flushQueue(userId: string, spaceId: string): Promise<FlushResult> {
  const operations = [...(await readQueue(userId))].sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  if (operations.length === 0) return { sent: 0, pending: 0, offline: false };

  const remaining = [...operations];
  let sent = 0;

  for (const operation of operations) {
    try {
      if (operation.kind === 'upsert') await pushTransaction(operation.transaction, spaceId, userId);
      else await deleteTransaction(operation.id);
      remaining.shift();
      sent += 1;
    } catch (error) {
      if (isNetworkError(error)) {
        await writeQueue(userId, remaining);
        return { sent, pending: remaining.length, offline: true };
      }
      // The server understood and refused: retrying forever would wedge the queue.
      remaining.shift();
    }
  }

  await writeQueue(userId, remaining);
  return { sent, pending: remaining.length, offline: false };
}

/** Distinguishes "no connection" from "the server said no". */
function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('failed to');
}

export async function clearQueue(userId: string): Promise<void> {
  await AsyncStorage.removeItem(queueKey(userId));
}
