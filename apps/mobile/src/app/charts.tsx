import type { TransactionKind } from '@juntadin/contracts';
import { useMoney } from '@/hooks/use-money';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/bottom-nav';
import { CategoryBars, DonutChart, TrendChart, type TrendPoint } from '@/components/charts';
import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/juntadin-ui';
import { chartPalette, findCategory } from '@/data/categories';
import { findPaymentMethod, presetPaymentMethods } from '@/data/payment-methods';
import {
  addMonths, dayLabel, groupByDay, groupSlices, inMonth, monthKeyOf, monthLabel,
  monthSeries, partyLabels, projectMonths, shortMonthLabel, sumOf, type MonthPoint, type Slice,
} from '@/lib/analytics';
import { usePrototype } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { font, palette } from '@/theme/tokens';

type TabKey = 'daily' | 'categories' | 'methods' | 'people' | 'trend';
const partyColors: Record<string, string> = { me: chartPalette[0], partner: chartPalette[1], shared: chartPalette[2] };

export default function ChartsScreen() {
  const router = useRouter();
  const { hydrated, session, onboarding, transactions, customCategories, customPaymentMethods } = usePrototype();
  const { settings } = useHouseholdSettings();
  const { format } = useMoney();
  const [selectedTab, setTab] = useState<TabKey>('daily');
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => { if (hydrated && !session) router.replace('/auth/login'); else if (hydrated && session && !onboarding.completed) router.replace('/onboarding/cycle'); }, [hydrated, onboarding.completed, router, session]);

  const tabs = useMemo(() => ([
    { key: 'daily' as const, label: 'Movimentos Diários' },
    { key: 'categories' as const, label: 'Categorias' },
    { key: 'methods' as const, label: 'Métodos pagamento' },
    ...(settings.enabled ? [{ key: 'people' as const, label: 'Usuários' }] : []),
    { key: 'trend' as const, label: 'Tendência' },
  ]), [settings.enabled]);

  // Turning the partner off removes the people tab; falling back while rendering
  // avoids a second render pass just to correct the selection.
  const tab = tabs.some((item) => item.key === selectedTab) ? selectedTab : 'daily';

  if (!hydrated || !session || !onboarding.completed) return null;

  const monthItems = inMonth(transactions, monthKeyOf(month));
  const kindItems = monthItems.filter((item) => item.kind === kind);
  const income = sumOf(monthItems, 'income');
  const expense = sumOf(monthItems, 'expense');
  const kindTotal = sumOf(kindItems);
  const tint = kind === 'expense' ? palette.deficit : palette.greenAction;
  const isTrend = tab === 'trend';

  const categorySlices = groupSlices(kindItems, (item) => item.category, (name) => {
    const found = findCategory(kind, name, customCategories[kind]);
    return { label: name, color: found?.color ?? chartPalette[0], icon: found?.icon ?? 'category' };
  });
  const methodOrder = [...presetPaymentMethods, ...customPaymentMethods];
  const methodSlices = groupSlices(kindItems, (item) => item.paymentMethod || 'Nenhum', (name) => {
    const index = methodOrder.findIndex((method) => method.name === name);
    return { label: name, color: chartPalette[(index < 0 ? methodOrder.length : index) % chartPalette.length], icon: findPaymentMethod(name, customPaymentMethods)?.icon ?? 'sell' };
  });
  const peopleSlices = groupSlices(kindItems, (item) => item.party ?? 'me', (key) => ({
    label: key === 'me' ? session.name.split(' ')[0] : partyLabels[key as keyof typeof partyLabels] ?? key,
    color: partyColors[key] ?? chartPalette[3],
    icon: key === 'shared' ? 'group' : 'person',
  }));

  function shiftMonth(delta: number) { setMonth((current) => addMonths(current, delta)); }

  return <Screen contentStyle={styles.screen} footer={<BottomNav />}>
    <View style={styles.monthNav}>
      <Pressable accessibilityLabel="Anterior" hitSlop={8} onPress={() => shiftMonth(-1)} disabled={isTrend}><Text style={[styles.arrow, isTrend && styles.arrowOff]}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.monthTitle}>{isTrend ? 'Últimos 6 meses' : monthLabel(month)}</Text>
      <Pressable accessibilityLabel="Próximo" hitSlop={8} onPress={() => shiftMonth(1)} disabled={isTrend}><Text style={[styles.arrow, isTrend && styles.arrowOff]}>›</Text></Pressable>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
      <View style={styles.tabs}>
        {tabs.map((item) => {
          const active = item.key === tab;
          return <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setTab(item.key)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>;
        })}
      </View>
    </ScrollView>

    {tab === 'daily' ? <DailyTab items={monthItems} income={income} expense={expense} kindOf={(name, itemKind) => findCategory(itemKind, name, customCategories[itemKind])} /> : null}

    {tab === 'categories' || tab === 'methods' || tab === 'people' ? <>
      <DonutChart
        slices={tab === 'categories' ? categorySlices : tab === 'methods' ? methodSlices : peopleSlices}
        caption={kind === 'expense' ? 'Despesas Totais' : 'Receitas Totais'}
        value={`${kind === 'income' ? '+' : ''}${format(kindTotal)}`}
        tint={tint}
      />
      <KindToggle kind={kind} onChange={setKind} />
      <SliceList slices={tab === 'categories' ? categorySlices : tab === 'methods' ? methodSlices : peopleSlices} kind={kind} />
      {tab === 'people' && categorySlices.length > 0 ? <View style={styles.card}><Text style={styles.cardTitle}>Por categoria</Text><CategoryBars slices={categorySlices.slice(0, 5)} /></View> : null}
    </> : null}

    {isTrend ? <TrendTab transactions={transactions} limitCents={settings.monthlyLimitCents ? BigInt(settings.monthlyLimitCents) : null} /> : null}
  </Screen>;
}

