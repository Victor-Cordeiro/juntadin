import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MONTHS_PT, WEEKDAYS_PT, toISODate, todayISODate } from '@/lib/dates';
import { font, palette } from '@/theme/tokens';

export type DayMarker = { income: bigint; expense: bigint };

function compact(cents: bigint): string {
  const value = Number(cents) / 100;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`.replace('.', ',');
  return String(Math.round(value));
}

/** Month grid shared by the date field and the movements browser. */
export function MonthCalendar({ month, onChangeMonth, selected, onSelect, markers, showHeader = true }: {
  month: Date;
  onChangeMonth?(next: Date): void;
  selected?: string | null;
  onSelect(iso: string): void;
  markers?: Record<string, DayMarker>;
  showHeader?: boolean;
}) {
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = todayISODate();

  return (
    <View style={styles.wrap}>
      {showHeader && onChangeMonth ? (
        <View style={styles.nav}>
          <Pressable accessibilityLabel="Mês anterior" hitSlop={10} onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.navButton}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Text style={styles.navTitle}>{MONTHS_PT[month.getMonth()]} {month.getFullYear()}</Text>
          <Pressable accessibilityLabel="Próximo mês" hitSlop={10} onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.navButton}>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.weekRow}>
        {WEEKDAYS_PT.map((weekday, index) => <Text key={index} style={styles.weekLabel}>{weekday}</Text>)}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={`empty-${index}`} style={styles.cell} />;
          const iso = toISODate(new Date(month.getFullYear(), month.getMonth(), day));
          const isSelected = iso === selected;
          const isToday = iso === today;
          const marker = markers?.[iso];
          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Dia ${day}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(iso)}
                style={[styles.day, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                {marker && !isSelected ? (
                  <View style={styles.markers}>
                    {marker.income > 0n ? <Text style={styles.markerIncome}>+{compact(marker.income)}</Text> : null}
                    {marker.expense > 0n ? <Text style={styles.markerExpense}>−{compact(marker.expense)}</Text> : null}
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: palette.greenVault, fontSize: 26, lineHeight: 28 },
  navTitle: { color: palette.ink, fontFamily: font.display, fontSize: 18 },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: CELL, textAlign: 'center', color: palette.inkMuted, fontFamily: font.semibold, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, paddingVertical: 2, alignItems: 'center' },
  day: { width: '100%', minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  daySelected: { backgroundColor: palette.greenVault },
  dayToday: { borderWidth: 1, borderColor: palette.greenAction },
  dayText: { color: palette.ink, fontFamily: font.medium, fontSize: 15 },
  dayTextSelected: { color: 'white', fontFamily: font.semibold },
  markers: { alignItems: 'center' },
  markerIncome: { color: palette.greenAction, fontFamily: font.medium, fontSize: 9 },
  markerExpense: { color: palette.deficit, fontFamily: font.medium, fontSize: 9 },
});
