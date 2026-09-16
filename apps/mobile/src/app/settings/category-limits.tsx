import { parseBRL } from '@juntadin/domain';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/juntadin-ui';
import { presetCategories } from '@/data/categories';
import { useMoney } from '@/hooks/use-money';
import { inMonth, monthKeyOf, sumOf } from '@/lib/analytics';
import { usePrototype } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

export default function CategoryLimitsScreen() {
  const goBack = useGoBack('/settings');
  const { transactions, customCategories } = usePrototype();
  const { settings, update } = useHouseholdSettings();
  const { format, currency } = useMoney();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const categories = [...presetCategories.expense, ...customCategories.expense];
  const monthItems = inMonth(transactions, monthKeyOf(new Date())).filter((item) => item.kind === 'expense');

  function startEditing(name: string) {
    const current = settings.categoryLimits[name];
    setDraft(current ? (Number(current) / 100).toFixed(2).replace('.', ',') : '');
    setEditing(name);
  }

  function saveLimit(name: string) {
    const cents = parseBRL(draft);
    const next = { ...settings.categoryLimits };
    if (cents === null) delete next[name];
    else next[name] = cents.toString();
    update({ categoryLimits: next });
    setEditing(null);
  }

  function clearLimit(name: string) {
    const next = { ...settings.categoryLimits };
    delete next[name];
    update({ categoryLimits: next });
    setEditing(null);
  }

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}><Text style={styles.back}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Limites por categoria</Text>
      <View style={styles.spacer} />
    </View>
    <Text style={styles.intro}>Defina um limite de gastos para cada categoria. Avisaremos quando você estiver chegando perto.</Text>

    <View style={styles.list}>
      {categories.map((category) => {
        const limit = settings.categoryLimits[category.name];
        const spent = sumOf(monthItems.filter((item) => item.category === category.name));
        const limitCents = limit ? BigInt(limit) : null;
        const progress = limitCents && limitCents > 0n ? Math.min(100, Number((spent * 100n) / limitCents)) : 0;
        const over = limitCents !== null && spent > limitCents;
        const near = !over && progress >= 80;
        const isEditing = editing === category.name;

        return <View key={category.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.icon, { backgroundColor: `${category.color}22` }]}><CategoryIcon name={category.icon} color={category.color} size={24} /></View>
            <View style={styles.cardText}>
              <Text style={styles.name}>{category.name}</Text>
              <Text style={[styles.meta, over && styles.over, near && styles.near]}>
                {limitCents === null ? 'Nenhum limite definido' : `${format(spent)} de ${format(limitCents)}`}
              </Text>
            </View>
            {!isEditing ? <Pressable accessibilityLabel={`Definir limite para ${category.name}`} onPress={() => startEditing(category.name)} style={styles.setButton}>
              <Text style={styles.setButtonText}>{limitCents === null ? '＋ Definir limite' : 'Editar'}</Text>
            </Pressable> : null}
          </View>

          {limitCents !== null && !isEditing ? <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }, over && styles.fillOver, near && styles.fillNear]} /></View> : null}
          {over ? <Text style={styles.over}>Passou do limite em {format(spent - limitCents)}.</Text> : null}

          {isEditing ? <View style={styles.editor}>
            <View style={styles.input}>
              <Text style={styles.currency}>{currency.symbol}</Text>
              <TextInput autoFocus accessibilityLabel={`Limite de ${category.name}`} value={draft} onChangeText={setDraft} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={palette.inkMuted} style={styles.inputText} />
            </View>
            <View style={styles.editorActions}>
              {limitCents !== null ? <Pressable onPress={() => clearLimit(category.name)} style={styles.action}><Text style={styles.remove}>Remover</Text></Pressable> : null}
              <Pressable onPress={() => setEditing(null)} style={styles.action}><Text style={styles.cancel}>Cancelar</Text></Pressable>
              <Pressable onPress={() => saveLimit(category.name)} style={styles.action}><Text style={styles.save}>Salvar</Text></Pressable>
            </View>
          </View> : null}
        </View>;
      })}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, width: 38, lineHeight: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 22, textAlign: 'center' },
  spacer: { width: 38 },
  intro: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  list: { gap: 10 },
  card: { gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 3 },
  name: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  meta: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13 },
  near: { color: palette.goldText },
  over: { color: palette.deficit, fontFamily: font.medium, fontSize: 13 },
  setButton: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: palette.greenVault },
  setButtonText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 13 },
  track: { height: 8, borderRadius: 4, backgroundColor: palette.mint, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: palette.greenAction },
  fillNear: { backgroundColor: palette.gold },
  fillOver: { backgroundColor: palette.deficit },
  editor: { gap: 10 },
  input: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, backgroundColor: palette.paper },
  currency: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 15 },
  inputText: { flex: 1, color: palette.ink, fontFamily: font.regular, fontSize: 17, paddingHorizontal: 9, paddingVertical: 11 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18 },
  action: { minHeight: 40, justifyContent: 'center' },
  remove: { color: palette.deficit, fontFamily: font.semibold, fontSize: 14 },
  cancel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 14 },
  save: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
});
