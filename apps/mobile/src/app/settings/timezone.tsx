import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/juntadin-ui';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

const fallbackZones = [
  'America/Sao_Paulo', 'America/Manaus', 'America/Belem', 'America/Fortaleza', 'America/Recife',
  'America/Bahia', 'America/Cuiaba', 'America/Campo_Grande', 'America/Porto_Velho', 'America/Rio_Branco',
  'America/Noronha', 'America/Argentina/Buenos_Aires', 'America/Montevideo', 'America/Santiago',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City',
  'Europe/Lisbon', 'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
  'Africa/Luanda', 'Africa/Maputo', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney', 'UTC',
];

/** Prefers Brazilian zones at the top — the rest of the IANA list stays searchable below. */
function allZones(): string[] {
  const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : fallbackZones;
  const preferred = supported.filter((zone) => zone.startsWith('America/') && ['Sao_Paulo', 'Manaus', 'Belem', 'Fortaleza', 'Recife', 'Bahia', 'Cuiaba', 'Campo_Grande', 'Porto_Velho', 'Rio_Branco', 'Noronha'].some((city) => zone.endsWith(city)));
  return [...preferred, ...supported.filter((zone) => !preferred.includes(zone))];
}

function offsetOf(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date());
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

export default function TimezoneScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { settings, update } = useHouseholdSettings();
  const [query, setQuery] = useState('');
  const zones = useMemo(allZones, []);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, '_');
    const list = term ? zones.filter((zone) => zone.toLocaleLowerCase('pt-BR').includes(term)) : zones;
    return list.slice(0, 80);
  }, [query, zones]);

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}><Text style={styles.back}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Fuso horário</Text>
      <View style={styles.spacer} />
    </View>

    <View style={styles.search}>
      <CategoryIcon name="search" color={palette.inkMuted} size={20} />
      <TextInput accessibilityLabel="Pesquisar fuso horário" value={query} onChangeText={setQuery} placeholder="Pesquisar fuso horário" placeholderTextColor={palette.inkMuted} autoCapitalize="none" style={styles.searchInput} />
    </View>
    <Text style={styles.hint}>Define a data usada ao registrar um movimento.</Text>

    <View style={styles.list}>
      {results.map((zone, index) => {
        const active = zone === settings.timezone;
        return <Pressable key={zone} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => { update({ timezone: zone }); router.back(); }} style={[styles.row, index > 0 && styles.divider]}>
          <Text style={[styles.zone, active && styles.zoneActive]}>{zone.replace(/_/g, ' ')}</Text>
          <Text style={styles.offset}>{offsetOf(zone)}</Text>
          {active ? <CategoryIcon name="check" color={palette.greenAction} size={20} /> : null}
        </Pressable>;
      })}
      {results.length === 0 ? <Text style={styles.noResults}>Nenhum fuso encontrado.</Text> : null}
    </View>
    {results.length === 80 ? <Text style={styles.hint}>Mostrando os primeiros 80 resultados — refine a busca para ver outros.</Text> : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  zone: { flex: 1, color: palette.ink, fontFamily: font.regular, fontSize: 15 },
  zoneActive: { fontFamily: font.semibold, color: palette.greenVault },
  offset: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 13 },
  noResults: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center', padding: 24 },
});
