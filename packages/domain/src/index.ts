export type Money = Readonly<{
  currency: 'BRL';
  cents: bigint;
}>;

export const money = (cents: bigint): Money => ({ currency: 'BRL', cents });

export function formatBRL(cents: bigint): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100);
}

export function formatMoney(cents: bigint, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(cents) / 100);
  } catch {
    return formatBRL(cents);
  }
}

export function parseBRL(value: string): bigint | null {
  const amount = Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? BigInt(Math.round(amount * 100)) : null;
}

export function appendUniqueById<T extends { id: string }>(items: readonly T[], item: T): T[] {
  return items.some((current) => current.id === item.id) ? [...items] : [...items, item];
}
