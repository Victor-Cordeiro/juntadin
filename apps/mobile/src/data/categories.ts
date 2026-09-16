export type CategoryKind = 'expense' | 'income';
export type Category = Readonly<{ id: string; name: string; color: string; icon: string }>;

// Material Community Icons gives each category a recognizable visual language
// on web, Android and iOS while keeping the Juntadin green as the anchor color.
// Validated as a categorical chart palette (dataviz six checks, light surface):
// worst adjacent pair ΔE 11.2 under deuteranopia, 21.2 with normal vision.
export const chartPalette = ['#0F8F6B', '#4D8DEE', '#E8A33D', '#7A3B8F', '#8FB01A', '#B83B2C', '#2FB6C4', '#D6467F'];
// Every preset category gets its own colour instead of cycling, so two slices of one
// donut never share a fill. Fifteen mutually-distinguishable hues do not exist, which
// is why the donut only ever draws the top few plus "Outros" and always pairs the
// swatch with a written label.
const presetColors = [...chartPalette, '#00805C', '#2F5FB8', '#A4622A', '#9B2C5A', '#6B8410', '#E0722A', '#3B3FA8'];
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

export const categoryColors = presetColors;

export function findCategory(kind: CategoryKind, name: string, custom: Category[]) {
  return [...presetCategories[kind], ...custom].find((category) => category.name === name);
}
