import type { RecurrenceFrequency, TransactionKind, TransactionParty } from '@juntadin/contracts';
import { parseBRL } from '@juntadin/domain';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Screen, ScrollGrid, uiStyles } from '@/components/juntadin-ui';
import { CalendarField } from '@/components/calendar-field';
import { CategoryIcon } from '@/components/category-icon';
import { RecurrenceField } from '@/components/recurrence-field';
import { AmountKeypad } from '@/components/amount-keypad';
import { useMoney } from '@/hooks/use-money';
import { usePrototype } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { font, palette } from '@/theme/tokens';
import { findCategory, presetCategories } from '@/data/categories';
import { presetPaymentMethods } from '@/data/payment-methods';
import { formatShortDatePT, todayISODate } from '@/lib/dates';
import { installmentOptions, splitInstallments } from '@/lib/installments';
import { uuid } from '@/lib/uuid';

const partyOptions: { value: TransactionParty; label: string }[] = [{ value: 'me', label: 'Eu' }, { value: 'partner', label: 'Parceiro(a)' }, { value: 'shared', label: 'Compartilhado' }];

function Choice<T extends string>({ value, selected, label, icon, iconColor, fill = false, onPress }: { value: T; selected: T; label: string; icon?: string; iconColor?: string; fill?: boolean; onPress(value: T): void }) { const active = value === selected; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onPress(value)} style={[styles.choice, fill && styles.choiceFill, active && styles.choiceActive]}><View style={styles.choiceContent}>{icon ? <CategoryIcon name={icon} color={active ? '#FFFFFF' : (iconColor ?? palette.greenVault)} size={18} /> : null}<Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></View></Pressable>; }

function AddChip({ label, onPress }: { label: string; onPress(): void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.addChip}><Text style={styles.addChipText}>＋ {label}</Text></Pressable>; }