function KindToggle({ kind, onChange }: { kind: TransactionKind; onChange(value: TransactionKind): void }) {
  return <View accessibilityRole="radiogroup" style={styles.toggle}>
    {(['expense', 'income'] as const).map((value) => {
      const active = kind === value;
      return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onChange(value)} style={[styles.toggleItem, active && styles.toggleItemActive]}>
        <Text style={[styles.toggleLabel, active && { color: value === 'expense' ? palette.deficit : palette.greenAction }]}>{value === 'expense' ? 'Despesas' : 'Rendas'}</Text>
      </Pressable>;
    })}
  </View>;
}

function SliceList({ slices, kind }: { slices: Slice[]; kind: TransactionKind }) {
  const { format } = useMoney();
  if (slices.length === 0) return <EmptyState message={kind === 'expense' ? 'Nenhuma despesa neste mês.' : 'Nenhuma renda neste mês.'} />;
  return <View style={styles.list}>
    {slices.map((slice, index) => <View key={slice.key} style={[styles.listRow, index > 0 && styles.listDivider]}>
      <View style={[styles.listIcon, { backgroundColor: `${slice.color}22` }]}><CategoryIcon name={slice.icon ?? 'sell'} color={slice.color} size={22} /></View>
      <Text style={styles.listName}>{slice.label}</Text>
      <View style={styles.listValues}>
        <Text style={styles.listAmount}>{kind === 'income' ? '+' : ''}{format(slice.total)}</Text>
        <Text style={styles.listShare}>{slice.share.toFixed(0)}%</Text>
      </View>
    </View>)}
  </View>;
}

