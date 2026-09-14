export type CategoryKind = 'expense' | 'income';
export type Category = Readonly<{ id: string; name: string; color: string; icon: string }>;

// Material Community Icons gives each category a recognizable visual language
// on web, Android and iOS while keeping the Juntadin green as the anchor color.
const presetColors = ['#0E7A63', '#397CA6', '#6A8E3A', '#D49B13', '#C56B2C', '#B33A2B', '#8D4E80', '#5B6FB4'];
const expenseNames = ['Casa', 'Diversão', 'Cultura', 'Extra', 'Comida', 'Mercado', 'Restaurantes', 'Saúde', 'Filhos', 'Entretenimento', 'Compras', 'Viagem', 'Transporte', 'Empréstimo', 'Aluguel'];
const expenseIcons = ['home', 'local_activity', 'school', 'inventory_2', 'restaurant', 'shopping_cart', 'restaurant_menu', 'ecg_heart', 'child_care', 'movie', 'shopping_bag', 'flight', 'directions_bus', 'payments', 'home_work'];
const incomeNames = ['Salário', 'Bônus', 'Investimentos', 'Reembolso', 'Presente', 'Outros'];
const incomeIcons = ['work', 'star', 'monitoring', 'currency_exchange', 'redeem', 'account_balance_wallet'];

function makePresets(names: string[], icons: string[], prefix: string): Category[] {
  return names.map((name, index) => ({
    id: `${prefix}-${name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`,
    name,
    icon: icons[index],
    color: presetColors[index % presetColors.length],
  }));
}

export const presetCategories: Record<CategoryKind, Category[]> = {
  expense: makePresets(expenseNames, expenseIcons, 'expense'),
  income: makePresets(incomeNames, incomeIcons, 'income'),
};

// A curated set for custom categories. The colors stay in the same natural,
// high-contrast family so user-created categories still feel like Juntadin.
export const categoryIcons = [
  'home', 'local_activity', 'school', 'inventory_2', 'restaurant', 'shopping_cart',
  'restaurant_menu', 'ecg_heart', 'child_care', 'movie', 'shopping_bag', 'flight',
  'directions_bus', 'payments', 'home_work', 'work', 'star', 'monitoring',
  'currency_exchange', 'redeem', 'account_balance_wallet', 'sell', 'lightbulb',
  'vpn_key', 'build', 'local_gas_station', 'receipt_long', 'pets', 'menu_book',
  'sports_esports', 'train', 'directions_bike', 'smartphone', 'add_circle', 'category',
];

export const categoryColors = [
  '#0E7A63', '#0B5F4C', '#19A974', '#6A8E3A', '#397CA6', '#5B6FB4',
  '#D49B13', '#FFB020', '#C56B2C', '#B33A2B', '#8D4E80', '#6D7A6A',
];

export function findCategory(kind: CategoryKind, name: string, custom: Category[]) {
  return [...presetCategories[kind], ...custom].find((category) => category.name === name);
}
