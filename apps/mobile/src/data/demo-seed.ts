import type { RecurrenceFrequency, TransactionParty } from '@juntadin/contracts';

import type { ConfirmedTransaction } from '@/state/prototype-context';
import { toISODate } from '@/lib/dates';

type Spec = {
  description: string;
  category: string;
  method: string;
  cents: number;
  day: number;
  party?: TransactionParty;
  recurrence?: RecurrenceFrequency;
};

const expenseSpecs: Spec[] = [
  { description: 'Aluguel', category: 'Aluguel', method: 'Conta bancária', cents: 180000, day: 5, party: 'shared', recurrence: 'monthly' },
  { description: 'Internet e telefone', category: 'Casa', method: 'Conta bancária', cents: 15990, day: 8, party: 'shared', recurrence: 'monthly' },
  { description: 'Energia elétrica', category: 'Casa', method: 'Conta bancária', cents: 21450, day: 12, party: 'shared' },
  { description: 'Compras do mês', category: 'Mercado', method: 'Cartão', cents: 68200, day: 6, party: 'me' },
  { description: 'Feira da semana', category: 'Mercado', method: 'Dinheiro', cents: 9800, day: 13, party: 'me' },
  { description: 'Feira da semana', category: 'Mercado', method: 'Dinheiro', cents: 11200, day: 20, party: 'partner' },
  { description: 'Padaria', category: 'Comida', method: 'Dinheiro', cents: 3450, day: 3, party: 'me' },
  { description: 'Almoço no trabalho', category: 'Comida', method: 'Cartão', cents: 4200, day: 9, party: 'me' },
  { description: 'Jantar fora', category: 'Restaurantes', method: 'Cartão', cents: 18900, day: 16, party: 'shared' },
  { description: 'Café com amigos', category: 'Restaurantes', method: 'Cartão', cents: 5600, day: 22, party: 'partner' },
  { description: 'Farmácia', category: 'Saúde', method: 'Cartão', cents: 8730, day: 11, party: 'me' },
  { description: 'Plano de saúde', category: 'Saúde', method: 'Conta bancária', cents: 42000, day: 10, party: 'shared', recurrence: 'monthly' },
  { description: 'Combustível', category: 'Transporte', method: 'Cartão', cents: 25000, day: 7, party: 'me' },
  { description: 'Aplicativo de corrida', category: 'Transporte', method: 'Cartão', cents: 4380, day: 18, party: 'partner' },
  { description: 'Cinema', category: 'Diversão', method: 'Cartão', cents: 9000, day: 21, party: 'shared' },
  { description: 'Streaming', category: 'Entretenimento', method: 'Cartão', cents: 5590, day: 15, party: 'shared', recurrence: 'monthly' },
  { description: 'Academia', category: 'Saúde', method: 'Cartão', cents: 12990, day: 14, party: 'me', recurrence: 'monthly' },
  { description: 'Roupas', category: 'Compras', method: 'Cartão', cents: 23900, day: 24, party: 'partner' },
  { description: 'Presente de aniversário', category: 'Extra', method: 'Cartão', cents: 15000, day: 19, party: 'shared' },
  { description: 'Material escolar', category: 'Filhos', method: 'Cartão', cents: 8900, day: 4, party: 'partner' },
  { description: 'Parcela do empréstimo', category: 'Empréstimo', method: 'Conta bancária', cents: 32000, day: 10, party: 'me', recurrence: 'monthly' },
];

const incomeSpecs: Spec[] = [
  { description: 'Salário', category: 'Salário', method: 'Conta bancária', cents: 520000, day: 5, party: 'me', recurrence: 'monthly' },
  { description: 'Salário do parceiro', category: 'Salário', method: 'Conta bancária', cents: 410000, day: 5, party: 'partner', recurrence: 'monthly' },
  { description: 'Freelance', category: 'Bônus', method: 'Conta bancária', cents: 95000, day: 17, party: 'me' },
  { description: 'Rendimento da reserva', category: 'Investimentos', method: 'Conta bancária', cents: 18700, day: 28, party: 'shared' },
];

/** Deterministic jitter so repeated seeds look varied but stay reproducible. */
function vary(cents: number, monthOffset: number, index: number): number {
  const swing = ((monthOffset * 7 + index * 13) % 21) - 10; // −10%..+10%
  return Math.round((cents * (100 + swing)) / 100);
}

/**
 * Six months of movements ending in the current month, so every chart — daily,
 * categories, methods, people and the six-month trend — has something to show.
 */
export function buildDemoTransactions(now = new Date()): ConfirmedTransaction[] {
  const transactions: ConfirmedTransaction[] = [];
  const confirmedAt = now.toISOString();

  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const isCurrentMonth = monthOffset === 0;
    const specs = [...expenseSpecs, ...incomeSpecs];

    specs.forEach((spec, index) => {
      // Only the current month is partially filled — the day must not run past today.
      const day = Math.min(spec.day, lastDay);
      if (isCurrentMonth && day > now.getDate()) return;
      // Older months skip a few entries so the trend line is not perfectly flat.
      if (!isCurrentMonth && (monthOffset * 3 + index) % 7 === 0) return;

      const kind = incomeSpecs.includes(spec) ? 'income' : 'expense';
      transactions.push({
        id: `demo-${monthOffset}-${index}`,
        kind,
        description: spec.description,
        amountCents: BigInt(vary(spec.cents, monthOffset, index)),
        accountName: 'Conta principal',
        category: spec.category,
        localDate: toISODate(new Date(month.getFullYear(), month.getMonth(), day)),
        party: spec.party ?? 'me',
        paymentMethod: spec.method,
        // Only the newest copy carries the rule, so the recurring list shows one row each.
        ...(spec.recurrence && isCurrentMonth ? { recurrence: { frequency: spec.recurrence } } : {}),
        status: 'confirmed',
        confirmedAt,
      });
    });
  }

  return transactions;
}

export const demoCategoryLimits: Record<string, string> = {
  Mercado: '80000',
  Comida: '30000',
  Restaurantes: '20000',
  Transporte: '35000',
  Diversão: '15000',
};
