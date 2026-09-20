import type { PendingItem, TransactionKind } from '@juntadin/contracts';

type QueryTransaction = {
  kind: TransactionKind;
  description: string;
  amountCents: bigint;
  category: string;
  paymentMethod?: string;
  localDate: string;
};

type QueryInput = {
  text: string;
  transactions: QueryTransaction[];
  pendingItems: PendingItem[];
  now?: Date;
};

export type FinancialQueryResult = { handled: boolean; answer?: string };

const stopWords = new Set(['quanto', 'gastei', 'gasto', 'gastos', 'paguei', 'pagar', 'pagamento', 'conta', 'contas', 'este', 'esse', 'neste', 'nessa', 'mes', 'mês', 'dia', 'de', 'do', 'da', 'no', 'na', 'em', 'eu', 'o', 'a', 'que', 'qual', 'quando', 'já', 'ja', 'foi', 'foram', 'meu', 'minha', 'minhas', 'meus', 'para', 'com', 'comigo', 'total', 'teve', 'tive']);

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function formatBRL(cents: bigint): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateFilter(text: string, now: Date): ((date: string) => boolean) | null {
  const normalized = normalize(text);
  if (/\b(este|esse|neste) mes\b|\bmes\b/.test(normalized)) {
    const key = monthKey(now);
    return (date) => date.startsWith(key);
  }
  if (/\bontem\b/.test(normalized)) {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return (value) => value === key;
  }
  const explicit = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  const dayOnly = normalized.match(/\bdia\s+(\d{1,2})\b/);
  if (!explicit && !dayOnly) return null;
  const day = Number(explicit?.[1] ?? dayOnly?.[1]);
  const month = explicit ? Number(explicit[2]) : now.getMonth() + 1;
  const yearRaw = explicit?.[3];
  const year = yearRaw ? (yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw)) : now.getFullYear();
  if (!day || !month || !year) return null;
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return (date) => date === key;
}

function searchTerms(text: string): string[] {
  return normalize(text)
    .replace(/\d{1,4}[\/-]\d{1,2}(?:[\/-]\d{2,4})?/g, ' ')
    .split(/[^a-z0-9à-ÿ]+/i)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

function matches(item: Pick<QueryTransaction, 'description' | 'category' | 'paymentMethod'>, terms: string[]): boolean {
  if (!terms.length) return true;
  const haystack = normalize([item.description, item.category, item.paymentMethod].filter(Boolean).join(' '));
  return terms.some((term) => haystack.includes(term));
}

function looksLikeQuery(text: string): boolean {
  const normalized = normalize(text);
  if (/\b\d+(?:[,.]\d+)?\s*(?:reais|real)\b|\br\$\s*\d/.test(normalized) && !/\bquanto\b|\bo que\b|\bqual\b/.test(normalized)) return false;
  return /\b(quanto|gastei|gasto|paguei|pago|pagamentos|conta|contas|movimentos|o que eu gastei|quando gastei|ja paguei)\b/.test(normalized);
}

export function answerFinancialQuery({ text, transactions, pendingItems, now = new Date() }: QueryInput): FinancialQueryResult {
  if (!looksLikeQuery(text)) return { handled: false };
  const normalized = normalize(text);
  const filterDate = dateFilter(text, now);
  const terms = searchTerms(text);
  const queryKind: TransactionKind | undefined = /\b(recebi|receitas?|entrou|ganhei)\b/.test(normalized) ? 'income' : /\b(gastei|gasto|paguei|pago|despesa|despesas?)\b/.test(normalized) ? 'expense' : undefined;
  const matching = transactions.filter((item) => (!queryKind || item.kind === queryKind) && (!filterDate || filterDate(item.localDate)) && matches(item, terms));
  const asksPaid = /\bja paguei\b|\bpaguei\b|\bfoi pago\b/.test(normalized);

  if (asksPaid && terms.length) {
    const pendingMatch = pendingItems.find((item) => matches(item, terms));
    const settledMatch = matching.find((item) => item.kind === 'expense');
    if (pendingMatch && pendingMatch.status === 'pending' && !settledMatch) return { handled: true, answer: `Ainda não. A conta “${pendingMatch.description}” está pendente, com vencimento em ${pendingMatch.dueDate.split('-').reverse().join('/')}, no valor de ${formatBRL(pendingMatch.amountCents)}.` };
    if (settledMatch) return { handled: true, answer: `Sim. Encontrei “${settledMatch.description}” em ${settledMatch.localDate.split('-').reverse().join('/')} no valor de ${formatBRL(settledMatch.amountCents)}.` };
  }

  const total = matching.reduce((sum, item) => sum + item.amountCents, 0n);
  const label = queryKind === 'income' ? 'recebido' : 'gasto';
  if (!matching.length) return { handled: true, answer: 'Não encontrei lançamentos para esse filtro.' };
  const scope = filterDate ? (normalized.includes('mes') ? 'neste mês' : 'nessa data') : 'nos seus lançamentos';
  if (matching.length === 1) return { handled: true, answer: `Encontrei 1 lançamento ${label} ${scope}: “${matching[0].description}”, ${formatBRL(total)} em ${matching[0].localDate.split('-').reverse().join('/')}.` };
  const details = matching.slice(0, 5).map((item) => `• ${item.description}: ${formatBRL(item.amountCents)} (${item.localDate.split('-').reverse().join('/')})`).join('\n');
  const suffix = matching.length > 5 ? `\n+ ${matching.length - 5} outros lançamentos.` : '';
  return { handled: true, answer: `Você teve ${matching.length} lançamentos de ${label} ${scope}, totalizando ${formatBRL(total)}.\n${details}${suffix}` };
}
