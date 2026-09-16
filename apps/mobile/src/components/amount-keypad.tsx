import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { font, palette } from '@/theme/tokens';

type Operator = '+' | '−' | '×' | '÷';
const operators: Operator[] = ['÷', '×', '−', '+'];

function toNumber(text: string): number {
  const value = Number(text.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

function toText(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

function apply(left: number, operator: Operator, right: number): number {
  if (operator === '+') return left + right;
  if (operator === '−') return left - right;
  if (operator === '×') return left * right;
  return right === 0 ? left : left / right;
}

/**
 * In-app numeric keypad so entering an amount never raises the OS keyboard.
 * Doubles as a calculator — handy for splitting a bill while typing it.
 */
export function AmountKeypad({ visible, value, currencySymbol, onChange, onClose }: {
  visible: boolean;
  value: string;
  currencySymbol: string;
  onChange(next: string): void;
  onClose(): void;
}) {
  const [pending, setPending] = useState<{ left: number; operator: Operator } | null>(null);
  const [fresh, setFresh] = useState(true);

  function press(key: string) {
    if (key === ',') {
      if (value.includes(',')) return;
      onChange(fresh || value === '' ? '0,' : `${value},`);
      setFresh(false);
      return;
    }
    const next = fresh || value === '0' || value === '' ? key : `${value}${key}`;
    if (next.replace(/\D/g, '').length > 11) return;
    onChange(next);
    setFresh(false);
  }

  function chooseOperator(operator: Operator) {
    const current = toNumber(value);
    setPending(pending ? { left: apply(pending.left, pending.operator, current), operator } : { left: current, operator });
    if (pending) onChange(toText(apply(pending.left, pending.operator, current)));
    setFresh(true);
  }

  function equals() {
    if (!pending) return;
    onChange(toText(apply(pending.left, pending.operator, toNumber(value))));
    setPending(null);
    setFresh(true);
  }

  function backspace() {
    const next = value.length > 1 ? value.slice(0, -1) : '0';
    onChange(next === '' ? '0' : next);
    setFresh(false);
  }

  function clear() {
    onChange('0');
    setPending(null);
    setFresh(true);
  }

  function done() {
    if (pending) equals();
    onClose();
  }

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [',', '0', '⌫']];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={done}>
      <View style={styles.host}>
        <Pressable accessibilityLabel="Fechar teclado" style={styles.dismissArea} onPress={done} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.preview}>
            <Text style={styles.previewSymbol}>{currencySymbol}</Text>
            <Text accessibilityLiveRegion="polite" style={styles.previewValue}>{value || '0'}</Text>
            {pending ? <Text style={styles.pending}>{toText(pending.left)} {pending.operator}</Text> : null}
          </View>

          <View style={styles.pad}>
            <View style={styles.digits}>
              {keys.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((key) => (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityLabel={key === '⌫' ? 'Apagar' : key}
                      onPress={() => (key === '⌫' ? backspace() : press(key))}
                      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                    >
                      {key === '⌫'
                        ? <CategoryIcon name="backspace" color={palette.ink} size={22} />
                        : <Text style={styles.keyText}>{key}</Text>}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.operators}>
              {operators.map((operator) => (
                <Pressable
                  key={operator}
                  accessibilityRole="button"
                  accessibilityLabel={`Operador ${operator}`}
                  onPress={() => chooseOperator(operator)}
                  style={({ pressed }) => [styles.key, styles.operatorKey, pressed && styles.keyPressed, pending?.operator === operator && styles.operatorActive]}
                >
                  <Text style={[styles.operatorText, pending?.operator === operator && styles.operatorTextActive]}>{operator}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={clear} style={({ pressed }) => [styles.action, pressed && styles.keyPressed]}>
              <Text style={styles.clearText}>C</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Calcular" onPress={equals} style={({ pressed }) => [styles.action, pressed && styles.keyPressed]}>
              <Text style={styles.equalsText}>=</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={done} style={({ pressed }) => [styles.action, styles.done, pressed && styles.keyPressed]}>
              <Text style={styles.doneText}>Concluído</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 18, gap: 12, borderTopWidth: 1, borderColor: palette.border },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: palette.border },
  preview: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, minHeight: 44 },
  previewSymbol: { color: palette.inkMuted, fontFamily: font.display, fontSize: 20 },
  previewValue: { color: palette.ink, fontFamily: font.display, fontSize: 34, letterSpacing: -0.5 },
  pending: { color: palette.greenAction, fontFamily: font.medium, fontSize: 14, marginLeft: 6 },
  pad: { flexDirection: 'row', gap: 8 },
  digits: { flex: 3, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  operators: { flex: 1, gap: 8 },
  key: { flex: 1, minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
  keyPressed: { opacity: 0.6 },
  keyText: { color: palette.ink, fontFamily: font.display, fontSize: 24 },
  operatorKey: { backgroundColor: palette.mint },
  operatorActive: { backgroundColor: palette.greenVault },
  operatorText: { color: palette.greenVault, fontFamily: font.display, fontSize: 22 },
  operatorTextActive: { color: 'white' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
  clearText: { color: palette.deficit, fontFamily: font.display, fontSize: 20 },
  equalsText: { color: palette.greenVault, fontFamily: font.display, fontSize: 20 },
  done: { flex: 2, backgroundColor: palette.greenAction },
  doneText: { color: 'white', fontFamily: font.semibold, fontSize: 16 },
});
