import type { PendingItem, PendingItemKind } from '@juntadin/contracts';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarField } from '@/components/calendar-field';
import { CategoryIcon } from '@/components/category-icon';
import { Button, Screen } from '@/components/juntadin-ui';
import { findCategory } from '@/data/categories';
import { presetPaymentMethods } from '@/data/payment-methods';
import { useGoBack } from '@/hooks/use-back';
import { useMoney } from '@/hooks/use-money';
import { formatShortDatePT, todayISODate } from '@/lib/dates';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';
import { uuid } from '@/lib/uuid';

export default function BillsScreen() {
  const router = useRouter();
  const goBack = useGoBack('/dashboard');
  const { hydrated, session, onboarding, pendingItems } = usePrototype();
  const [kind, setKind] = useState<PendingItemKind>('payable');
  const [settling, setSettling] = useState<PendingItem | null>(null);
  const [nextOccurrence, setNextOccurrence] = useState<{ item: PendingItem; dueDate: string } | null>(null);

  useEffect(() => { if (hydrated && !session) router.replace('/auth/login'); else if (hydrated && session && !onboarding.completed) router.replace('/onboarding/cycle'); }, [hydrated, onboarding.completed, router, session]);
  if (!hydrated || !session || !onboarding.completed) return null;

  const today = todayISODate();
  const items = [...pendingItems]
    .filter((item) => item.status === 'pending' && item.kind === kind)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={10} onPress={goBack} style={styles.back}><Text style={styles.backIcon}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Contas</Text>
      <View style={styles.back} />
    </View>

    <View accessibilityRole="radiogroup" style={styles.toggle}>
      {(['payable', 'receivable'] as const).map((value) => {
        const active = kind === value;
        return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setKind(value)} style={[styles.toggleItem, active && styles.toggleItemActive]}>
          <Text style={[styles.toggleLabel, active && { color: value === 'payable' ? palette.deficit : palette.greenAction }]}>{value === 'payable' ? 'A pagar' : 'A receber'}</Text>
        </Pressable>;
      })}
    </View>

    {items.length === 0 ? <EmptyState kind={kind} /> : <View style={styles.list}>
      {items.map((item) => <BillRow key={item.id} item={item} overdue={item.dueDate < today} onSettle={() => setSettling(item)} onEdit={() => router.push({ pathname: '/bills/new', params: { id: item.id } })} />)}
    </View>}

    <Button label={kind === 'payable' ? '+ Nova conta a pagar' : '+ Nova conta a receber'} onPress={() => router.push('/bills/new')} />

    {settling ? <SettleModal item={settling} onClose={() => setSettling(null)} onSettled={(nextDueDate) => {
      const item = settling;
      setSettling(null);
      if (item && nextDueDate) setNextOccurrence({ item, dueDate: nextDueDate });
    }} /> : null}

    {nextOccurrence ? <NextOccurrenceModal item={nextOccurrence.item} dueDate={nextOccurrence.dueDate} onClose={() => setNextOccurrence(null)} /> : null}
  </Screen>;
}

function EmptyState({ kind }: { kind: PendingItemKind }) {
  return <View style={styles.empty}>
    <CategoryIcon name="receipt_long" color={palette.inkMuted} size={28} />
    <Text style={styles.emptyText}>{kind === 'payable' ? 'Nenhuma conta a pagar pendente.' : 'Nenhuma conta a receber pendente.'}</Text>
  </View>;
}

