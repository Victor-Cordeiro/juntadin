import type { TransactionKind, TransactionParty } from '@juntadin/contracts';

import type { ConfirmedTransaction } from '@/state/prototype-context';
import { addRecurrence, parseISODate, toISODate } from '@/lib/dates';

export type Slice = { key: string; label: string; total: bigint; share: number; color: string; icon?: string };
export type DayGroup = { date: string; income: bigint; expense: bigint; items: ConfirmedTransaction[] };
export type MonthPoint = { key: string; date: Date; income: bigint; expense: bigint; projected: boolean };

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date).replace(/^./, (letter) => letter.toUpperCase());
}

export function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '') + '.';
}

export function dayLabel(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(date);
}

export function inMonth(transactions: ConfirmedTransaction[], key: string): ConfirmedTransaction[] {
  return transactions.filter((item) => item.localDate.startsWith(key));
}

export function sumOf(items: ConfirmedTransaction[], kind?: TransactionKind): bigint {
  return items.reduce((sum, item) => (kind && item.kind !== kind ? sum : sum + item.amountCents), 0n);
}

function share(total: bigint, sum: bigint): number {
  return sum > 0n ? Number((total * 10000n) / sum) / 100 : 0;
}

/** Aggregates by a field, biggest first, capped so the donut stays readable — the rest folds into "Outros". */
export function groupSlices(
  items: ConfirmedTransaction[],
  pick: (item: ConfirmedTransaction) => string,
  decorate: (key: string) => { label: string; color: string; icon?: string },
  limit = 5,
): Slice[] {
  const totals = new Map<string, bigint>();
  for (const item of items) totals.set(pick(item), (totals.get(pick(item)) ?? 0n) + item.amountCents);
  const sum = [...totals.values()].reduce((total, value) => total + value, 0n);
  const sorted = [...totals.entries()].sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0));
  const top = sorted.slice(0, limit).map(([key, total]) => ({ key, total, share: share(total, sum), ...decorate(key) }));
  const restTotal = sorted.slice(limit).reduce((total, [, value]) => total + value, 0n);
  return restTotal > 0n
    ? [...top, { key: '__other__', label: 'Outros', total: restTotal, share: share(restTotal, sum), color: '#8A9A93', icon: 'more_horiz' }]
    : top;
}

export function groupByDay(items: ConfirmedTransaction[]): DayGroup[] {
  const days = new Map<string, ConfirmedTransaction[]>();
  for (const item of items) days.set(item.localDate, [...(days.get(item.localDate) ?? []), item]);
  return [...days.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({ date, items: entries, income: sumOf(entries, 'income'), expense: sumOf(entries, 'expense') }));
}

export function monthSeries(transactions: ConfirmedTransaction[], endMonth: Date, months: number): MonthPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const date = addMonths(endMonth, index - months + 1);
    const key = monthKeyOf(date);
    const items = inMonth(transactions, key);
    return { key, date, income: sumOf(items, 'income'), expense: sumOf(items, 'expense'), projected: false };
  });
}

/**
 * Projects recurring movements forward: each recurring transaction is stepped by its own
 * frequency and counted in whichever future month each occurrence lands in.
 */
export function projectMonths(transactions: ConfirmedTransaction[], fromMonth: Date, months: number): MonthPoint[] {
  const recurring = transactions.filter((item) => item.recurrence);
  const horizonEnd = addMonths(fromMonth, months);
  const points = Array.from({ length: months }, (_, index) => {
    const date = addMonths(fromMonth, index + 1);
    return { key: monthKeyOf(date), date, income: 0n, expense: 0n, projected: true };
  });
  const byKey = new Map(points.map((point) => [point.key, point]));

  for (const item of recurring) {
    let cursor = item.localDate;
    for (let step = 0; step < 240; step += 1) {
      cursor = addRecurrence(cursor, item.recurrence!.frequency);
      const date = parseISODate(cursor);
      if (!date || date > addMonths(horizonEnd, 1)) break;
      const point = byKey.get(monthKeyOf(date));
      if (!point) continue;
      if (item.kind === 'income') point.income += item.amountCents;
      else point.expense += item.amountCents;
    }
  }
  return points;
}

export const partyLabels: Record<TransactionParty, string> = { me: 'Eu', partner: 'Parceiro(a)', shared: 'Compartilhado' };

export function todayKey(): string {
  return toISODate(new Date());
}
