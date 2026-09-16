import type { TransactionKind } from '@juntadin/contracts';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/bottom-nav';
import { CategoryIcon } from '@/components/category-icon';
import { Button, Screen } from '@/components/juntadin-ui';
import { MonthCalendar, type DayMarker } from '@/components/month-calendar';
import { findCategory } from '@/data/categories';
import { useMoney } from '@/hooks/use-money';
import { addMonths, dayLabel, groupByDay, inMonth, monthKeyOf, monthLabel } from '@/lib/analytics';
import { installmentLabel } from '@/lib/installments';
import { usePrototype, type ConfirmedTransaction } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { font, palette } from '@/theme/tokens';

type Filter = 'all' | TransactionKind;

export default function MovementsScreen() {
  const router = useRouter();
  const { hydrated, session, onboarding, transactions, customCategories } = usePrototype();
  const { settings } = useHouseholdSettings();
  const { format } = useMoney();
  const [filter, setFilter] = useState<Filter>('all');
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => { if (hydrated && !session) router.replace('/auth/login'); else if (hydrated && session && !onboarding.completed) router.replace('/onboarding/cycle'); }, [hydrated, onboarding.completed, router, session]);

  const monthItems = useMemo(() => inMonth(transactions, monthKeyOf(month)), [month, transactions]);

  const markers = useMemo(() => {
    const result: Record<string, DayMarker> = {};
    for (const item of monthItems) {
      const current = result[item.localDate] ?? { income: 0n, expense: 0n };
      if (item.kind === 'income') current.income += item.amountCents;
      else current.expense += item.amountCents;
      result[item.localDate] = current;
    }
    return result;
  }, [monthItems]);

  if (!hydrated || !session || !onboarding.completed) return null;

  const filtered = monthItems.filter((item) => (filter === 'all' || item.kind === filter) && (!selectedDay || item.localDate === selectedDay));
  const days = groupByDay(filtered);
  const ownInitial = (session.name.trim()[0] ?? '?').toUpperCase();

  function shiftMonth(delta: number) { setMonth((current) => addMonths(current, delta)); setSelectedDay(null); }

  function pickDay(iso: string) {
    setSelectedDay((current) => (current === iso ? null : iso));
  }

  return <Screen contentStyle={styles.screen} footer={<BottomNav />}>
    <View style={styles.top}>
      <View style={styles.monthNav}>
        <Pressable accessibilityLabel="Mês anterior" hitSlop={8} onPress={() => shiftMonth(-1)}><Text style={styles.arrow}>‹</Text></Pressable>
        <Text accessibilityRole="header" style={styles.month}>{monthLabel(month)}</Text>
        <Pressable accessibilityLabel="Próximo mês" hitSlop={8} onPress={() => shiftMonth(1)}><Text style={styles.arrow}>›</Text></Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={calendarOpen ? 'Fechar calendário' : 'Abrir calendário'}
        accessibilityState={{ expanded: calendarOpen }}
        onPress={() => setCalendarOpen((open) => !open)}
        style={[styles.calendarToggle, calendarOpen && styles.calendarToggleActive]}
      >
        <CategoryIcon name={calendarOpen ? 'close' : 'calendar_month'} color={calendarOpen ? 'white' : palette.greenVault} size={22} />
      </Pressable>
    </View>

    <View style={styles.filters}>
      {([['all', 'Tudo'], ['expense', 'Despesas'], ['income', 'Rendas']] as const).map(([value, label]) => {
        const active = filter === value;
        return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setFilter(value)} style={[styles.filter, active && styles.filterActive]}>
          <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
        </Pressable>;
      })}
    </View>

    {calendarOpen ? <View style={styles.calendarCard}>
      <MonthCalendar month={month} selected={selectedDay} onSelect={pickDay} markers={markers} showHeader={false} />
      {selectedDay ? <Pressable onPress={() => setSelectedDay(null)} style={styles.clearDay}><Text style={styles.clearDayText}>Ver o mês inteiro</Text></Pressable> : null}
    </View> : null}

    {selectedDay && !calendarOpen ? <View style={styles.dayChip}>
      <Text style={styles.dayChipText}>{dayLabel(selectedDay)}</Text>
      <Pressable accessibilityLabel="Limpar filtro de dia" hitSlop={8} onPress={() => setSelectedDay(null)}><Text style={styles.dayChipClear}>×</Text></Pressable>
    </View> : null}

    {days.length === 0 ? <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{selectedDay ? 'Nenhum movimento no dia selecionado' : 'Nenhum movimento neste mês'}</Text>
      <Text style={styles.emptyBody}>Não há receitas nem despesas. Use o botão abaixo para adicionar uma.</Text>
      <Button label={selectedDay ? 'Adicionar neste dia' : 'Adicionar movimento'} onPress={() => router.push('/transaction/new')} />
    </View> : days.map((day) => <View key={day.date} style={styles.dayBlock}>
      <View style={styles.dayHead}>
        <Text style={styles.dayTitle}>{dayLabel(day.date)}</Text>
        <View style={styles.dayTotals}>
          {day.income > 0n ? <Text style={styles.dayIncome}>+{format(day.income)}</Text> : null}
          {day.expense > 0n ? <Text style={styles.dayExpense}>−{format(day.expense)}</Text> : null}
        </View>
      </View>
      <View style={styles.card}>
        {day.items.map((item, index) => <Row key={item.id} item={item} divided={index > 0} format={format} customCategories={customCategories} showParty={settings.enabled} ownInitial={ownInitial} />)}
      </View>
    </View>)}
  </Screen>;
}

