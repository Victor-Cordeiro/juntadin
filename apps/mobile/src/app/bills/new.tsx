import type { PendingItemKind, RecurrenceFrequency, TransactionParty } from '@juntadin/contracts';
import { parseBRL } from '@juntadin/domain';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Screen, ScrollGrid, uiStyles } from '@/components/juntadin-ui';
import { CalendarField } from '@/components/calendar-field';
import { CategoryIcon } from '@/components/category-icon';
import { RecurrenceField } from '@/components/recurrence-field';
import { AmountKeypad } from '@/components/amount-keypad';
import { useGoBack } from '@/hooks/use-back';
import { useMoney } from '@/hooks/use-money';
import { usePrototype } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { font, palette } from '@/theme/tokens';
import { findCategory, presetCategories } from '@/data/categories';
import { todayISODate } from '@/lib/dates';
import { uuid } from '@/lib/uuid';

const partyOptions: { value: TransactionParty; label: string }[] = [{ value: 'me', label: 'Eu' }, { value: 'partner', label: 'Parceiro(a)' }, { value: 'shared', label: 'Compartilhado' }];

function Choice<T extends string>({ value, selected, label, icon, iconColor, fill = false, onPress }: { value: T; selected: T; label: string; icon?: string; iconColor?: string; fill?: boolean; onPress(value: T): void }) {
  const active = value === selected;
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onPress(value)} style={[styles.choice, fill && styles.choiceFill, active && styles.choiceActive]}>
    <View style={styles.choiceContent}>{icon ? <CategoryIcon name={icon} color={active ? '#FFFFFF' : (iconColor ?? palette.greenVault)} size={18} /> : null}<Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></View>
  </Pressable>;
}

