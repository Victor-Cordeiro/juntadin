import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/juntadin-ui';
import { currencies } from '@/data/currencies';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

export default function CurrencyScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { settings, update } = useHouseholdSettings();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return currencies;
    return currencies.filter((item) => `${item.name} ${item.code} ${item.symbol}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [query]);

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}><Text style={styles.back}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Moeda</Text>
      <View style={styles.spacer} />
    </View>

    <View style={styles.search}>
      <CategoryIcon name="search" color={palette.inkMuted} size={20} />
      <TextInput accessibilityLabel="Pesquisar moeda" value={query} onChangeText={setQuery} placeholder="Pesquisar moeda" placeholderTextColor={palette.inkMuted} style={styles.searchInput} />
    </View>

    <Text style={styles.hint}>Altera como os valores são exibidos. Os valores já lançados mantêm o número original — não há conversão de câmbio.</Text>

    <View style={styles.list}>
      {results.map((item, index) => {
        const active = item.code === settings.currency;
        return <Pressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => { update({ currency: item.code }); router.back(); }} style={[styles.row, index > 0 && styles.divider]}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowCode}>{item.code}</Text>
          </View>
          <Text style={[styles.symbol, active && styles.symbolActive]}>{item.symbol}</Text>
          {active ? <CategoryIcon name="check" color={palette.greenAction} size={20} /> : null}
        </Pressable>;
      })}
      {results.length === 0 ? <Text style={styles.noResults}>Nenhuma moeda encontrada.</Text> : null}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, width: 38, lineHeight: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 24, textAlign: 'center' },
  spacer: { width: 38 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  searchInput: { flex: 1, color: palette.ink, fontFamily: font.regular, fontSize: 16, paddingVertical: 12 },
  hint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  list: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  flag: { fontSize: 26 },
  rowText: { flex: 1 },
  rowTitle: { color: palette.ink, fontFamily: font.medium, fontSize: 16 },
  rowCode: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  symbol: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 16 },
  symbolActive: { color: palette.greenAction },
  noResults: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center', padding: 24 },
});