function DailyTab({ items, income, expense, kindOf }: { items: ReturnType<typeof inMonth>; income: bigint; expense: bigint; kindOf(name: string, kind: TransactionKind): { color: string; icon: string } | undefined }) {
  const { format } = useMoney();
  const days = groupByDay(items);
  const total = income + expense;
  const expenseShare = total > 0n ? Number((expense * 100n) / total) : 0;

  return <>
    <View style={styles.card}>
      <View style={styles.totalsRow}>
        <View style={styles.totalBlock}><Text style={styles.totalLabel}>DESPESAS</Text><Text style={[styles.totalValue, { color: palette.deficit }]}>{format(expense)}</Text></View>
        <View style={styles.totalDivider} />
        <View style={styles.totalBlock}><Text style={styles.totalLabel}>RENDAS</Text><Text style={[styles.totalValue, { color: palette.greenAction }]}>+{format(income)}</Text></View>
      </View>
      {total > 0n ? <View style={styles.splitTrack}>
        <View style={[styles.splitFill, { width: `${expenseShare}%`, backgroundColor: palette.deficit }]} />
        <View style={styles.splitGap} />
        <View style={[styles.splitFill, { flex: 1, backgroundColor: palette.greenAction }]} />
      </View> : null}
      <View style={styles.balanceRow}>
        <Text style={styles.totalLabel}>SALDO</Text>
        <Text style={[styles.balanceValue, income - expense < 0n && { color: palette.deficit }]}>{income - expense >= 0n ? '+' : '−'}{format(income - expense < 0n ? expense - income : income - expense)}</Text>
      </View>
    </View>

    {days.length === 0 ? <EmptyState message="Nenhum movimento neste mês." /> : days.map((day) => <View key={day.date} style={styles.dayBlock}>
      <View style={styles.dayHead}>
        <Text style={styles.dayTitle}>{dayLabel(day.date)}</Text>
        <Text style={styles.dayTotals}>
          {day.expense > 0n ? <Text style={{ color: palette.deficit }}>−{format(day.expense)}</Text> : null}
          {day.expense > 0n && day.income > 0n ? '   ' : ''}
          {day.income > 0n ? <Text style={{ color: palette.greenAction }}>+{format(day.income)}</Text> : null}
        </Text>
      </View>
      <View style={styles.list}>
        {day.items.map((item, index) => {
          const meta = kindOf(item.category, item.kind);
          const color = meta?.color ?? chartPalette[0];
          return <View key={item.id} style={[styles.listRow, index > 0 && styles.listDivider]}>
            <View style={[styles.listIcon, { backgroundColor: `${color}22` }]}><CategoryIcon name={meta?.icon ?? 'category'} color={color} size={22} /></View>
            <View style={styles.dayItemText}>
              <Text style={styles.listName}>{item.description}</Text>
              <Text style={styles.dayItemMeta}>{item.category}{item.paymentMethod ? ` · ${item.paymentMethod}` : ''}</Text>
            </View>
            <Text style={[styles.listAmount, item.kind === 'income' && { color: palette.greenAction }]}>{item.kind === 'income' ? '+' : '−'}{format(item.amountCents)}</Text>
          </View>;
        })}
      </View>
    </View>)}
  </>;
}

function TrendTab({ transactions, limitCents }: { transactions: ReturnType<typeof usePrototype>['transactions']; limitCents: bigint | null }) {
  const { format } = useMoney();
  const now = new Date();
  const history = monthSeries(transactions, now, 6);
  const projection = projectMonths(transactions, now, 3);
  const points: TrendPoint[] = [...history, ...projection].map((point) => ({ label: shortMonthLabel(point.date), income: point.income, expense: point.expense, projected: point.projected }));
  const hasProjection = projection.some((point) => point.income > 0n || point.expense > 0n);

  return <>
    <View style={styles.card}>
      <TrendChart points={points} limitCents={limitCents} />
      <Text style={styles.trendHint}>{hasProjection ? 'O traço pontilhado projeta os próximos meses a partir dos movimentos recorrentes.' : 'Marque um movimento como recorrente para ver a projeção dos próximos meses.'}</Text>
    </View>
    {[...history].reverse().map((point) => <MonthCard key={point.key} point={point} format={format} />)}
    {hasProjection ? projection.map((point) => <MonthCard key={point.key} point={point} format={format} projected />) : null}
  </>;
}