export default function NewBillScreen() {
  const router = useRouter();
  const goBack = useGoBack('/bills');
  const params = useLocalSearchParams<{ id?: string }>();
  const { customCategories, addPendingItem, updatePendingItem, removePendingItem, pendingItems } = usePrototype();
  const { settings } = useHouseholdSettings();
  const { currency } = useMoney();
  const [keypadOpen, setKeypadOpen] = useState(true);
  const [kind, setKind] = useState<PendingItemKind>('payable');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [party, setParty] = useState<TransactionParty>('me');
  const [category, setCategory] = useState(presetCategories.expense[0].name);
  const [dueDate, setDueDate] = useState(todayISODate());
  const [note, setNote] = useState('');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency | null>(null);
  const [details, setDetails] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; amount?: string; date?: string; category?: string }>({});
  const editing = pendingItems.find((item) => item.id === params.id);

  useEffect(() => {
    if (!editing) return;
    // Route params resolve after hydration; synchronize the form once with the selected bill.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKind(editing.kind); setDescription(editing.description); setAmount((Number(editing.amountCents) / 100).toFixed(2).replace('.', ','));
    setParty(editing.party ?? 'me'); setCategory(editing.category); setDueDate(editing.dueDate); setNote(editing.note ?? ''); setRecurrenceFrequency(editing.recurrence?.frequency ?? null); setDetails(Boolean(editing.note || editing.recurrence)); setKeypadOpen(false);
  }, [editing]);

  const categoryKind = kind === 'payable' ? 'expense' : 'income';
  const categories = [...presetCategories[categoryKind].map((item) => item.name), ...customCategories[categoryKind].map((item) => item.name)];

  function changeKind(next: PendingItemKind) { setKind(next); setCategory(presetCategories[next === 'payable' ? 'expense' : 'income'][0].name); }

  function submit() {
    const cents = parseBRL(amount);
    const validation = { description: description.trim().length < 2 ? 'Dê um nome para esta conta.' : undefined, amount: cents === null ? 'Digite um valor maior que zero.' : undefined, date: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? undefined : 'Escolha uma data.', category: category ? undefined : 'Escolha uma categoria.' };
    setErrors(validation);
    if (Object.values(validation).some(Boolean) || cents === null) return;
    const next = {
      id: editing?.id ?? uuid(),
      kind,
      description: description.trim(),
      amountCents: cents,
      dueDate,
      category,
      party: settings.enabled ? party : 'me',
      note: note.trim() || undefined,
      recurrence: recurrenceFrequency ? { frequency: recurrenceFrequency } : undefined,
      status: 'pending' as const,
    };
    if (editing) updatePendingItem(editing.id, next); else addPendingItem(next);
    router.replace('/bills');
  }

  function remove() {
    if (!editing) return;
    removePendingItem(editing.id);
    router.replace('/bills');
  }

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <View style={styles.topSpacer} />
      <View accessibilityRole="radiogroup" style={styles.segment}><Choice fill value="payable" selected={kind} label="A pagar" onPress={changeKind} /><Choice fill value="receivable" selected={kind} label="A receber" onPress={changeKind} /></View>
      <Pressable accessibilityLabel="Fechar e voltar" hitSlop={10} onPress={goBack} style={styles.closeButton}><Text style={styles.closeIcon}>×</Text></Pressable>
    </View>
    <View style={uiStyles.form}>
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>VALOR</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Valor, ${amount || 'zero'}. Toque para digitar`} onPress={() => setKeypadOpen(true)} style={styles.amountInput}>
          <Text style={styles.currency}>{currency.symbol}</Text>
          <Text style={[styles.amountText, !amount && styles.amountPlaceholder]}>{amount || '0,00'}</Text>
        </Pressable>
        {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}
      </View>
      <Field label={kind === 'payable' ? 'A pagar' : 'A receber'} value={description} onChangeText={setDescription} error={errors.description} placeholder={kind === 'payable' ? 'Ex.: Conta de luz' : 'Ex.: Venda'} />

      {settings.enabled ? <View style={styles.group}><Text style={styles.label}>{kind === 'payable' ? 'Quem paga?' : 'Quem recebe?'}</Text><View accessibilityRole="radiogroup" style={styles.partyRow}>{partyOptions.map((item) => <Choice<TransactionParty> key={item.value} value={item.value} selected={party} label={item.label} onPress={setParty} />)}</View></View> : null}

      <View style={styles.group}>
        <Text style={styles.label}>Categoria</Text>
        <ScrollGrid>
          {categories.map((item) => { const metadata = findCategory(categoryKind, item, customCategories[categoryKind]); return <Choice key={item} value={item} selected={category} icon={metadata?.icon} iconColor={metadata?.color} label={item} onPress={setCategory} />; })}
        </ScrollGrid>
      </View>

      <CalendarField label="Vencimento" value={dueDate} onChange={setDueDate} error={errors.date} />

      <Pressable onPress={() => setDetails((value) => !value)} style={styles.details}><Text style={styles.detailsText}>{details ? '− Ocultar detalhes' : '＋ Nota e recorrência'}</Text></Pressable>
      {details && <View style={styles.detailCard}>
        <Field label="Nota (opcional)" value={note} onChangeText={setNote} multiline placeholder="Adicione um contexto para lembrar depois" />
        <RecurrenceField date={dueDate} frequency={recurrenceFrequency} onChange={setRecurrenceFrequency} />
      </View>}

      <Button label={`${editing ? 'Atualizar' : 'Salvar'} conta ${kind === 'payable' ? 'a pagar' : 'a receber'}`} onPress={submit} />
      {editing ? <Button label="Apagar conta" variant="ghost" onPress={() => Alert.alert('Apagar conta?', 'Esta ação não pode ser desfeita.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: remove }])} /> : null}
    </View>
    <AmountKeypad visible={keypadOpen} value={amount} currencySymbol={currency.symbol} onChange={setAmount} onClose={() => setKeypadOpen(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14, paddingTop: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topSpacer: { width: 40 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  closeIcon: { color: palette.ink, fontFamily: font.regular, fontSize: 32, lineHeight: 34 },
  segment: { flex: 1, flexDirection: 'row', borderRadius: 15, backgroundColor: palette.mint, padding: 4, gap: 4, maxWidth: 340, alignSelf: 'center' },
  amountSection: { alignItems: 'center', gap: 5, paddingVertical: 2 },
  amountLabel: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 12, letterSpacing: 1 },
  amountInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 78 },
  currency: { color: palette.inkMuted, fontFamily: font.display, fontSize: 28, marginRight: 7 },
  amountText: { color: palette.ink, fontFamily: font.display, fontSize: 54, textAlign: 'center' },
  amountPlaceholder: { color: palette.inkMuted },
  error: { color: palette.deficit, fontFamily: font.regular, fontSize: 13 },
  group: { gap: 10 },
  label: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  choice: { minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  choiceFill: { flex: 1 },
  choiceActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  choiceContent: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  choiceText: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  choiceTextActive: { color: 'white' },
  partyRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  details: { minHeight: 48, justifyContent: 'center' },
  detailsText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 15 },
  detailCard: { gap: 14, borderRadius: 16, padding: 16, backgroundColor: palette.mint },
});