function PartyChoice({ value, selected, label, initial, onPress }: { value: TransactionParty; selected: TransactionParty; label: string; initial: string; onPress(value: TransactionParty): void }) {
  const active = value === selected;
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onPress(value)} style={[styles.partyItem, active && styles.partyItemActive]}>
    <View style={[styles.partyAvatar, active && styles.partyAvatarActive]}>
      {value === 'shared' ? <CategoryIcon name="group" color={active ? '#FFFFFF' : palette.greenVault} size={22} /> : <Text style={[styles.partyInitial, active && styles.partyInitialActive]}>{initial}</Text>}
    </View>
    <Text style={[styles.partyLabel, active && styles.partyLabelActive]}>{label}</Text>
  </Pressable>;
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const { session, onboarding, customCategories, customPaymentMethods, proposal, setProposal } = usePrototype();
  const { settings } = useHouseholdSettings();
  const { currency, format } = useMoney();
  // The keypad opens with the screen when starting from scratch, so the amount is ready
  // to type straight away — but not when editing a proposal that already has a value.
  const [keypadOpen, setKeypadOpen] = useState(!proposal);
  const [kind, setKind] = useState<TransactionKind>(proposal?.kind ?? 'expense');
  const [description, setDescription] = useState(proposal?.description ?? '');
  const [amount, setAmount] = useState(proposal ? String(Number(proposal.amountCents) / 100).replace('.', ',') : '');
  const [party, setParty] = useState<TransactionParty>(proposal?.party ?? 'me');
  const [category, setCategory] = useState(proposal?.category ?? 'Mercado');
  const [date, setDate] = useState(proposal?.localDate ?? todayISODate());
  const [paymentMethod, setPaymentMethod] = useState(proposal?.paymentMethod ?? presetPaymentMethods[0].name);
  const [note, setNote] = useState(proposal?.note ?? '');
  const startsRecurring = useLocalSearchParams<{ recurring?: string }>().recurring === '1';
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency | null>(proposal?.recurrence?.frequency ?? (startsRecurring ? 'monthly' : null));
  const [details, setDetails] = useState(startsRecurring || Boolean(proposal?.note || proposal?.recurrence));
  const [installments, setInstallments] = useState(proposal?.installment?.total ?? 1);
  const [errors, setErrors] = useState<{ description?: string; amount?: string; date?: string; category?: string }>({});

  const categories = [...presetCategories[kind].map((item) => item.name), ...customCategories[kind].map((item) => item.name)];
  const paymentMethods = [...presetPaymentMethods, ...customPaymentMethods];
  // Only a credit method can be split, and only an expense — income is not installed.
  const canInstall = kind === 'expense' && (paymentMethods.find((item) => item.name === paymentMethod)?.credit ?? false);

  function changeKind(next: TransactionKind) { setKind(next); setCategory(presetCategories[next][0].name); }

  function submit() {
    const cents = parseBRL(amount);
    const next = { description: description.trim().length < 2 ? 'Dê um nome para este movimento.' : undefined, amount: cents === null ? 'Digite um valor maior que zero.' : undefined, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? undefined : 'Escolha uma data.', category: category ? undefined : 'Escolha uma categoria.' };
    setErrors(next);
    if (Object.values(next).some(Boolean) || cents === null) return;
    setProposal({ id: uuid(), kind, description: description.trim(), amountCents: cents, accountName: onboarding.account?.name ?? 'Conta principal', category, localDate: date, party: settings.enabled ? party : 'me', paymentMethod, note: note.trim() || undefined, recurrence: recurrenceFrequency ? { frequency: recurrenceFrequency } : undefined, installment: canInstall && installments > 1 ? { purchaseId: '', number: 1, total: installments, purchaseAmountCents: cents } : undefined, status: 'proposed' });
    router.push('/transaction/review');
  }

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <View style={styles.topSpacer} />
      <View accessibilityRole="radiogroup" style={styles.segment}><Choice fill value="expense" selected={kind} label="Despesa" onPress={changeKind} /><Choice fill value="income" selected={kind} label="Renda" onPress={changeKind} /></View>
      <Pressable accessibilityLabel="Fechar e voltar à visão geral" hitSlop={10} onPress={() => router.replace('/dashboard')} style={styles.closeButton}><Text style={styles.closeIcon}>×</Text></Pressable>
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
      <Field label={kind === 'expense' ? 'O que você pagou?' : 'De onde veio?'} value={description} onChangeText={setDescription} error={errors.description} placeholder={kind === 'expense' ? 'Ex.: Compras do mercado' : 'Ex.: Salário'} />

      {settings.enabled ? <View style={styles.group}><Text style={styles.label}>{kind === 'expense' ? 'Quem pagou?' : 'Quem recebeu?'}</Text><View accessibilityRole="radiogroup" style={styles.partyRow}>{partyOptions.map((item) => { const ownName = session?.name?.trim().split(/\s+/)[0] || 'Eu'; const label = item.value === 'me' ? ownName : item.label; const initial = item.value === 'me' ? ownName.charAt(0).toUpperCase() : item.label.charAt(0).toUpperCase(); return <PartyChoice key={item.value} value={item.value} selected={party} label={label} initial={initial} onPress={setParty} />; })}</View></View> : null}

      <View style={styles.group}>
        <View style={styles.categoryHeader}><Text style={styles.label}>Categoria</Text><Pressable accessibilityLabel="Editar categorias" onPress={() => router.push('/settings/categories')}><Text style={styles.categoryPlus}>＋</Text></Pressable></View>
        <ScrollGrid>
          {categories.map((item) => { const metadata = findCategory(kind, item, customCategories[kind]); return <Choice key={item} value={item} selected={category} icon={metadata?.icon} iconColor={metadata?.color} label={item} onPress={setCategory} />; })}
          <AddChip label="Nova categoria" onPress={() => router.push(`/settings/categories/new?kind=${kind}`)} />
        </ScrollGrid>
      </View>

      <CalendarField label="Data" value={date} onChange={setDate} error={errors.date} />

      <View style={styles.group}>
        <Text style={styles.label}>{kind === 'expense' ? 'Forma de pagamento' : 'Onde entrou?'}</Text>
        <ScrollGrid>
          {paymentMethods.map((item) => <Choice key={item.id} value={item.name} selected={paymentMethod} icon={item.icon} label={item.name} onPress={setPaymentMethod} />)}
          <AddChip label="Adicionar método" onPress={() => router.push('/settings/payment-methods')} />
        </ScrollGrid>
      </View>

      {canInstall ? <View style={styles.group}>
        <Text style={styles.label}>Parcelas</Text>
        <ScrollGrid>
          <Choice value="1" selected={String(installments)} label="À vista" onPress={(value) => setInstallments(Number(value))} />
          {installmentOptions.map((count) => <Choice key={count} value={String(count)} selected={String(installments)} label={`${count}x`} onPress={(value) => setInstallments(Number(value))} />)}
        </ScrollGrid>
        {installments > 1 ? <Text style={styles.installmentHint}>
          {installments}x de {format(splitInstallments(parseBRL(amount) ?? 0n, installments)[installments - 1])}
          {' · '}primeira em {formatShortDatePT(date)}
        </Text> : null}
      </View> : null}

      <Pressable onPress={() => setDetails((value) => !value)} style={styles.details}><Text style={styles.detailsText}>{details ? '− Ocultar detalhes' : '＋ Nota e recorrência'}</Text></Pressable>
      {details && <View style={styles.detailCard}>
        <Field label="Nota (opcional)" value={note} onChangeText={setNote} multiline placeholder="Adicione um contexto para lembrar depois" />
        <RecurrenceField date={date} frequency={recurrenceFrequency} onChange={setRecurrenceFrequency} />
      </View>}

      <Button label={`Revisar ${kind === 'expense' ? 'despesa' : 'renda'}`} onPress={submit} />
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
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryPlus: { color: palette.greenAction, fontFamily: font.regular, fontSize: 28, lineHeight: 28 },
  label: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  choice: { minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  choiceFill: { flex: 1 },
  choiceActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  choiceContent: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  choiceText: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  choiceTextActive: { color: 'white' },
  addChip: { minHeight: 44, borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.greenVault, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  addChipText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
  partyRow: { flexDirection: 'row', gap: 10 },
  partyItem: { flex: 1, minWidth: 0, minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  partyItemActive: { borderColor: palette.greenVault, backgroundColor: palette.mint },
  partyAvatar: { width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, alignItems: 'center', justifyContent: 'center' },
  partyAvatarActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  partyInitial: { color: palette.greenVault, fontFamily: font.display, fontSize: 20 },
  partyInitialActive: { color: 'white' },
  partyLabel: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 12, textAlign: 'center' },
  partyLabelActive: { color: palette.greenVault, fontFamily: font.semibold },
  details: { minHeight: 48, justifyContent: 'center' },
  detailsText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 15 },
  detailCard: { gap: 14, borderRadius: 16, padding: 16, backgroundColor: palette.mint },
  installmentHint: { color: palette.greenVault, fontFamily: font.medium, fontSize: 13 },
});