function MonthCard({ point, format, projected = false }: { point: MonthPoint; format(cents: bigint): string; projected?: boolean }) {
  const balance = point.income - point.expense;
  return <View style={styles.monthBlock}>
    <Text style={styles.monthName}>{monthLabel(point.date).split(' de ')[0]}{projected ? ' (projetado)' : ''}</Text>
    <View style={[styles.card, styles.monthCard, projected && styles.monthCardProjected]}>
      <View style={styles.totalBlock}><Text style={styles.totalLabel}>DESPESAS</Text><Text style={styles.monthValue}>{format(point.expense)}</Text></View>
      <View style={styles.totalDivider} />
      <View style={styles.totalBlock}><Text style={styles.totalLabel}>RENDAS</Text><Text style={[styles.monthValue, { color: palette.greenAction }]}>+{format(point.income)}</Text></View>
      <View style={styles.totalDivider} />
      <View style={styles.totalBlock}><Text style={styles.totalLabel}>SALDO</Text><Text style={[styles.monthValue, balance < 0n && { color: palette.deficit }]}>{balance >= 0n ? '+' : '−'}{format(balance < 0n ? -balance : balance)}</Text></View>
    </View>
  </View>;
}

function EmptyState({ message }: { message: string }) {
  return <View style={[styles.card, styles.empty]}><CategoryIcon name="bar_chart_4_bars" color={palette.inkMuted} size={28} /><Text style={styles.emptyText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 16, paddingTop: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { flex: 1, textAlign: 'center', color: palette.ink, fontFamily: font.display, fontSize: 21 },
  arrow: { color: palette.greenVault, fontSize: 34, lineHeight: 36, paddingHorizontal: 10 },
  arrowOff: { opacity: 0.2 },
  // A horizontal ScrollView stretches to fill a flex column parent, which pushed the
  // charts far down the screen. Pinning the height keeps it a tab strip.
  tabsScroll: { flexGrow: 0, flexShrink: 0, height: 44 },
  tabs: { flexDirection: 'row', height: 44, gap: 8, paddingRight: 4, alignItems: 'center' },
  tab: { height: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  tabActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  tabLabel: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 14 },
  tabLabelActive: { color: 'white', fontFamily: font.semibold },
  card: { gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  cardTitle: { color: palette.ink, fontFamily: font.display, fontSize: 18 },
  toggle: { flexDirection: 'row', alignSelf: 'center', borderRadius: 999, backgroundColor: palette.mint, padding: 4, gap: 4 },
  toggleItem: { minHeight: 40, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  toggleItemActive: { backgroundColor: palette.surface },
  toggleLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 15 },
  list: { borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 68, paddingHorizontal: 15, paddingVertical: 10 },
  listDivider: { borderTopWidth: 1, borderTopColor: palette.border },
  listIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listName: { flex: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  listValues: { alignItems: 'flex-end' },
  listAmount: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  listShare: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalBlock: { flex: 1, alignItems: 'center', gap: 5 },
  totalDivider: { width: 1, alignSelf: 'stretch', backgroundColor: palette.border, marginHorizontal: 8 },
  totalLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.6 },
  totalValue: { fontFamily: font.display, fontSize: 21 },
  splitTrack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  splitFill: { height: '100%', borderRadius: 5 },
  splitGap: { width: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 12 },
  balanceValue: { color: palette.greenAction, fontFamily: font.display, fontSize: 19 },
  dayBlock: { gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  dayTotals: { fontFamily: font.semibold, fontSize: 13 },
  dayItemText: { flex: 1, gap: 3 },
  dayItemMeta: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12 },
  monthBlock: { gap: 8 },
  monthName: { color: palette.ink, fontFamily: font.display, fontSize: 19 },
  monthCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10 },
  monthCardProjected: { borderStyle: 'dashed', opacity: 0.75 },
  monthValue: { color: palette.ink, fontFamily: font.display, fontSize: 14, textAlign: 'center' },
  trendHint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyText: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
});
