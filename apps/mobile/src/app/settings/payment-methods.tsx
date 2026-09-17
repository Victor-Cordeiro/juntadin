/* eslint-disable react-hooks/refs */
import { useRouter } from 'expo-router';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef } from 'react';

import { Screen } from '@/components/juntadin-ui';
import { CategoryIcon } from '@/components/category-icon';
import { presetPaymentMethods } from '@/data/payment-methods';
import { usePrototype } from '@/state/prototype-context';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { customPaymentMethods, paymentMethodOrder, reorderPaymentMethods } = usePrototype();
  const allMethods = [...presetPaymentMethods, ...customPaymentMethods]; const methods = [...allMethods].sort((a, b) => (paymentMethodOrder.indexOf(a.id) < 0 ? 9999 : paymentMethodOrder.indexOf(a.id)) - (paymentMethodOrder.indexOf(b.id) < 0 ? 9999 : paymentMethodOrder.indexOf(b.id)));
  function move(from: number, to: number) { if (to < 0 || to >= methods.length) return; const ids = methods.map((item) => item.id); const [item] = ids.splice(from, 1); ids.splice(to, 0, item); reorderPaymentMethods(ids); }
  return <Screen>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={goBack}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Editar métodos</Text><Pressable accessibilityLabel="Adicionar método" onPress={() => router.push('/settings/payment-methods/new')}><Text style={styles.plus}>＋</Text></Pressable></View>
    <Text style={styles.hint}>Arraste para reordenar</Text><View style={styles.list}>{methods.map((method, index) => <DraggableMethod key={method.id} method={method} index={index} onMove={move} />)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, lineHeight: 40, width: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 25, textAlign: 'center' },
  plus: { color: palette.greenAction, fontSize: 34, lineHeight: 38, width: 40, textAlign: 'right' },
  list: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginTop: 12 },
  item: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.border },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint },
  itemName: { flex: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 17 },
  hint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, marginTop: 12 },
  dragHandle: { padding: 10 }, drag: { color: palette.border, fontSize: 24 },
});

function DraggableMethod({ method, index, onMove }: { method: (typeof presetPaymentMethods)[number]; index: number; onMove(from: number, to: number): void }) { const start = useRef(0); const responder = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderGrant: () => { start.current = index; }, onPanResponderMove: (_event, gesture) => { const offset = Math.round(gesture.dy / 72); if (offset) { const target = start.current + offset; onMove(start.current, target); start.current = target; } } })).current; return <View style={styles.item}><View style={styles.iconBox}><CategoryIcon name={method.icon} color={palette.greenVault} size={26} /></View><Text style={styles.itemName}>{method.name}</Text><View accessibilityLabel={`Arrastar ${method.name}`} {...responder.panHandlers} style={styles.dragHandle}><Text style={styles.drag}>⠿</Text></View></View>; }
