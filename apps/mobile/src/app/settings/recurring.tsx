import type { RecurrenceFrequency } from '@juntadin/contracts';
import { parseBRL } from '@juntadin/domain';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Button, Field, Screen } from '@/components/juntadin-ui';
import { findCategory } from '@/data/categories';
import { useMoney } from '@/hooks/use-money';
import { addRecurrence, formatShortDatePT, recurrenceOptions, todayISODate } from '@/lib/dates';
import { usePrototype, type ConfirmedTransaction } from '@/state/prototype-context';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

/** The next due date is the first occurrence that still lies ahead of today. */
function nextOccurrence(transaction: ConfirmedTransaction): string {
  const frequency = transaction.recurrence?.frequency;
  if (!frequency) return transaction.localDate;
  const today = todayISODate();
  let cursor = transaction.localDate;
  for (let step = 0; step < 240 && cursor <= today; step += 1) cursor = addRecurrence(cursor, frequency);
  return cursor;
}

export default function RecurringScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { transactions, customCategories, updateTransaction, removeTransaction } = usePrototype();
  const { format } = useMoney();
  const [editing, setEditing] = useState<ConfirmedTransaction | null>(null);

  const recurring = transactions.filter((item) => item.recurrence);

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}><Text style={styles.back}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Transações recorrentes</Text>
      <Pressable accessibilityLabel="Adicionar transação recorrente" hitSlop={8} onPress={() => router.push('/transaction/new?recurring=1')}><Text style={styles.plus}>＋</Text></Pressable>
    </View>
    <Text style={styles.intro}>Receitas e despesas que se repetem automaticamente. Elas alimentam a projeção da aba Tendência.</Text>

    {recurring.length === 0 ? <View style={styles.empty}>
      <View style={styles.emptyIcon}><CategoryIcon name="repeat" color={palette.greenVault} size={30} /></View>
      <Text style={styles.emptyTitle}>Nenhuma recorrência ainda</Text>
      <Text style={styles.emptyBody}>Marque um movimento como recorrente ao lançá-lo, ou use o ＋ acima.</Text>
      <Button label="Adicionar recorrente" onPress={() => router.push('/transaction/new?recurring=1')} />
    </View> : <View style={styles.list}>
      {recurring.map((item, index) => {
        const meta = findCategory(item.kind, item.category, customCategories[item.kind]);
        const color = meta?.color ?? palette.greenVault;
        const label = recurrenceOptions.find((option) => option.value === item.recurrence?.frequency)?.label ?? 'Recorrente';
        return <Pressable key={item.id} onPress={() => setEditing(item)} style={[styles.row, index > 0 && styles.divider]}>
          <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]}><CategoryIcon name={meta?.icon ?? 'category'} color={color} size={24} /></View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{item.description}</Text>
            <Text style={styles.rowMeta}>Próximo: {formatShortDatePT(nextOccurrence(item))}</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowAmount, item.kind === 'income' && styles.income]}>{item.kind === 'income' ? '+' : '−'}{format(item.amountCents)}</Text>
            <View style={styles.badge}><CategoryIcon name="repeat" color={palette.inkMuted} size={13} /><Text style={styles.badgeText}>{label}</Text></View>
          </View>
        </Pressable>;
      })}
    </View>}

    {editing ? <EditRecurring
      transaction={editing}
      onClose={() => setEditing(null)}
      onSave={(changes) => { updateTransaction(editing.id, changes); setEditing(null); }}
      onDelete={() => { removeTransaction(editing.id); setEditing(null); }}
    /> : null}
  </Screen>;
}

function EditRecurring({ transaction, onClose, onSave, onDelete }: { transaction: ConfirmedTransaction; onClose(): void; onSave(changes: Partial<ConfirmedTransaction>): void; onDelete(): void }) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState((Number(transaction.amountCents) / 100).toFixed(2).replace('.', ','));
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(transaction.recurrence?.frequency ?? 'monthly');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save() {
    const cents = parseBRL(amount);
    if (!description.trim() || cents === null) return;
    onSave({ description: description.trim(), amountCents: cents, recurrence: { frequency } });
  }

  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
        <Text style={styles.sheetTitle}>Editar recorrência</Text>
        <Field label="Descrição" value={description} onChangeText={setDescription} />
        <Field label="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Text style={styles.sheetLabel}>FREQUÊNCIA</Text>
        <View style={styles.frequencies}>
          {recurrenceOptions.map((option) => {
            const active = option.value === frequency;
            return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setFrequency(option.value)} style={[styles.frequency, active && styles.frequencyActive]}>
              <Text style={[styles.frequencyText, active && styles.frequencyTextActive]}>{option.label}</Text>
            </Pressable>;
          })}
        </View>
        <Button label="Salvar" onPress={save} />
        {confirmingDelete
          ? <View style={styles.confirm}>
              <Text style={styles.confirmText}>Remover esta recorrência? Os lançamentos já feitos continuam no histórico.</Text>
              <View style={styles.confirmActions}>
                <Pressable onPress={() => setConfirmingDelete(false)} style={styles.confirmButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
                <Pressable onPress={onDelete} style={styles.confirmButton}><Text style={styles.deleteText}>Remover</Text></Pressable>
              </View>
            </View>
          : <Pressable onPress={() => setConfirmingDelete(true)} style={styles.deleteRow}><Text style={styles.deleteText}>Remover recorrência</Text></Pressable>}
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 8 },
  back: { color: palette.greenVault, fontSize: 38, width: 34, lineHeight: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 22, textAlign: 'center' },
  plus: { color: palette.greenAction, fontSize: 30, width: 34, textAlign: 'right', lineHeight: 34 },
  intro: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  list: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 84, paddingHorizontal: 16, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  rowIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  rowMeta: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowAmount: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  income: { color: palette.greenAction },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.mint, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 11 },
  empty: { alignItems: 'center', gap: 12, padding: 26, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: palette.ink, fontFamily: font.display, fontSize: 20 },
  emptyBody: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,33,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 400, borderRadius: 24, backgroundColor: palette.surface, padding: 20, gap: 14 },
  sheetTitle: { color: palette.ink, fontFamily: font.display, fontSize: 20 },
  sheetLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.8 },
  frequencies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequency: { minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper },
  frequencyActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  frequencyText: { color: palette.ink, fontFamily: font.medium, fontSize: 13 },
  frequencyTextActive: { color: 'white' },
  deleteRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: palette.deficit, fontFamily: font.semibold, fontSize: 14 },
  cancelText: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 14 },
  confirm: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: palette.paper },
  confirmText: { color: palette.ink, fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18 },
  confirmButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 },
});
