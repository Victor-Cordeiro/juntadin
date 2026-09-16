import type { RecurrenceFrequency } from '@juntadin/contracts';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { addRecurrence, formatShortDatePT, recurrenceOptions } from '@/lib/dates';
import { font, palette } from '@/theme/tokens';

export function RecurrenceField({ date, frequency, onChange }: { date: string; frequency: RecurrenceFrequency | null; onChange(value: RecurrenceFrequency | null): void }) {
  const [open, setOpen] = useState(false);
  const active = recurrenceOptions.find((option) => option.value === frequency);
  const nextDate = frequency ? addRecurrence(date, frequency) : null;

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.button, active && styles.buttonActive]}>
        <CategoryIcon name="repeat" color={active ? 'white' : palette.greenVault} size={18} />
        <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{active ? active.label : 'Recorrência'}</Text>
      </Pressable>
      {active && nextDate ? <Text style={styles.preview}>Próxima ocorrência: {formatShortDatePT(nextDate)}</Text> : null}
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Repetir movimento</Text>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: frequency === null }} onPress={() => { onChange(null); setOpen(false); }} style={[styles.option, frequency === null && styles.optionActive]}>
              <Text style={[styles.optionText, frequency === null && styles.optionTextActive]}>Não repetir</Text>
            </Pressable>
            {recurrenceOptions.map((option) => {
              const isActive = frequency === option.value;
              const preview = addRecurrence(date, option.value);
              return (
                <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: isActive }} onPress={() => { onChange(option.value); setOpen(false); }} style={[styles.option, isActive && styles.optionActive]}>
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
                  <Text style={[styles.optionHint, isActive && styles.optionHintActive]}>a partir de {formatShortDatePT(preview)}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => setOpen(false)} style={styles.close}><Text style={styles.closeText}>Fechar</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingHorizontal: 16 },
  buttonActive: { backgroundColor: palette.greenVault, borderColor: palette.greenVault },
  buttonText: { color: palette.ink, fontFamily: font.medium, fontSize: 14 },
  buttonTextActive: { color: 'white' },
  preview: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,33,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, backgroundColor: palette.surface, padding: 20, gap: 8 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 18, marginBottom: 6 },
  option: { minHeight: 52, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: palette.paper },
  optionActive: { backgroundColor: palette.greenVault },
  optionText: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  optionTextActive: { color: 'white' },
  optionHint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  optionHintActive: { color: palette.mint },
  close: { alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: 4 },
  closeText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 15 },
});
