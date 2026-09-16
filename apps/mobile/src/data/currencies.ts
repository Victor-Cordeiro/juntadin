export type Currency = Readonly<{ code: string; name: string; symbol: string; flag: string; locale: string }>;

export const currencies: Currency[] = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷', locale: 'es-AR' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱', locale: 'es-CL' },
  { code: 'UYU', name: 'Peso Uruguaio', symbol: '$U', flag: '🇺🇾', locale: 'es-UY' },
  { code: 'PYG', name: 'Guarani Paraguaio', symbol: '₲', flag: '🇵🇾', locale: 'es-PY' },
  { code: 'HKD', name: 'Dólar de Hong Kong', symbol: '$', flag: '🇭🇰', locale: 'zh-HK' },
  { code: 'NZD', name: 'Dólar Neozelandês', symbol: '$', flag: '🇳🇿', locale: 'en-NZ' },
  { code: 'SEK', name: 'Coroa Sueca', symbol: 'kr', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'NOK', name: 'Coroa Norueguesa', symbol: 'kr', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'DKK', name: 'Coroa Dinamarquesa', symbol: 'kr', flag: '🇩🇰', locale: 'da-DK' },
  { code: 'ZAR', name: 'Rand Sul-Africano', symbol: 'R', flag: '🇿🇦', locale: 'en-ZA' },
  { code: 'INR', name: 'Rupia Indiana', symbol: '₹', flag: '🇮🇳', locale: 'hi-IN' },
  { code: 'PLN', name: 'Zloty Polonês', symbol: 'zł', flag: '🇵🇱', locale: 'pl-PL' },
];

export const defaultCurrency = currencies[0];

export function findCurrency(code: string): Currency {
  return currencies.find((item) => item.code === code) ?? defaultCurrency;
}
