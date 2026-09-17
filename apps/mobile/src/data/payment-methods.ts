/** `credit` marks a method that can be paid in installments. */
export type PaymentMethodOption = Readonly<{ id: string; name: string; icon: string; credit?: boolean }>;

export const presetPaymentMethods: PaymentMethodOption[] = [
  { id: 'credit_card', name: 'Cartão de crédito', icon: 'credit_card', credit: true },
  { id: 'debit_card', name: 'Cartão de débito', icon: 'credit_card' },
  { id: 'cash', name: 'Dinheiro', icon: 'payments' },
  { id: 'bank_account', name: 'Conta bancária', icon: 'account_balance' },
  { id: 'other', name: 'Outro', icon: 'more_horiz' },
];

// A curated set for custom payment methods, matching the icon language used for categories.
export const paymentMethodIcons = [
  'credit_card', 'payments', 'account_balance', 'account_balance_wallet', 'savings',
  'qr_code_2', 'smartphone', 'wallet', 'redeem', 'currency_exchange', 'receipt_long', 'more_horiz',
];

export function findPaymentMethod(name: string, custom: PaymentMethodOption[]): PaymentMethodOption | undefined {
  return [...presetPaymentMethods, ...custom].find((method) => method.name === name);
}

export function orderPaymentMethods(items: PaymentMethodOption[], order: string[]): PaymentMethodOption[] {
  return [...items].sort((a, b) => { const ai = order.indexOf(a.id); const bi = order.indexOf(b.id); return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi); });
}