function BillRow({ item, overdue, onSettle, onEdit }: { item: PendingItem; overdue: boolean; onSettle(): void; onEdit(): void }) {
  const { format } = useMoney();
  const { customCategories } = usePrototype();
  const categoryKind = item.kind === 'payable' ? 'expense' : 'income';
  const metadata = findCategory(categoryKind, item.category, customCategories[categoryKind]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${item.description}`} onPress={onEdit} style={styles.row}>
    <View style={[styles.rowIcon, { backgroundColor: `${metadata?.color ?? palette.greenVault}22` }]}><CategoryIcon name={metadata?.icon ?? 'receipt_long'} color={metadata?.color ?? palette.greenVault} size={22} /></View>
    <View style={styles.rowText}>
      <Text style={styles.rowName}>{item.description}</Text>
      <Text style={[styles.rowMeta, overdue && styles.rowMetaOverdue]}>{overdue ? 'Atrasada · ' : ''}Vence em {formatShortDatePT(item.dueDate)}{item.recurrence ? ' · recorrente' : ''}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={[styles.rowAmount, item.kind === 'receivable' && { color: palette.greenAction }]}>{item.kind === 'receivable' ? '+' : ''}{format(item.amountCents)}</Text>
      <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onSettle(); }} style={styles.settleButton}><Text style={styles.settleText}>{item.kind === 'payable' ? 'Marcar pago' : 'Marcar recebido'}</Text></Pressable>
    </View>
  </Pressable>;
}

function SettleModal({ item, onClose, onSettled }: { item: PendingItem; onClose(): void; onSettled(nextDueDate?: string): void }) {
  const { format } = useMoney();
  const { settlePendingItem } = usePrototype();
  const [date, setDate] = useState(todayISODate());
  const [paymentMethod, setPaymentMethod] = useState(presetPaymentMethods[0].name);

  function confirm() {
    const result = settlePendingItem(item.id, { settledDate: date, paymentMethod: item.kind === 'payable' ? paymentMethod : undefined });
    onSettled(result?.nextDueDate);
  }

  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
        <Text style={styles.cardTitle}>{item.kind === 'payable' ? 'Confirmar pagamento' : 'Confirmar recebimento'}</Text>
        <Text style={styles.cardSubtitle}>{item.description} · {format(item.amountCents)}</Text>
        <CalendarField label={item.kind === 'payable' ? 'Data do pagamento' : 'Data do recebimento'} value={date} onChange={setDate} />
        {item.kind === 'payable' ? <View style={styles.methodRow}>
          {presetPaymentMethods.map((method) => {
            const active = paymentMethod === method.name;
            return <Pressable key={method.id} onPress={() => setPaymentMethod(method.name)} style={[styles.methodChip, active && styles.methodChipActive]}>
              <Text style={[styles.methodText, active && styles.methodTextActive]}>{method.name}</Text>
            </Pressable>;
          })}
        </View> : null}
        <Button label={item.kind === 'payable' ? 'Confirmar pagamento' : 'Confirmar recebimento'} onPress={confirm} />
        <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>Cancelar</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

function NextOccurrenceModal({ item, dueDate, onClose }: { item: PendingItem; dueDate: string; onClose(): void }) {
  const { addPendingItem } = usePrototype();
  const [nextDate, setNextDate] = useState(dueDate);

  function createNext() {
    addPendingItem({ ...item, id: uuid(), dueDate: nextDate, status: 'pending', settledAt: undefined, settledTransactionId: undefined });
    onClose();
  }

  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
        <Text style={styles.cardTitle}>Criar o próximo lembrete?</Text>
        <Text style={styles.cardSubtitle}>{item.description} é recorrente. Quer lembrar da próxima vez?</Text>
        <CalendarField label="Próximo vencimento" value={nextDate} onChange={setNextDate} />
        <Button label="Criar próximo lembrete" onPress={createNext} />
        <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>Não, obrigado</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 16, paddingTop: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: palette.greenVault, fontSize: 30, lineHeight: 32 },
  title: { flex: 1, textAlign: 'center', color: palette.ink, fontFamily: font.display, fontSize: 24 },
  toggle: { flexDirection: 'row', alignSelf: 'center', borderRadius: 999, backgroundColor: palette.mint, padding: 4, gap: 4 },
  toggleItem: { minHeight: 40, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  toggleItemActive: { backgroundColor: palette.surface },
  toggleLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 15 },
  list: { gap: 10 },
  row: { minHeight: 84, backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 3 },
  rowName: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  rowMeta: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12 },
  rowMetaOverdue: { color: palette.deficit, fontFamily: font.medium },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowAmount: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  settleButton: { minHeight: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  settleText: { color: palette.greenVault, fontFamily: font.semibold, fontSize: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  emptyText: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,33,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, backgroundColor: palette.surface, padding: 20, gap: 14 },
  cardTitle: { color: palette.ink, fontFamily: font.display, fontSize: 19 },
  cardSubtitle: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, alignItems: 'center', justifyContent: 'center' },
  methodChipActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  methodText: { color: palette.ink, fontFamily: font.medium, fontSize: 13 },
  methodTextActive: { color: 'white' },
  close: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  closeText: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 15 },
});
