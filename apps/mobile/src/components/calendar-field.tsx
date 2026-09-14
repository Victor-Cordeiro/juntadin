import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { MONTHS_PT, WEEKDAYS_PT, formatLongDatePT, parseISODate, toISODate, todayISODate } from '@/lib/dates';
import { font, palette } from '@/theme/tokens';

export function CalendarField({ label, value, onChange, error }: { label: string; value: string; onChange(value: string): void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => { const base = parseISODate(value) ?? new Date(); return new Date(base.getFullYear(), base.getMonth(), 1); });

  function openPicker() { const base = parseISODate(value) ?? new Date(); setCursor(new Date(base.getFullYear(), base.getMonth(), 1)); setOpen(true); }
  function changeMonth(offset: number) { setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)); }
  function pick(day: number) { onChange(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day))); setOpen(false); }

  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const today = todayISODate();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={openPicker} style={[styles.field, error && styles.fieldError]}>
        <Text style={styles.value}>{value ? formatLongDatePT(value) : 'Selecionar data'}</Text>
        <CategoryIcon name="calendar_month" color={palette.greenVault} size={22} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <View style={styles.nav}>
              <Pressable accessibilityLabel="Mês anterior" hitSlop={10} onPress={() => changeMonth(-1)} style={styles.navButton}><Text style={styles.navArrow}>‹</Text></Pressable>
              <Text style={styles.navTitle}>{MONTHS_PT[cursor.getMonth()]} {cursor.getFullYear()}</Text>
              <Pressable accessibilityLabel="Próximo mês" hitSlop={10} onPress={() => changeMonth(1)} style={styles.navButton}><Text style={styles.navArrow}>›</Text></Pressable>
            </View>
            <View style={styles.weekRow}>{WEEKDAYS_PT.map((weekday, index) => <Text key={index} style={styles.weekLabel}>{weekday}</Text>)}</View>
            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (day === null) return <View key={index} style={styles.cell} />;
                const iso = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day));
                const isSelected = iso === value;
                const isToday = iso === today;
                return (
                  <View key={index} style={styles.cell}>
                    <Pressable accessibilityRole="button" accessibilityState={{ selected: isSelected }} onPress={() => pick(day)} style={[styles.dayButton, isSelected && styles.dayButtonSelected, isToday && !isSelected && styles.dayButtonToday]}>
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Pressable onPress={() => setOpen(false)} style={styles.close}><Text style={styles.closeText}>Fechar</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  field: { minHeight: 52, borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  fieldError: { borderColor: palette.deficit },
  value: { flex: 1, color: palette.ink, fontFamily: font.regular, fontSize: 16 },
  error: { color: palette.deficit, fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,33,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, backgroundColor: palette.surface, padding: 20, gap: 14 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: palette.greenVault, fontSize: 26, lineHeight: 28 },
  navTitle: { color: palette.ink, fontFamily: font.display, fontSize: 18, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: CELL, textAlign: 'center', color: palette.inkMuted, fontFamily: font.semibold, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayButtonSelected: { backgroundColor: palette.greenVault },
  dayButtonToday: { borderWidth: 1, borderColor: palette.greenAction },
  dayText: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  dayTextSelected: { color: 'white', fontFamily: font.semibold },
  close: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  closeText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 15 },
});
