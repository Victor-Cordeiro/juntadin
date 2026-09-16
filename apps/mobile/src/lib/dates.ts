import type { RecurrenceFrequency } from '@juntadin/contracts';

export const WEEKDAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function formatLongDatePT(value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;
}

export function formatShortDatePT(value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export const recurrenceOptions: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Toda semana' },
  { value: 'biweekly', label: 'A cada 2 semanas' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'bimonthly', label: 'A cada 2 meses' },
  { value: 'quarterly', label: 'A cada 3 meses' },
  { value: 'yearly', label: 'Todo ano' },
];

export function addRecurrence(value: string, frequency: RecurrenceFrequency): string {
  const date = parseISODate(value);
  if (!date) return value;
  const next = new Date(date);
  switch (frequency) {
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'bimonthly': next.setMonth(next.getMonth() + 2); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  return toISODate(next);
}
