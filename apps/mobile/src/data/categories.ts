export type CategoryKind = 'expense' | 'income';
export type Category = Readonly<{ id: string; name: string; color: string; icon: string }>;

const colors = ['#0E7A63', '#0B5F4C', '#FFB020', '#8F5A00', '#B33A2B'];
const expenseNames = ['Casa', 'Diversão', 'Cultura', 'Extra', 'Comida', 'Mercado', 'Restaurantes', 'Saúde', 'Filhos', 'Entretenimento', 'Compras', 'Viagem', 'Transporte', 'Empréstimo', 'Aluguel'];
const expenseIcons = ['⌂', '☆', '♧', '◇', '●', '▣', '◉', '+', '♧', '✦', '□', '⌁', '↗', '$', '▤'];
const incomeNames = ['Salário', 'Bônus', 'Investimentos', 'Reembolso', 'Presente', 'Outros'];
const incomeIcons = ['▣', '☆', '$', '↩', '◇', '□'];

function makePresets(names: string[], icons: string[], prefix: string): Category[] { return names.map((name, index) => ({ id: `${prefix}-${name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`, name, icon: icons[index], color: colors[index % colors.length] })); }
export const presetCategories: Record<CategoryKind, Category[]> = { expense: makePresets(expenseNames, expenseIcons, 'expense'), income: makePresets(incomeNames, incomeIcons, 'income') };
export const categoryIcons = ['⌂', '☆', '♧', '◇', '●', '▣', '◉', '+', '✦', '□', '⌁', '↗', '$', '▤', '♢', '♤', '⚑', '☼', '♧', '✿', '◌', '▱', '▰', '◎', '♨', '◈', '♢', '♧', '✚', '◍', '☕', '♩'];
export const categoryColors = ['#0E7A63', '#0B5F4C', '#FFB020', '#8F5A00', '#B33A2B'];

export function findCategory(kind: CategoryKind, name: string, custom: Category[]) { return [...presetCategories[kind], ...custom].find((category) => category.name === name); }