function Row({ item, divided, format, customCategories, showParty, ownInitial }: {
  item: ConfirmedTransaction;
  divided: boolean;
  format(cents: bigint): string;
  customCategories: ReturnType<typeof usePrototype>['customCategories'];
  showParty: boolean;
  ownInitial: string;
}) {
  const meta = findCategory(item.kind, item.category, customCategories[item.kind]);
  const color = meta?.color ?? palette.greenVault;
  const party = item.party ?? 'me';
  const initial = party === 'me' ? ownInitial : party === 'partner' ? 'P' : null;

  return <View style={[styles.row, divided && styles.rowDivided]}>
    <View style={styles.iconWrap}>
      <View style={[styles.icon, { backgroundColor: `${color}22` }]}><CategoryIcon name={meta?.icon ?? 'category'} color={color} size={24} /></View>
      {showParty ? <View style={[styles.avatar, party === 'shared' && styles.avatarShared]}>
        {initial ? <Text style={styles.avatarText}>{initial}</Text> : <CategoryIcon name="group" color="white" size={12} />}
      </View> : null}
    </View>
    <View style={styles.rowText}>
      <View style={styles.rowTitleLine}>
        <Text numberOfLines={1} style={styles.rowTitle}>{item.description || item.category}</Text>
        {item.installment ? <View style={styles.installmentTag}><Text style={styles.installmentTagText}>{installmentLabel(item.installment)}</Text></View> : null}
        {item.recurrence ? <CategoryIcon name="repeat" color={palette.inkMuted} size={14} /> : null}
      </View>
      <Text style={styles.rowMeta}>{item.category}{item.paymentMethod ? ` · ${item.paymentMethod}` : ''}</Text>
    </View>
    <Text style={[styles.amount, item.kind === 'income' && styles.income]}>{item.kind === 'income' ? '+' : '−'}{format(item.amountCents)}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14, paddingTop: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthNav: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  month: { color: palette.ink, fontFamily: font.display, fontSize: 21, textAlign: 'center' },
  arrow: { color: palette.greenVault, fontSize: 32, lineHeight: 34, paddingHorizontal: 10 },
  calendarToggle: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  calendarToggleActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  filters: { flexDirection: 'row', gap: 8, backgroundColor: palette.mint, borderRadius: 999, padding: 4 },
  filter: { flex: 1, minHeight: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: palette.greenVault },
  filterText: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 14 },
  filterTextActive: { color: 'white' },
  calendarCard: { padding: 14, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, gap: 8 },
  clearDay: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  clearDayText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
  dayChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 40, borderRadius: 999, backgroundColor: palette.mint },
  dayChipText: { color: palette.greenVault, fontFamily: font.semibold, fontSize: 14 },
  dayChipClear: { color: palette.greenVault, fontSize: 20, lineHeight: 22 },
  dayBlock: { gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  dayTitle: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 14 },
  dayTotals: { flexDirection: 'row', gap: 12 },
  dayIncome: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
  dayExpense: { color: palette.deficit, fontFamily: font.semibold, fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 76, paddingHorizontal: 15, paddingVertical: 12 },
  rowDivided: { borderTopWidth: 1, borderTopColor: palette.border },
  iconWrap: { width: 46, height: 46 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatar: { position: 'absolute', right: -5, bottom: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: palette.greenVault, borderWidth: 2, borderColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  avatarShared: { backgroundColor: palette.gold },
  avatarText: { color: 'white', fontFamily: font.semibold, fontSize: 10 },
  rowText: { flex: 1, gap: 3 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { flexShrink: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  installmentTag: { backgroundColor: palette.mint, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  installmentTagText: { color: palette.greenVault, fontFamily: font.semibold, fontSize: 11 },
  rowMeta: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12 },
  amount: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  income: { color: palette.greenAction },
  empty: { alignItems: 'center', gap: 12, padding: 26, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.border, backgroundColor: palette.surface },
  emptyTitle: { color: palette.ink, fontFamily: font.display, fontSize: 20, textAlign: 'center' },
  emptyBody: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
