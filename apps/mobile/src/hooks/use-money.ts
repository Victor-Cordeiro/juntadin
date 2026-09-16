import { formatMoney } from '@juntadin/domain';
import { useCallback } from 'react';

import { findCurrency } from '@/data/currencies';
import { useHouseholdSettings } from '@/state/use-household-settings';

/**
 * Formats amounts in the currency the user picked in Settings.
 * Only presentation changes — stored amounts keep the value they were entered with.
 */
export function useMoney() {
  const { settings } = useHouseholdSettings();
  const currency = findCurrency(settings.currency);
  const format = useCallback((cents: bigint) => formatMoney(cents, currency.code, currency.locale), [currency.code, currency.locale]);
  return { format, currency };
}
